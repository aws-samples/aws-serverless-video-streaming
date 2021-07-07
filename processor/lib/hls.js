// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const _ = require('lodash');
const chokidar = require('chokidar');
const { join } = require('path');
const EventEmitter = require('events');
const fs = require('./fs');
const s3 = require('./s3');
const m3u8 = require('./m3u8');
const abr = require('./abr');
const logger=require('./logger');

const nodeEvent = new EventEmitter();
const bucket_name=process.env.ASSETS_BUCKET||'video-streaming-assets-assetsbucket-gciiiklafmpb'

const on = (eventName, listener) => {
  nodeEvent.on(eventName, listener);
};

const VOD_APP_NAME = '720p';
const FILE_PERMISSION = 'public-read'
var rootDir='';

// Function to create a unique VOD filename for each stream
const getVodName = (streams, streamName) => {
  if (!streams.has(streamName)) return false;
  return `vod-${streams.get(streamName)}.m3u8`;
};

// HLS - test4/720p/index.m3u8
const handlePlaylist = async (path, mediaRoot, streams, streamName, appName) => {
  logger.log('handlePlaylist', path);

  if (await fs.exists(join(mediaRoot, path))) {
    // Read 720p playlist
    const liveM3u8 = await fs.readFile(join(mediaRoot, path));

    // Put /vod.m3u8 with all segments and end tag.
    let vodM3u8;
    const vodFilename = getVodName(streams, streamName);
    if (vodFilename) {
      const vodPath = join(mediaRoot, streamName, vodFilename);
      if (await fs.exists(vodPath)) {
        // Read existing vod playlist.
        vodM3u8 = await fs.readFile(vodPath);
      } else {
        // New HLS Stream.
        logger.log('emit newHlsStream event');
        nodeEvent.emit("newHlsStream", streamName);
      }
      vodM3u8 = m3u8.sync_m3u8(liveM3u8, vodM3u8, appName);
      await fs.writeFile(vodPath, vodM3u8);
      const params = {
        Body: vodM3u8,
        Bucket: process.env.ASSETS_BUCKET||'video-streaming-assets-assetsbucket-1kf2tlxbhy4qz',
        Key: `${streamName}/${vodFilename}`,
        ContentType: 'application/x-mpegURL',
        CacheControl: 'max-age=3600',
        ACL: FILE_PERMISSION
      };
      await s3.putObject(params);
      
    }
  }
};

// TS  - media/test4/720p/20200504-1588591755.ts
const handleSegment = async (path, mediaRoot) => {
  const params = {
    Body: fs.createReadStream(join(mediaRoot, path)),
    Bucket: bucket_name,
    Key: path,
    ContentType: 'video/MP2T',
    CacheControl: 'max-age=31536000',
    ACL: FILE_PERMISSION
  };
  await s3.putObject(params);
};

const handleMedia = async (path, mediaRoot) => {
  var oDate = new Date(); 
  timePath=oDate.getFullYear()+"/"+(oDate.getMonth()+1)+"/"+oDate.getDate();
  paths= _.split(path, '/');
  fileName=paths.pop();
  paths.push(timePath);
  paths.push(fileName);
  s3Path=_.join(paths,'/');
  const params = {
    Body: fs.createReadStream(join(mediaRoot, path)),
    Bucket: bucket_name,
    Key: s3Path,
    ContentType: 'video/MP2T',
    CacheControl: 'max-age=31536000'
  };
  
  await s3.putObject(params);
  await fs.rmFile(join(mediaRoot, path));
};

// ABR - media/test4/live.m3u8
// HLS - media/test4/720p/index.m3u8
// TS  - media/test4/720p/20200504-1588591755.ts
// [360p, 480p, 720p]

const onFile = async (absolutePath, type, mediaRoot, streams) => {
  try {
    const path = _.trim(_.replace(absolutePath, mediaRoot, ''), '/');
    if (_.endsWith(path, '.ts')) {
      const paths = _.split(path, '/');
      const streamName = _.nth(paths, 0);
      const appName = _.nth(paths, 1);
      if (_.isEqual(appName, VOD_APP_NAME)) {
      logger.log(`File ${path} has been ${type}`);
        // Only upload 720p
        await handleSegment(path, mediaRoot);
        await handlePlaylist(
          _.join(_.union(_.initial(_.split(path, '/')), ['index.m3u8']), '/'),
          mediaRoot,
          streams,
          streamName,
          appName);
      }
    }
    if (_.endsWith(path, '.mp4')||_.endsWith(path, '.jpg')||_.endsWith(path, '.jpeg')||_.endsWith(path, 'vod-index.m3u8')) {
      const paths = _.split(path, '/');
      const streamName = _.nth(paths, 0);
    //  logger.log(`File ${path} has been ${type}`);
      await handleMedia(path, mediaRoot);
    }
  } catch (err) {
    console.log(err);
  }
};

const monitorDir = (path, streams) => {
  rootDir = path+"/record";
  logger.log(`Start watcher Directory -  ${rootDir}`);
  chokidar.watch(rootDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 6000,
      pollInterval: 100
    }
  }).on('add', (path) => onFile(path, 'add', rootDir, streams))
  //  .on('change', (path) => onFile(path, 'change', rootDir, streams));
};

module.exports = {
  monitorDir: monitorDir,
  on
};
