// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const fs = require("fs");
const config = require('./config');
const path = require("path");
const logger = require("./logger");

function getVideoParams() {
  return [
    //   '-an',
    "-c:v",
    getTransParam(),
    // "-map",
    // "0",
    "-f",
    "segment",
    "-segment_time",
    config.videoTime,
    // "-segment_format",
    // "mp4",
    "-segment_list",
    config.basePath + "/record/" + config.streamChannel + "/mp4/vod-index.m3u8",
    "-force_key_frames",
    "expr:gte(t,n_forced*1)",
    "-segment_format_options",
    "movflags=+faststart",
    "-reset_timestamps",
    "1",
    "-strict",
    "-2",
    // "-vf","scale=-1:320",
    "-strftime",
    "1",
    config.basePath + "/record/" + config.streamChannel + "/mp4/capture-%03d-%Y-%m-%d_%H-%M-%S.mp4",
  ];
}

/**
 * get image params
 * @returns {string[]}
 */
function getImageParams() {
  // cmd=$cmd" -map 0:v -vf fps=1/${IMAGE_SEGMENT_TIME}  -strict -2 \
  // -strftime 1 $BASEpath/capture-%Y-%m-%d_%H-%M-%S.jpg"
  return [
    //   "-map",  "0:v",
    "-an",
    "-c:a",
    getTransParam(),
    "-vf",
    "fps=1/" + config.imageTime,
    "-strict",
    "-2",
    "-strftime",
    "1",
    config.basePath + "/record/" + config.streamChannel + "/images/capture-%Y-%m-%d_%H-%M-%S.jpg",
  ];
}

/**
 * get motion params
 * @returns {(string|string|*)[]}
 */
function getMotionParams() {
  return [
    //   "-map", "0:v",
    /* output hls video that will used as source for recording when motion triggered */
    //   "-an",
    //"-c:a", "copy",
    // "-c:v",
    // "copy",
    // "-s",
    // "720x576",
    // "-c:a",
    // "copy",
    "-f",
    "hls",
    // "-s","320x240",
    "-hls_time",
    "3",
    "-hls_list_size",
    "2",
    "-start_number",
    "0",
    //   "-hls_allow_cache", "0",
    "-hls_flags",
    "+delete_segments+omit_endlist",
    config.pathToHLS,
    /* output pam image that is used as source for motion detection analysis */
    "-map", "0:v",
    "-an",
    "-c:v",
    "pam",
    "-pix_fmt",
    //'gray',
    config.pixFmt,
    "-f",
    "image2pipe",
    '-vf',
    'fps=1,scale=iw*1/6:ih*1/6',
    '-frames',
    '100',
    "pipe:1",
  ];
}


function getLiveBasePath() {
  if (config.isCluster || config.isCodec)
    return config.livePath + "/livestreaming/" + config.streamChannel
  else
    return config.basePath + "/livestreaming/" + config.streamChannel
}

function getMBRParam(codec, w, h, bv, maxrate, bufsize, ba, resolution) {
  return [
    "-crf","23" ,
    '-vf', `scale=w=${w}:h=${h}:force_original_aspect_ratio=decrease`,
    '-c:a', 'aac',
    '-ar', '48000',
    '-c:v', codec,
    '-preset', 'ultrafast',
    '-keyint_min', '24',
    '-g', '48',
    '-sc_threshold', '0',
    '-b:v', bv,
    '-maxrate', maxrate,
    '-bufsize', bufsize,
    '-b:a', ba,
    '-hls_time', '2',
    '-hls_list_size', '4',
    "-hls_flags",
    "delete_segments",
    "-start_number",
    Date.now(),
    '-hls_segment_filename',
    `${getLiveBasePath()}/${resolution}/${resolution}_%03d.ts`,
    `${getLiveBasePath()}/${resolution}/index.m3u8`
  ]
}

getCodecParams = function () {
  var params = [
    "-loglevel",
    config.logLevel,
    /* use hardware acceleration */
    "-hwaccel",
    "auto", //vda, videotoolbox, none, auto
    "-abort_on",
    "empty_output",
    "-i",
    config.inputURL,
  ];

  const codec = config.codec;
  if (config.isLD)
    params = params.concat(getMBRParam(codec, '640', '360', '400k', '600k', '600k', '64k', '360p'));
  if (config.isSD)
    params = params.concat(getMBRParam(codec, '842', '480', '600k', '900k', '900k', '64k', '480p'));
  if (config.isHD)
    params = params.concat(getMBRParam(codec, '1280', '720', '1000k', '1500k', '1500k', '128k', '720p'));
  if (config.isUD)
    params = params.concat(getMBRParam(codec, '1920', '1080', '2000k', '3000k', '3000k', '128k', '1080p'));
  params = params.concat([
    '-f', 'hls',
    "-tune",
    "zerolatency",
  ]);
  return params;
}
/**
 * get HLS params
 * @returns {(string|*|number)[]}
 */
