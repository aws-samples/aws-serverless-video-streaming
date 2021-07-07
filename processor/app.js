// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const _ = require("lodash");
const axios = require('axios');
const ejs = require("ejs");
const fs = require("fs");
const NodeMediaServer = require("node-media-server");
const { exec } = require('child_process');
const CP = require("child_process");
const config = require("./lib/config");
const db = require("./lib/db");
const hls = require("./lib/hls");
const abr = require("./lib/abr");
const ecs = require("./lib/ecs");
const cache = require("./lib/cache");
const logger = require("./lib/logger");
const fsTool = require("./lib/fs");
const image = require("./lib/image");
const motionDetect = require("./lib/motion");
const options = require("./lib/ffmpeg");
const path = require("path");
const spawn = CP.spawn;
const RETRY_THRESHOLD = 5;

//live streaming  path
const liveStreamingPath = config.isCluster ||config.isCodec?
  config.livePath + "/livestreaming/" + config.streamChannel + "/" :
  config.basePath + "/livestreaming/" + config.streamChannel + "/";

//node media server param
const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8080,
    allow_origin: "*",
  },
};

var SERVER_ADDRESS;
/**
 * init video processor function 
 */
const initServer = async () => {
  try {
    SERVER_ADDRESS = process.env.NODE_ENV === "production" ? await ecs.getServer() : "";
    await initRecordResources();
    await initLiveResources();
    //reload nginx
    if (config.isCluster||config.isCodec)
      await generateNginxConf();
    const motion = config.isMotion;
    let p2p;
    let pd;
    const result = motionDetect.motionDetect(motion, p2p, pd);
    p2p = result.p2p;
    pd = result.pd;

    if (config.isRecord) {
      if (config.isImage || config.isMotion || config.isVideo || config.isOnDemand) {
        logger.log('start recording process');
        await runRecordProcess(motion, p2p, pd);
        this.streams = new Map();
        this.streams.set(config.streamChannel, Date.now());
        // Start the VOD S3 file watcher and sync.
        await hls.monitorDir(config.basePath, this.streams);
      }
      else {
         ecs.shutdown(); //shutdown self
      }
      return;
    }
 
    if (config.isCodec&&config.taskType==='codec') {
      const params = options.getCodecParams();
      logger.log('********* start codec live streaming process with params:' + params);
      await mkdirsSync(liveStreamingPath + "360p");
      await mkdirsSync(liveStreamingPath + "480p");
      await mkdirsSync(liveStreamingPath + "720p");
      await mkdirsSync(liveStreamingPath + "1080p");
      await runLiveProcess(params, false);
      await abr.createPlaylist(config.livePath + "/livestreaming", config.streamChannel);
      return;
    }

    var nms = new NodeMediaServer(nmsConfig);
    nms.run();

    //
    if (config.isMaster) { //if is cluster mode
      if (config.IS_RELAY) {
        logger.log('*** start relay process on master task ***');
        await runRelayProcess();
      }
      if (config.isLive || config.isCMAF) {
        logger.log('********* start hls live streaming process on master task*********');
        await runLiveProcess(options.getLiveParams(), true);
      }
      if (config.isFLV) {
        if (!config.isCluster) {
          logger.log('********* start flv live streaming process on master task *********');
          await runLiveProcess(options.getFLVParams(), true);
          await axios.get('http://localhost:8000/api/server', { timeout: 2000 })
            .then(function (response) {
              logger.log(response.data);
            })
            .catch(function (error) {
              //invoke task stop
              logger.log("get api status error: " + error);
            })
        }
      }
    }
    else {
      if (config.isFLV) {
        logger.log('********* start flv live streaming process on slave task *********');
        await runLiveProcess(options.getFLVParams(), true);
        await axios.get('http://localhost:8000/api/server', { timeout: 2000 })
          .then(function (response) {
            logger.log(response.data);
          })
          .catch(function (error) {
            //invoke task stop
            logger.log("get api status error: " + error);
          })
      }
    }
    //add address to cache
    if (config.isFLV || config.isLive || config.isCMAF) {
      //add channel and ip to cache
      await addChannel();
    }

  } catch (err) {
    logger.log("Can't start app", err);
    process.exit();
  }
};

