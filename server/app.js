// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const NodeMediaServer = require("node-media-server");
const _ = require("lodash");
const axios = require('axios');
const { join } = require("path");
const querystring = require("querystring");
const ecs = require("./lib/ecs");
const lambda = require("./lib/lambda");
const logger = require("./lib/logger");
const utils = require("./lib/utils");
const cache = require("./lib/cache");
const scheduler = require("./lib/task");
const db = require("./lib/db");


const LOG_TYPE = 3;

var metaData;
var isAuth = true;
logger.setLogType(LOG_TYPE);
function getConfig() {
  return {
    logType: LOG_TYPE,
    rtmp: {
      port: 1935,
      chunk_size: 20480,
      gop_cache: true,
      ping: 10,
      ping_timeout: 5,
      ssl: {
        port: 1938,
        key: "./privatekey.pem",
        cert: "./certificate.pem",
      },
    },
    http: {
      port: 8000,
      allow_origin: "*",
    },
    auth: {
      // api: true,
      play: false,
      // api_user: 'admin',
      // api_pass: 'admin',
      publish: true,
      secret: 'nodemedia2017privatekey'
    }
  };

  // https: {
  //   port: 8443,
  //   key:'./privatekey.pem',
  //   cert:'./certificate.pem',
  // },

}

// init RTMP server
const init = async () => {
  try {
    const SERVER_ADDRESS =
      process.env.NODE_ENV === "production"
        ? await ecs.getServer()
        : "127.0.0.1";
    const path = process.env.NODE_ENV === "production" ? "/dev/shm" : "media";
    // Set the Node-Media-Server config.
    const config = getConfig();
    // Construct the NodeMediaServer
    const nms = new NodeMediaServer(config);
    //
    // RTMP callbacks
    //
    // nms.on("preConnect", async (id, StreamPath, args) => {
    //   logger.log(
    //     "[NodeEvent on preConnect]",
    //     `id=${id} args=${JSON.stringify(args)}`
    //   );
    // });

    // nms.on("postConnect", (id, args) => {
    //   logger.log(
    //     "[NodeEvent on postConnect]",
    //     `id=${id} args=${JSON.stringify(args)}`
    //   );
    // });

    // nms.on("doneConnect", (id, args) => {
    //   logger.log(
    //     "[NodeEvent on doneConnect]",
    //     `id=${id} args=${JSON.stringify(args)}`
    //   );
    // });

    nms.on("prePublish", async (id, StreamPath, args) => {
      logger.log(
        "[NodeEvent on prePublish]",
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
      );
      const name = StreamPath.split("/").pop();
      metaData = await db.getItem(name);
      if (_.isEmpty(metaData)) {
        logger.log(`The channel ${name} is not exist`);
        let session = await nms.getSession(id);
        await session.reject();
      }
    });
    

    nms.on("postPublish", async (id, StreamPath, args) => {
      logger.log(
        "[NodeEvent on postPublish]",
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
      );
      const name = StreamPath.split("/").pop();
      const metaData = await db.getItem(name);
      if (StreamPath.indexOf("/stream/") != -1 && !_.isEmpty(metaData)) {
        logger.log("---begin to run ecs task---");
        logger.log("channel's metadata:" + JSON.stringify(metaData));
        var url;
        if (metaData.isRtmps == "true")
          url = "rtmps://" + SERVER_ADDRESS + ":1938/stream/" + name;
        else url = "rtmp://" + SERVER_ADDRESS + ":1935/stream/" + name;
        // const params = {
        //   id: name,
        //   url: url,
        //   address: SERVER_ADDRESS,
        //   eventName: "start",
        //   metaData: metaData,
        // };
        //  await axios.get('http://localhost:8000/api/streams/stream/'+name, { timeout: 2000 })
        //   .then(function (response) {
        //     logger.log(response.data);
        //   })
        //   .catch(function (error) {
        //     //invoke task stop
        //     console.log("get api status error: " + error);
        //   })
        await startTasks(name, url, SERVER_ADDRESS, metaData).catch(error => console.log(error.message));
      }
    });

    nms.on("donePublish", async (id, StreamPath, args) => {
      logger.log(
        "[NodeEvent on donePublish]",
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
      );
      const name = StreamPath.split("/").pop();
      const metaData = await db.getItem(name);
      if (StreamPath.indexOf("/stream/") != -1 && !_.isEmpty(metaData)) {
        const name = StreamPath.split("/").pop();
        // Set the "stream key" <-> "id" mapping for this RTMP/HLS session
        // We use this when creating the DVR HLS playlist name on S3.
        const timeoutMs = _.isEqual(process.env.NODE_ENV, "development")
          ? 1000
          : 2 * 1000;

        await removeCache(name, metaData).catch(error => console.log(error.message));
        // const values = await cache.smembers(name);
        // await values.forEach(element => {
        //   cache.srem(element);
        // });
        // await cache.del(name);
        //waiting for processing video stream
        // await utils.timeout(timeoutMs);
        //const url=SERVER_ADDRESS+"/stream/"+name;

        // if(isRtmps)
        //  url = "rtmps://" + SERVER_ADDRESS + "/stream/" + name;
        //  else
        url = "rtmp://" + SERVER_ADDRESS + "/stream/" + name;
        await stopTasks(name, url, metaData).catch(error => console.log(error.message));;
        logger.log(url);
      }
    });

    // nms.on("prePlay", (id, StreamPath, args) => {
    //   logger.log(
    //     "[NodeEvent on prePlay]",
    //     `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    //   );
    // });

    // nms.on("postPlay", (id, StreamPath, args) => {
    //   logger.log(
    //     "[NodeEvent on postPlay]",
    //     `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    //   );
    // });

    // nms.on("donePlay", (id, StreamPath, args) => {
    //   logger.log(
    //     "[NodeEvent on donePlay]",
    //     `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
    //   );
    // });

    // Run the NodeMediaServer
    nms.run();
  } catch (err) {
    logger.log("Can't start app", err);
    process.exit();
  }
};
/**
 * 
 * @param {*} channelName 
 * @param {*} metaData 
 */
