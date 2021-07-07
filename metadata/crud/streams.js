// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const _ = require("lodash");

// connection with dynamodb
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = "video-metadata";

exports.handler = async (event) => {
  // TODO implement
  let data;
  try {
    switch (event.httpMethod) {
      case "GET":
          if(_.isNull(event.pathParameters))
          return getAllData(event)
          else
        data = await readData(event);
        return { statusCode: 200, body: JSON.stringify(data) };
      case "POST":
        data = await createData(event);
        return { statusCode: 200, body: JSON.stringify(data) };
      case "PUT":
        data = await updateData(event);
        return { statusCode: 200, body: JSON.stringify(data) };
      case "DELETE":
        data = await deleteData(event);
        return { statusCode: 200, body: JSON.stringify(data) };
      default:
        return {
          statusCode: 404,
          body: `Unsupported method "${event.httpMethod}"`,
        };
    }
  } catch (err) {
    console.log("error has accured: " + err);
  }
};

const getAllData = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    var params = {
        TableName : tableName
    };
    const data = await ddb.scan(params).promise();
    const items = data.Items;

    const response = {
        statusCode: 200,
        body: JSON.stringify(items)
    };
    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
// Get order with uuid provided in url
const readData = async (event) => {
    // resource: '/stream',
    // resource: '/stream/{id}',
    //pathParameters is null
  let streamId = event.pathParameters.id;

  let params = {
    TableName: tableName,
    Key: {
      id: streamId,
    },
  };
  return ddb
    .get(params)
    .promise()
    .then((result) => {
      return result.Item;
    });
};



const createData = async (event) => {
  let item = JSON.parse(event.body);
  item.id = uuidv4();
  //add 3 day ttl to db
  let date = Date.now();
  item.TimeStamp = addDays(date, 3);
  let exp = (new Date(item.outdate).getTime() / 1000 | 0);
  item.key=getSignKey(exp,item.id);
  console.log(date);
  let params = {
    TableName: tableName,
    Item: item,
  };
  return ddb
    .put(params, (err, data) => {
      if (err) {
        console.error("Unable to add item", params.Item.Id);
        console.error("Error JSON:", JSON.stringify(err));
      } else {
        console.log("Vehicle added to table: ", params.Item);
      }
    })
    .promise()
    .then(() => {
      return item;
    });
};
//Update data using uuid
const updateData = async (event) => {

  let streamId = event.pathParameters.id;
  let body = JSON.parse(event.body);
//   let isFlv = body.isFlv;
//   let isHls = body.isHls;
//   let isVideo = body.isVideo;
//   let isImage = body.isImage;
//   let isMotion = body.isMotion;
//   let isOnDemand = body.isOnDemand;
//   let videoTime = body.video_time;
//   let imageTime = body.image_time;
//   let hlsTime = body.hls_time;
//    let outdate = body.outdate;

  return updateItem(streamId, body);
};

const updateItem = async (itemId, item) => {
  let vbl = "x";
  let adder = "y";
  let updateexp = "set ";
  let itemKeys = Object.keys(item);
  let expattvalues = {};

  for (let i = 0; i < itemKeys.length; i++) {
    vbl = vbl + adder;

    if (itemKeys.length - 1 == i) updateexp += itemKeys[i] + " = :" + vbl;
    else updateexp += itemKeys[i] + " = :" + vbl + ", ";

    expattvalues[":" + vbl] = item[itemKeys[i]];
  }

  console.log("update expression and expressionAttributeValues");
  console.log(updateexp, expattvalues);

  const params = {
    TableName: tableName,
    Key: {
      id: itemId,
    },
    ConditionExpression: "attribute_exists(id)",
    UpdateExpression: updateexp,
    ExpressionAttributeValues: expattvalues,
    ReturnValues: "ALL_NEW",
  };

  return ddb
    .update(params)
    .promise()
    .then(
      (response) => {
        return response.Attributes;
      },
      (error) => {
        return error;
      }
    );
};
//Delete data function
const deleteData = async (event) => {
  let streamId = event.pathParameters.id;
  let params = {
    TableName: tableName,
    Key: {
      id: streamId,
    },
    ConditionExpression: "attribute_exists(id)",
  };
  return ddb
    .delete(params, function (err, data) {
      if (err) {
        console.error(
          "Unable to delete item. Error JSON:",
          JSON.stringify(err, null, 2)
        );
      } else {
        console.log("Delete succeeded:", JSON.stringify(data, null, 2));
      }
    })
    .promise()
    .then(() => {
      return "stream deleted";
    });
};

//Function that adds 3 days to current date and returns it in unix format
const addDays = (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return Math.floor(result.getTime() / 1000);
};

const getSignKey=(date,id)=>{
const md5 = require('crypto').createHash('md5');
let key = 'nodemedia2017privatekey';
let exp = date;
let streamId = '/stream/'+id;
return (exp+'-'+md5.update(streamId+'-'+exp+'-'+key).digest('hex'));
}

// {
//     "channel":"test05",
//     "isFlv":"true",
//     "isHls":"false",
//     "isVideo":"false",
//     "isImage":"false",
//     "isMotion":"false",
//     "isOnDemand":"false",
//     "video_time":"60",
//     "image_time":"30",
//     "hls_time":"2",
//     "hls_list_size":"5",
//     "outdate":"2022-12-09",
//     "isRtmp":"true",
//     "key":"534524w5twsdgf"
//     }
// {
//   "channel":"test05",
//   "isFlv":"true",
//   "isHls":"false",
//   "isVideo":"false",
//   "isImage":"false",
//   "isMotion":"false",
//   "isOnDemand":"false",
//   "video_time":"60",
//   "image_time":"30",
//   "hls_time":"2",
//   "hls_list_size":"5",
//   "outdate":"2022-12-09",
//   "isRtmp":"true",
//   "key":"534524w5twsdgf",
//   "WaterMark":{
//    "WaterMarkFontColor":"red"  
//   }
//   }