function getHLSParams() {
  return [
    "-f",
    "hls",
    //  '-codec:v','libx264',
    // '-codec:a', 'mp3',
    '-c:v', getTransParam(),
    '-lhls', '1',
    '-streaming', '1',
    '-hls_playlist', '1',
    "-hls_init_time", "1",
    "-preset", "veryfast",
    "-tune",
    "zerolatency",
    "-fflags",
    "nobuffer",
    "-flags",
    "low_delay",
    "-movflags",
    "faststart",
    "-hls_time",
    config.hlsTime,
    "-hls_list_size",
    config.hlsListSize,
    "-hls_flags",
    "delete_segments",
    "-start_number",
    Date.now(),
    "-strict",
    "-2",
    "-hls_segment_filename",
    getLiveBasePath() + "/%03d.ts",
    getLiveBasePath() + "/live.m3u8"
  ];
}

function getCMAFParams() {
  return [
    '-c:v', getTransParam(),
    '-b:v', '500k',
    '-ldash', '1',
    '-streaming', '1',
    '-use_template', '1',
    '-use_timeline', '0',
    '-seg_duration', '4',
    '-remove_at_exit', '1',
    '-window_size', '5',
    '-hls_playlist', '1',
    // '-keyint_min', '120',
    '-g', '120',
    '-sc_threshold', '0',
    '-b_strategy', '0',
    // "-preset", "veryfast",
    // "-tune", "zerolatency",
    '-f', 'dash',
    // "-strict",
    // "-2",
    getLiveBasePath() + "/manifest.mpd",
  ];
}
/**
 * get cmaf params
 * @returns {string[]}
 */
function getCMAF1Params() {
  return [
    '-map', '0',
    '-map', '0',
    // '-c:v', 'h264_videotoolbox',
    // '-allow_sw', '1',
    '-map', '0',
    '-c:a', 'aac',
    '-c:v', 'libx264',
    '-b:v:0', '1000k',
    '-s:v:0', '1280x720',
    '-profile:v:0', 'main',
    '-b:v:1', '800k',
    '-s:v:1', '960x540',
    '-profile:v:1', 'main',
    '-b:v:2', '500k',
    '-s:v:2', '640x360',
    '-profile:v:2', 'main',
    // '-bf', '1',
    // '-keyint_min', '120',
    '-g', '120',
    '-sc_threshold', '0',
    '-b_strategy', '0',
    // '-ar:a:1', '22050',
    '-use_timeline', '0',
    '-use_template', '1',
    '-window_size', '5',
    '-adaptation_sets', 'id=0,streams=v id=1,streams=a',
    '-hls_playlist', '1',
    "-tune", "zerolatency",
    // '-min_seg_duration','10000000', 
    // "-flags","low_delay",
    '-seg_duration', '4',
    '-streaming', '1',
    '-remove_at_exit', '1',
    '-f', 'dash',
    // "-strict",
    // "-2",
    getLiveBasePath() + "/manifest.mpd",
  ];
}

function getTransParam() {
  if (config.isWatermark || config.isImageWaterMark)
    return "libx264";
  else return "copy"
}


/**
 * get flv params
 * @returns {string[]}
 */
function getFlvParam() {
  return [
    "-preset",
    "medium",
    "-vprofile",
    "baseline",
    // "-profile:v",
    // "basline",
    "-fflags",
    "nobuffer",
    "-f",
    "flv",
    "-y",
    "-tune",
    "zerolatency",
    "-fflags",
    "discardcorrupt",
    // "-flags",
    // "low_delay",
    // "-r",
    // "15",
    // "-c:v",
    // "libx264",
    //  "-crf",
    // "19",
    "-c:v",
    getTransParam(),
    // "-c:a",
    // "aac",
    //      config.basePath+"/hls/" + config.streamChannel + "/480p/live.flv",
    "rtmp://localhost:1935/" + config.streamChannel + "/live"
  ];
}

/**
 * on demand param
 * @returns {(string|*|number)[]}
 */
function getOnDemandParams() {
  return [

    "-f",
    "hls",
    '-profile:v',
    'main',
    "-preset", "veryfast",
    "-tune",
    "zerolatency",
    "-fflags",
    "nobuffer",
    "-hls_time",
    config.ONDEMAND_TIME,
    "-hls_list_size",
    config.ONDEMAND_LIST_SIZE,
    "-hls_flags",
    "delete_segments",
    "-start_number",
    Date.now(),
    "-strict",
    "-2",
    "-hls_segment_filename",
    config.basePath + "/record/" + config.streamChannel + "/720p/%03d.ts",
    config.basePath + "/record/" + config.streamChannel + "/720p/index.m3u8"
  ];
}

/**
 * watermark parameter
 * @returns {string[]}
 */
function getWatermark() {
  return [
    '-vf',
    `drawtext=fontfile=simhei.ttf: text=${config.waterMarkText}:x=${config.waterMarkLeft}:y=${config.waterMarkTop}:fontsize=${config.waterMarkFontSize}:fontcolor=${config.waterMarkFontColor}`
  ];
}
//"color=color=black, drawtext=enable='gte(t,3)':fontfile=Vera.ttf:fontcolor=white:textfile=text.txt:reload=1:y=h-line_h-10:x=(W/tw)*n"

