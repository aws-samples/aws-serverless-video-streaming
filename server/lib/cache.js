// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const redis = require('redis');
const { promisify } = require('util');
const logger = require('./logger');

const cache = redis.createClient({ host: process.env.CACHE_DOMAIN });
cache.on('error', (err) => {
  logger.error(err);
});
const set = promisify(cache.set).bind(cache);
const del = promisify(cache.del).bind(cache);
const get = promisify(cache.get).bind(cache);
const smembers=promisify(cache.smembers).bind(cache);
const srem=promisify(cache.srem).bind(cache);

module.exports = {
  set,
  del,
  get,
  smembers,
  srem
};