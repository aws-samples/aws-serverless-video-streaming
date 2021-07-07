// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const express = require('express');
const cache = require('./cache');
const _ = require('lodash');

const app = express();

const port = 3000;

// const servers=["1","2","3"];
// console.log("servers:"+servers.sample());
Array.prototype.sample = function(){
  return this[Math.floor(Math.random()*this.length)];
}

app.get('/healthcheck', async (req, res) => {
  return res.status(200).send('OK');
});

app.get('/*', async (req, res) => {
 // console.log(req.path);

  // Validate stream.
  const pathParts = _.split(_.trim(req.path, '/'), '/');
  const streamName = _.nth(pathParts, 0);
  const serverlists = await cache.get(streamName);
  console.log("get stream channel:"+streamName+" from "+serverlists);
  if (_.isNil(serverlists)) {
    return res.status(404).send(`${streamName} is not streaming live now`);
  }
  //get a random server from input
  const serverAddress=serverlists.sample();
  if (_.isNil(serverAddress)) {
    return res.status(404).send(`${streamName} is not streaming live now`);
  }
  //console.log("get stream channel:"+streamName+" from "+serverAddress);
  const internalRedirect = `/${_.join(_.concat([serverAddress], pathParts), '/')}`;
  //console.log(internalRedirect);
  res.set('X-Accel-Redirect', internalRedirect);
  return res.send();
});


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));