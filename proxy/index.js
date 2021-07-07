// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const _ = require('lodash');
const ejs = require('ejs');
const fs = require('fs');
const AWS = require('aws-sdk');
const region = process.env.AWS_REGION || "cn-northwest-1";


const ecs = new AWS.ECS({ region:region });

const cluster = 'video-streaming';
const serviceName = 'video-streaming-server';
const containerPort = 1935;
const rtmpsPort =1938;

const fetchServers = async () => {
  //console.log('fetchServers');
  try {
    // Get the ECS Service tasks
    const listTasksResult = await ecs.listTasks({ cluster, serviceName }).promise();
    //console.log(JSON.stringify(listTasksResult, null, 3));
    const { taskArns: tasks } = listTasksResult;

    // Describe the tasks.
    if(listTasksResult.taskArns.length>0)
    {
    const describeTasksResult = await ecs.describeTasks({ cluster, tasks }).promise();
    //console.log(JSON.stringify(describeTasksResult, null, 3));
    const servers = _.map(describeTasksResult.tasks, (task) => {
      const ip = task.containers[0].networkInterfaces[0].privateIpv4Address;
      return `${ip}`;
    });
    //console.log(JSON.stringify(servers, null, 3));

    return servers;
  }
  else{
    return [];
  }
  } catch (err) {
    console.log(err);
    return [];
  }
};

const generateTemplate = async () => {
  //console.log('generateTemplate');
  const servers = await fetchServers();
  //console.log(JSON.stringify(process.argv));
  const templateFile = process.argv[2];
  const outputFile = process.argv[3];
  const template = fs.readFileSync(templateFile, 'utf8');
 
  const output = ejs.render(template, { servers }, {});
 // console.log(output);
  fs.writeFileSync(outputFile, output);
};

generateTemplate();