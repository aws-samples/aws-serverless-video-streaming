// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const _ = require('lodash');

// Timeout with promise
const timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const getParams = (args, prefix) => {
  return _.reduce(args, (result, value, key) => {
    if (_.startsWith(key, prefix)) {
      result[_.replace(key, prefix, '')] = value;
    }
    return result;
  }, {});
}

module.exports = {
  timeout,
  getParams
};