function getDynamicText() {
  return [
    "-vf",
    "color=color=black, drawtext=enable='gte(t,3)':fontfile=simhei.ttf:fontcolor=white:textfile=text.txt:reload=1:y=h-line_h-10:x=(W/tw)*n"
  ];
  // 如果要指定水印的大小，比如 384x216：
  // ffmpeg -i input.mp4 -i wm.png -filter_complex "[1:v]scale=384:216[wm];[0:v][wm]overlay=0:0"
}

function getImageWaterMark() {
  const imageName = config.ImageURL.split("/").pop()
  const imagePath = config.basePath + '/' + imageName
  if (fs.existsSync(imagePath)) {
    return [
      "-i", imagePath,
      "-filter_complex", `[1:v]scale=${config.ImageWidth}:${config.ImageHeight}[wm];[0:v][wm]overlay=${config.waterMarkLeft}:${config.waterMarkTop}`
    ];
  }
  else
    return [];
}
/**
 * return params according to medadata
 * @returns {(string|*)[]}
 */
getParams = function () {
  var params = [
    "-loglevel",
    config.logLevel,
    /* use hardware acceleration */
    "-hwaccel",
    "auto", //vda, videotoolbox, none, auto
    /* use an rtsp ip cam video input */
    // "-rtsp_transport",
    // "tcp",
    "-abort_on",
    "empty_output",
    // "-stimeout",
    // "10000000",
    // "-stream_loop",
    // "-1",
    "-i",
    config.inputURL,
  ];
  if (config.isImageWaterMark) params = params.concat(getImageWaterMark());
  if (config.isWatermark) params = params.concat(getWatermark());
  if (config.isMotion) params = params.concat(getMotionParams());
  if (config.isVideo) params = params.concat(getVideoParams());
  if (config.isImage) params = params.concat(getImageParams());
  // if (config.isLive) params = params.concat(getLiveParams());
  if (config.isOnDemand) params = params.concat(getOnDemandParams());
  // if(config.isFLV)params = params.concat(getFlvParams());
  // params=params.concat(['-y', 'pipe:1']);
  logger.log("----ffmpeg record params:" + params);
  return params;
};

getFLVParams = function () {
  var params = [
    "-loglevel",
    config.logLevel,
    /* use hardware acceleration */
    "-hwaccel",
    "auto", //vda, videotoolbox, none, auto
    "-abort_on",
    "empty_output",
    "-i",
    // 'rtsp://freja.hiof.no:1935/rtplive/definst/hessdalen03.stream',
    config.inputURL,
  ];
  if (config.isImageWaterMark) params = params.concat(getImageWaterMark());
  if (config.isWatermark) params = params.concat(getWatermark());
  params = params.concat(getFlvParam());
  logger.log("----ffmpeg flv params:" + params);
  return params;
}

getLiveParams = function () {
  var params = [
    "-loglevel",
    config.logLevel,
    /* use hardware acceleration */
    "-hwaccel",
    "auto", //vda, videotoolbox, none, auto
    "-abort_on",
    "empty_output",
    "-i",
    // 'rtsp://freja.hiof.no:1935/rtplive/definst/hessdalen03.stream',
    config.inputURL,
  ];
  if (config.isImageWaterMark) params = params.concat(getImageWaterMark());
  if (config.isWatermark) params = params.concat(getWatermark());
  if (config.isLive) params = params.concat(getHLSParams());
  if (config.isCMAF) params = params.concat(getCMAFParams());
  // params=params.concat(['-y', 'pipe:1']);

  logger.log("----ffmpeg live params:" + params);
  return params;
};
//ffmpeg -re -i Big_Buck_Bunny_alt.webm  -f tee -vcodec libx264 -acodec aac -map 0  
//"[f=flv:onfail=ignore]rtmp://52.82.49.107:1935/stream/|[f=flv:onfail=ignore]rtmp://push.live.solutions.aws.a2z.org.cn:1935/stream/"
getRelayParams = function () {
  var params = [
    "-loglevel",
    config.logLevel,
    /* use hardware acceleration */
    "-hwaccel",
    "auto", //vda, videotoolbox, none, auto
    "-abort_on",
    "empty_output",
    "-i",
    config.inputURL,
    "-preset",
    "veryfast",
    "-fflags",
    "nobuffer",
    "-vprofile",
    "baseline",
    "-f",
    "flv",
    //"tee",
    "-y",
    "-tune",
    "zerolatency",
    "-fflags",
    "discardcorrupt",
    "-flags",
    "low_delay",
    // "-vcodec", "libx264",
    // "-acodec", "aac",
    "-c:v",
    "copy",
    // "-map", "0" ,
 config.RELAY_URL
  ];
  logger.log("----ffmpeg relay params:" + params);
  return params;
}


const getURLParam = (urls) => {
  var params = "";
  const urlList = urls.split(',');
  for (var i = 0; i < urlList.length; i++) {
    params=params.concat(
      "[f=flv:onfail=ignore]" + urlList[i]+"|"
    );
  }
  return params;
}




module.exports = {
  getParams,
  getLiveParams,
  getFLVParams,
  getRelayParams,
  getCodecParams,
};