const removeCache = async (channelName, metaData) => {
  const isCluster = (metaData.isCluster || 'false') === 'true';
  // let clusterNumber = new Number(metaData.clusterNumber || '5');
  // clusterNumber--;
  logger.log("remove channel " + channelName + " from cache");
  if (isCluster) {
    const addressSets = await cache.smembers(channelName);
    addressSets.forEach(async address => {
      logger.log("remove address " + address + " from cache");
      await cache.srem(channelName, address);
    });
  }
  await cache.del(channelName);
}
/**
 * 
 * @param {*} channelName 
 * @param {*} inputURL 
 * @param {*} address 
 * @param {*} metaData 
 */
const startTasks = async (channelName, inputURL, address, metaData) => {
  //delete db record
  await scheduler.deleteItem(channelName);
  const isCluster = String(metaData.isCluster || 'false')=== 'true';
  const isNeedCodec = String(metaData.isCodec || 'false') === 'true';
  const isNeedRecord = isRecord(metaData);
  var params = new Array();
  params.push({
    id: channelName,
    url: inputURL,
    address: address,
    eventName: "start",
    metaData: metaData,
    isMaster: 'true',//is a master task
    isCodec: metaData.isCodec||'false',
    isRecord: 'false',
    taskType:'master',
    isCluster: metaData.isCluster || 'false'
  });
  if (isNeedRecord) {
    logger.log("begin to add record task parameter");
    params.push({
      id: channelName,
      url: inputURL,
      address: address,
      eventName: "start",
      metaData: metaData,
      isMaster: 'false',//is a master task
      isCodec:  metaData.isCodec||'false',
      isRecord: 'true',// record task
      taskType:'record',
      isCluster: metaData.isCluster || 'false'
    });
  }

  if (isNeedCodec) {
    logger.log("begin to add codes task parameter");
    params.push({
      id: channelName,
      url: inputURL,
      address: address,
      eventName: "start",
      metaData: metaData,
      isMaster: 'false',
      isCodec: metaData.isCodec||'false',
      isRecord: 'false',
      taskType:'codec',
      isCluster: metaData.isCluster || 'false'
    });
  } 
  if (isCluster) {
    logger.log("begin to add cluster task parameter");
    // for (let index = 0; index < clusterNumber; index++) {
    params.push({
      id: channelName,
      url: inputURL,
      address: address,
      eventName: "start",
      metaData: metaData,
      isMaster: 'false',
      isCodec:  metaData.isCodec||'false',
      isRecord: 'false',
      taskType:'slave',
      isCluster: metaData.isCluster || 'true'
    });
  }



  // }
  for (const param of params) {
    await scheduler.invokeTask(param);
  }
  // await params.forEach(async param => {
  //   logger.log(param.id);
  //   await scheduler.invokeTask(param);
  // });
}

/**
 * 
 * @param {*} channelName 
 * @param {*} inputURL 
 * @param {*} metaData 
 */
const stopTasks = async (channelName, inputURL, metaData) => {

  // const isCluster = String((metaData.isCluster || 'false')) === 'true';
  // const isCodec = String((metaData.isCodec || 'false')) === 'true';

  // let clusterNumber = new Number(metaData.clusterNumber || 2);
  // clusterNumber--;
  // logger.log("stop task:" + param.id);
  var params = new Array();
  params.push({
    id: channelName,
    url: inputURL,
    eventName: "stop",
  });

  // if (isCluster) {
  //   // for (let index = 0; index < clusterNumber; index++) {
  //   const param = {
  //     id: channelName,
  //     url: inputURL,
  //     eventName: "stop",
  //   };
  //   params.push(param);
  //   if (isCodec) {
  //     // for (let index = 0; index < clusterNumber; index++) {
  //     const param = {
  //       id: channelName,
  //       url: inputURL,
  //       eventName: "stop",
  //     };
  //     params.push(param);
  //   }
  // }
  // }
  // for (const param of params) {

  //   await scheduler.invokeTask(param);
  //  }
  await params.forEach(async param => {
    logger.log(param.id);
    await scheduler.invokeTask(param);
  });
}

const isRecord =  (metaData) => {
  const isVideo = String(metaData.isVideo || 'false') === 'true';
  const isImage = String(metaData.isImage || 'false') === 'true';
  const isMotion = String(metaData.isMotion || 'false') === 'true';
  const isOnDemand = String(metaData.isOnDemand || 'false') === 'true';

  if (isVideo || isImage || isMotion || isOnDemand)
    return true;
  else
    return false;
}
/**
 * start app
 */
init();
