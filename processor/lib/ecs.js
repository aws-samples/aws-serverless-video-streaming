// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const _ = require('lodash');
const axios = require('axios');
const AWS = require('aws-sdk');
const logger = require('./logger');

const ecs = new AWS.ECS();

const cluster = 'video-streaming';
const containerPort = 8000;

// {
//   "DockerId": "43481a6ce4842eec8fe72fc28500c6b52edcc0917f105b83379f88cac1ff3946",
//   "Name": "nginx-curl",
//   "DockerName": "ecs-nginx-5-nginx-curl-ccccb9f49db0dfe0d901",
//   "Image": "nrdlngr/nginx-curl",
//   "ImageID": "sha256:2e00ae64383cfc865ba0a2ba37f61b50a120d2d9378559dcd458dc0de47bc165",
//   "Labels": {
//       "com.amazonaws.ecs.cluster": "default",
//       "com.amazonaws.ecs.container-name": "nginx-curl",
//       "com.amazonaws.ecs.task-arn": "arn:aws:ecs:us-east-2:012345678910:task/9781c248-0edd-4cdb-9a93-f63cb662a5d3",
//       "com.amazonaws.ecs.task-definition-family": "nginx",
//       "com.amazonaws.ecs.task-definition-version": "5"
//   },
//   "DesiredStatus": "RUNNING",
//   "KnownStatus": "RUNNING",
//   "Limits": {
//       "CPU": 512,
//       "Memory": 512
//   },
//   "CreatedAt": "2018-02-01T20:55:10.554941919Z",
//   "StartedAt": "2018-02-01T20:55:11.064236631Z",
//   "Type": "NORMAL",
//   "Networks": [
//       {
//           "NetworkMode": "awsvpc",
//           "IPv4Addresses": [
//               "10.0.2.106"
//           ]
//       }
//   ]
// }

const fetchServer = async (taskARN) => {
  //logger.log('fetchServers');
  const tasks = [ taskARN ];

  // Describe the tasks.
  const describeTasksResult = await ecs.describeTasks({ cluster, tasks }).promise();
  //logger.log(JSON.stringify(describeTasksResult, null, 3));
  const servers = _.map(describeTasksResult.tasks, (task) => {
    const ip = task.containers[0].networkInterfaces[0].privateIpv4Address;
    return `${ip}:${containerPort}`;
  });
  //logger.log(JSON.stringify(servers, null, 3));

  return _.first(servers);
};

const fetchTaskMetadata = async () => {
  const taskMetadataResponse = await axios.get(`${process.env.ECS_CONTAINER_METADATA_URI}/task`);
  return taskMetadataResponse.data;
};

const getServer = async () => {
  const { TaskARN } = await fetchTaskMetadata();
  return await fetchServer(TaskARN);
};



// shutdown function responsible for shutting the task we are currently running on!
const shutdown = async () => {
  try {
    if (process.env.ECS_CONTAINER_METADATA_URI) {
      // retrieve metadata about own task
      const { data: container } = await axios.get(`${process.env.ECS_CONTAINER_METADATA_URI}/task`);

      
        // work out the task id from the TaskARN
      if (container.TaskARN) {
        const parts = container.TaskARN.split("/");
        const taskId = parts[parts.length - 1];
        
          // Stop the task from running
        await ecs.stopTask({
          cluster: container.Cluster,
          task: taskId
        }).promise();
        
      }
    }
  } catch(error) {
    // do something with the error
    throw error;
  }
}

module.exports = {
  fetchServer,
  fetchTaskMetadata,
  getServer,
  shutdown
};