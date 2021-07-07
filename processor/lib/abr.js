// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const fs = require('./fs');
const config=require('./config')

const abrTemplate = () => {
  let line = `#EXTM3U\n#EXT-X-VERSION:3\n`
  if(config.isLD)
  line += `#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n360p/index.m3u8\n`
  if(config.isSD)
  line += `#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480\n480p/index.m3u8\n`
  if(config.isHD)
  line += `#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n720p/index.m3u8\n`
  if(config.isUD)
  line += `#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1920x1080\n1080p/index.m3u8\n`
  return line
};

const createPlaylist = async (mediaRoot, name) => {
  console.log('create abr playlist');
  await fs.mkdir(`${mediaRoot}/${name}`, { recursive: true });
  await fs.writeFile(`${mediaRoot}/${name}/index.m3u8`, abrTemplate());
};

module.exports = {
  createPlaylist
};