initServer();


let retryLiveCount = 1;
/**
 * 
 * @param {*} spawn 
 */
const runLiveProcess = async (params, clear) => {

  const liveProcess = spawn("ffmpeg", params, {
    stdio: ["pipe", "pipe", "pipe"],
  });

  liveProcess.on("data", function (data) {
    logger.log("ffmpeg2 PARENT got message:", JSON.stringify(data));
  });

  liveProcess.on("exit", function async(code, signal) {
    logger.log("Exit live process params:" + params);
    const serverUrl = 'http://' + config.address + ':8000/api/server';
    console.log("Checking Media Server Status...");
    // Make a request for a user with a given ID
    axios.get(serverUrl, { timeout: 2000 })
      .then(function (response) {

        if (retryLiveCount === RETRY_THRESHOLD) {
          return new Error(error);
        }
        retryLiveCount++;
        logger.log("Check Media Server success,waiting " + config.retryTimeout * retryLiveCount + " to restart live process");
        setTimeout(runLiveProcess, config.retryTimeout * retryLiveCount, params, clear);
      })
      .catch(function (error) {
        //invoke task stop
        if (clear)
          clearResources(); //clear dir and cache
        if (config.isMaster)
          db.deleteItem(config.streamChannel);//delete live streaming record in db
        ecs.shutdown(); //shutdown self
        console.log("check status false,ffmpeg stream exit with code " + code);
      })
  });

  liveProcess.on("error", function (err) {
    console.log(err);
  });

  liveProcess.on("close", function (code) {
    logger.log("ffmpeg stream closed with code " + code);
  });

  liveProcess.stderr.on("data", function (data) {
    // console.log('stderr: ' + data);
    var tData = data.toString("utf8");
    // var a = tData.split('[\\s\\xA0]+');
    var a = tData.split("\n");
    console.log(a);
  });
  liveProcess.stdout;
}
/**
 * 
 * @param {*} spawn 
 * @param {*} motion 
 * @param {*} p2p 
 * @param {*} pd 
 */
const runRecordProcess = async (motion, p2p, pd) => {
  const ffmpeg = spawn("ffmpeg", options.getParams(), {
    stdio: ["pipe", "pipe", "pipe"],
  });
  ffmpeg.on("data", function (data) {
    logger.log("ffmpeg2 PARENT got message:", JSON.stringify(data));
  });

  ffmpeg.on("exit", function (code, signal) {
    logger.log("Exit record process ");
    const serverUrl = 'http://' + config.address + ':8000/api/server';
    console.log("Checking Server Status...");
    // Make a request for a user with a given ID
    axios.get(serverUrl, { timeout: 2000 })
      .then(function (response) {

        if (retryLiveCount === RETRY_THRESHOLD) {
          return new Error(error);
        }
        retryLiveCount++;
        logger.log("Check media server status success,waiting " + config.retryTimeout * retryLiveCount + "s to restart live process");
        setTimeout(runRecordProcess, config.retryTimeout * retryLiveCount, motion, p2p, pd);
      })
      .catch(function (error) {
        ecs.shutdown();
        console.log("check status false,ffmpeg stream exit with code " + code);
      })

  });

  ffmpeg.on("error", function (err) {
    console.log(err);
  });

  ffmpeg.on("close", function (code) {
    //stop task
    console.log("ffmpeg exited with code " + code);
  });

  ffmpeg.stderr.on("data", function (data) {
    // console.log('stderr: ' + data);
    var tData = data.toString("utf8");
    // var a = tData.split('[\\s\\xA0]+');
    var a = tData.split("\n");
    console.log(a);
  });
  if (motion)
    ffmpeg.stdout.pipe(p2p).pipe(pd);
  else
    ffmpeg.stdout;
}

/**
 * 
 * @param {*} spawn 
 */
