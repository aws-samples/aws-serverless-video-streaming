// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

var AWS = require('aws-sdk');
var logger=require('./logger');
const region = process.env.AWS_REGION || "cn-northwest-1";
const ECS = new AWS.ECS({ region:region });
const dynamo = new AWS.DynamoDB.DocumentClient({ region:region });
const TABLE_NAME = process.env.TABLE_NAME || "video-streaming";
var segmentTime = process.env.SEGMENT_TIME || "30";
var segmentFormat = process.env.SEMMENT_FORMAT || "video";
const bucketName = process.env.ASSETS_BUCKET || "video-streaming-assets-assetsbucket-1kf2tlxbhy4qz";
var logLevel = process.env.LOG_LEVEL || "warning";


var transCoding = process.env.TRANSCODING || "copy";
var sizing = process.env.SIZING || "default";
//
var ecs_Type = process.env.ECS_TYPE || "fargate";
const clusterName = process.env.ECS_CLUSTER_NAME || 'video-streaming';
const taskName = process.env.ECS_TASK_NAME || 'video-streaming-processor:4'
const containerName = process.env.ECS_CONTAINER_NAME || 'video-streaming-processor';
var metaData;
var address;

const invokeTask = async(event,callback) => {
    return new Promise(async(resolve, reject) => {
        try {
           // logger.log("-----event----" + JSON.stringify(event));
            var deviceURL;
            var channelName;
            if (event.eventName == "start") {
                deviceURL = event.url; //get media url
                channelName = event.id;
                metaData =event.metaData;
                address=event.address;
               // logger.log(event.eventName);
                logger.log('Run task with deviceURL:' + deviceURL + "  channelName:" + channelName);
                //run ecs task
                await ECS.runTask(getECSParam(deviceURL)).promise().then(function(data) {
                    var item = new Object();
                    item.UUID = channelName;
                    item.URL = deviceURL;
                    item.taskARN = data.tasks[0].taskArn;
                    //save task info into dynamodb
                    return saveItem(item).then(response => {
                        logger.log("saveItem into dynamodb success" + response);
                    }, (reject) => {
                        logger.log("saveItem into dynamodb error" +reject);
                    });
                }).catch(function(error) {
                    logger.log("starting task error:" +error);
                });
            }
            if (event.eventName == "stop") {
                channelName = event.id;
              //  logger.log(event.url);
                await getItem(channelName, callback).then(function(item) {
                    if (typeof(item) != 'undefined') {
                        logger.log("stop task with:" + JSON.stringify(item));
                        var params = {
                            task: item.taskARN,
                            cluster: clusterName,
                            reason: 'stop recording'
                        };
                        return ECS.stopTask(params).promise();
                    }
                }).then(function(data) {
                    logger.log("delete db record success:" + channelName);
                    return deleteItem(channelName);
                }).catch(function(error, data) {
                    logger.log("delete task error:" + error);
                    return deleteItem(channelName);
                });
            }

        }
        catch (error) {
        logger.log("execute error:" + error);
        }

    });
};

function getEnv(deviceURL)
{
  return  [
    { name: "INPUT_URL", "value": deviceURL },
    { name: "ADDRESS", "value": address },
    { name: "SEGMENT_FORMAT", "value": segmentFormat },
    { name: "LOG_LEVEL", "value": logLevel },
    { name: "REGION", "value": region },
    { name: "TRANSCODING", "value": transCoding },
    { name: "SIZING", "value": sizing },
    { name: "SEGMENT_TIME", "value": segmentTime },
    { name: "CHANNEL_NAME", "value": metaData.channel },
    { name: "IS_FLV", "value": metaData.isFlv || 'true'},
    { name: "IS_HLS", "value": metaData.isHls || 'false'},
    { name: "IS_VIDEO", "value": metaData.isVideo || 'false'},
    { name: "IS_IMAGE", "value": metaData.isImage || 'false'},
    { name: "IS_MOTION", "value": metaData.isMotion || 'false'},
    { name: "IS_ONDEMAND", "value": metaData.isOnDemand || 'false'},
    { name: "IS_CMAF", "value": metaData.isCMAF || 'false'},
    { name: "VIDEO_TIME", "value": metaData.video_time|| "30" },
    { name: "IMAGE_TIME", "value": metaData.image_time|| "10" },
    { name: "HLS_TIME", "value": metaData.hls_time || "2"},
    { name: "HLS_LIST_SIZE", "value": metaData.hls_list_size|| "6" }, 
//motion detect
    { name: "MOTION_DURATION", "value": metaData.motion_duration|| "5000" },
    { name: "MOTION_PERCENT", "value": metaData.motion_percent || "30"},
    { name: "MOTION_TIMEOUT", "value": metaData.motion_timeout || "60"},
    { name: "MOTION_DIFF", "value": metaData.motion_diff|| "10" },
//ondemand video
    { name: "ONDEMAND_LIST_SIZE", "value": metaData.ondemand_list_size || "3"},
    { name: "ONDEMAND_TIME", "value": metaData.ondemand_time || "60"},
]
}

function getECSParam(deviceURL) {
    if (ecs_Type == "fargate")
        return getFargateParams(deviceURL);
    else
        return getEC2Params(deviceURL);
}

function getEC2Params(deviceURL) {
    return {
        cluster: clusterName,
        taskDefinition: taskName,
        overrides: {
            containerOverrides: [{
                name: containerName,
                environment:getEnv(deviceURL)
            }]
        },
        count: 1,
        launchType: "EC2",
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: [process.env.SUBNET_ID1 || 'subnet-0c501e7112e0d94f9',
                    process.env.SUBNET_ID2 || 'subnet-03799a358aa837963'
                ],
                assignPublicIp: "DISABLED",
                securityGroups: [
                    process.env.SECURITY_GROUP || 'sg-0012e02d07ded4562' ,//security group
                ]
            }
        },
    };
}


function getFargateParams(deviceURL) {
    return {
        cluster: clusterName,
        taskDefinition: taskName,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: [process.env.SUBNET_ID1 || 'subnet-0c501e7112e0d94f9',
                    process.env.SUBNET_ID2 || 'subnet-03799a358aa837963'
                ],
                assignPublicIp: "ENABLED",
                securityGroups: [
                    process.env.SECURITY_GROUP || 'sg-0012e02d07ded4562' ,//security group
                ]
            }
        },
        overrides: {
            containerOverrides: [{
                name: containerName,
                environment:getEnv(deviceURL)
            }]
        },
        count: 1,
        launchType: "FARGATE",
        platformVersion: '1.4.0'
    };
}


const getParam = param => {
    return new Promise((res, rej) => {
        parameterStore.getParameter({
            Name: param
        }, (err, data) => {
            if (err) {
                return rej(err);
            }
            return res(data);
        });
    });
};

function saveItem(item) {
    const params = {
        TableName: TABLE_NAME,
        Item: item
    };

    return dynamo
        .put(params)
        .promise()
        .then((result) => {
            return item;
        }, (error) => {
            return error;
        });
}

function getItem(itemId) {
    const params = {
        Key: {
            UUID: itemId
        },
        TableName: TABLE_NAME
    };

    return dynamo
        .get(params)
        .promise()
        .then((result) => {
            return result.Item;
        }, (error) => {
            return error;
        });
}

function deleteItem(itemId) {
    const params = {
        Key: {
            UUID: itemId
        },
        TableName: TABLE_NAME
    };
    return dynamo.delete(params).promise();
}

module.exports = {
    invokeTask
  };
