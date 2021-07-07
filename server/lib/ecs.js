// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const _ = require('lodash');
const axios = require('axios');
const AWS = require('aws-sdk');
const logger = require('./logger');

const ecs = new AWS.ECS();

const cluster = 'video-streaming';
const containerPort = 1935;

const fetchServer = async (taskARN) => {
  //logger.log('fetchServers');
  const tasks = [ taskARN ];

  // Describe the tasks.
  const describeTasksResult = await ecs.describeTasks({ cluster, tasks }).promise();
  //logger.log(JSON.stringify(describeTasksResult, null, 3));
  const servers = _.map(describeTasksResult.tasks, (task) => {
    const ip = task.containers[0].networkInterfaces[0].privateIpv4Address;
    return ip;
  });
  //logger.log(JSON.stringify(servers, null, 3));

  return _.first(servers);
};

const fetchTaskMetadata = async () => {
  const taskMetadataResponse = await axios.get(`${process.env.ECS_CONTAINER_METADATA_URI}/task`);
  return taskMetadataResponse.data;
};

const getServerIP = async () => {
  const { TaskARN } = await fetchTaskMetadata();
  return await fetchServer(TaskARN);
};

const getServer= async () => {
  const { TaskARN } = await fetchTaskMetadata();
  const ip= await fetchServer(TaskARN);
  return `${ip}`;
};

module.exports = {
  fetchServer,
  fetchTaskMetadata,
  getServer
};