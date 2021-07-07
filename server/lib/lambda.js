// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

var AWS = require("aws-sdk");
var lambda = new AWS.Lambda({ region: "us-east-1" });

const invokeLambda = async (param) => {
  var params = {
    FunctionName: "video-streaming-processor" /* required */,
    Payload: JSON.stringify(param),
  };
  console.log('invoke lambda to run ecs');
  lambda.invoke(params, function (err, data) {
      console.log(params);
    if (err) console.log(err, err.stack); // an error occurred
    // if (data.Payload) {
    //   console.log(data.Payload);
    //   response = JSON.parse(data.Payload);
    //   console.log(JSON.stringify(response));
    // } 
    console.log(data);
  });
};
module.exports = {
  invokeLambda,
};