const runRelayProcess = async () => {
  // function runLiveProcess() {
  const relayProcess = spawn("ffmpeg", options.getRelayParams(), {
    stdio: ["pipe", "pipe", "pipe"],
  });
  relayProcess.on("data", function (data) {
    logger.log("ffmpeg PARENT got message:", JSON.stringify(data));
  });

  relayProcess.on("exit", function (code, signal) {
    logger.log("Exit relay process ");
    const serverUrl = 'http://' + config.address + ':8000/api/server';
    console.log("Checking Server Status...");
    // Make a request for a user with a given ID
    axios.get(serverUrl, { timeout: 2000 })
      .then(function (response) {
        if (retryLiveCount === RETRY_THRESHOLD) {
          return new Error(error);
        }
        retryLiveCount++;
        logger.log("Check media server status success,waiting " + config.retryTimeout * retryLiveCount + "s to restart relay process");
        setTimeout(runRelayProcess, config.retryTimeout * retryLiveCount);
      })
      .catch(function (error) {
        console.log("check status false,ffmpeg stream exit with code " + code);
      })
  });

  relayProcess.on("error", function (err) {
    console.log(err);
  });

  relayProcess.on("close", function (code) {

    console.log("ffmpeg relay stream closed with code " + code);
  });

  relayProcess.stderr.on("data", function (data) {
    // console.log('stderr: ' + data);
    var tData = data.toString("utf8");
    // var a = tData.split('[\\s\\xA0]+');
    var a = tData.split("\n");
    console.log(a);
  });
  relayProcess.stdout;
}

async function initRecordResources() {
  await mkdirsSync(config.basePath + "/record/" + config.streamChannel + "/720p");
  await mkdirsSync(config.basePath + "/record/" + config.streamChannel + "/mp4");
  await mkdirsSync(config.basePath + "/record/" + config.streamChannel + "/images");
  await mkdirsSync(
    config.basePath + "/record/" + config.streamChannel + "/motion/images"
  );
  await mkdirsSync(
    config.basePath + "/record/" + config.streamChannel + "/motion/mp4"
  );
}

async function initLiveResources() {
  await mkdirsSync(liveStreamingPath);
  await fs.copyFileSync(
    "index.html",
    liveStreamingPath + "index.html"
  );
  await fs.copyFileSync(
    "hls.html",
    liveStreamingPath + "hls.html"
  );
  await fs.copyFileSync(
    "dash.html",
    liveStreamingPath + "dash.html"
  );
  await generateFLVTemplate();

  if (config.isImageWaterMark) {
    const file= await image.downloadImage();
    logger.log('finish download file '+file)
  }
}

function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}
const clearResources = async () => {
  //clear hls files
  console.log("remove dir:" + liveStreamingPath);
  await fsTool.rmdirSync(liveStreamingPath);
  console.log("remove cache from channel:" + config.streamChannel);
  await cache.srem(config.streamChannel, SERVER_ADDRESS)
}

const addChannel = async () => {
  if (!config.isCluster) {
    logger.log('add channel:' + config.streamChannel + '- address:' + SERVER_ADDRESS);
    await cache.sadd(config.streamChannel, SERVER_ADDRESS);
  }
  else {
    if (!config.isMaster) {
      logger.log('add channel:' + config.streamChannel + '- address:' + SERVER_ADDRESS);
      await cache.sadd(config.streamChannel, SERVER_ADDRESS);
    }
  }
}

const generateFLVTemplate = async () => {
  const channel = config.streamChannel;
  console.log(JSON.stringify(process.argv));
  const templateFile = "flv.template";
  const outputFile =
    liveStreamingPath + "flv.html";
  const template = fs.readFileSync(templateFile, "utf8");
  //console.log(template);
  const output = ejs.render(template, { channel }, {});
  //console.log('output-------'+output);
  fs.writeFileSync(outputFile, output);
};

const generateNginxConf = async () => {
  // const channel = config.inputURL.split("/").pop();
  // console.log(JSON.stringify(process.argv));
  // const templateFile = "nginx.conf.template";
  // const outputFile = config.nginxConf;
  // const template = fs.readFileSync(templateFile, "utf8");
  // //console.log(template);
  // const output = ejs.render(template, { channel }, {});
  // fs.writeFileSync(outputFile, output);

  await mkdirsSync(liveStreamingPath + "480p");
  await fs.copyFileSync(
    "nginx.conf.cluster", config.nginxConf
  );
  exec('/usr/sbin/nginx -s reload', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec nginx error: ${error}`);
      return;
    }
    console.log(`${stdout}`);
    console.log(`${stderr}`);
  });
};