// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const AWS = require("aws-sdk");
const logger=require("./logger");
const fs = require('fs');

const region = process.env.AWS_REGION || "cn-northwest-1";
const s3 = new AWS.S3({ region:region });

var functions = {};

functions.downloadObject=(bucket, fileKey, filePath)=> {
  console.log('downloading', bucket, fileKey, filePath);
  return new Promise(function (resolve, reject) {
    const file = fs.createWriteStream(filePath),
      stream = s3.getObject({
        Bucket: bucket,
        Key: fileKey
      }).createReadStream();
    stream.on('error', reject);
    file.on('error', reject);
    file.on('finish', function () {
      console.log('downloaded', bucket, fileKey);
      resolve(filePath);
    });
    stream.pipe(file);
  }); 
}

functions.putObject = (params) => {
  //  console.log("s3.putObject");
 // console.log(JSON.stringify(params, null, 2));
  return s3.putObject(params, function (copyErr, copyData) {
    if (copyErr) {
     // console.log(copyErr);
    }
    else {
      logger.log('Copied: ', params.Key);
    }
  }).promise();
};

module.exports = functions;
