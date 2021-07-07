// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const AWS = require("aws-sdk");
const region = process.env.AWS_REGION || "cn-northwest-1";
const parameterStore = new AWS.SSM({ region: region });

const putParam = (name, value) => {
  const params = {
    Name: name,
    Value: value,
    Type: "String",
    Overwrite: true,
  };
  parameterStore.putParameter(params, (err, data) => {
    if (err) console.log(err, err.stack);
    // an error occurred
    else console.log(data); // successful response
  });
};

const getParam = async (names) => {
  const params = {
    Names: names,
  };
  const result = await parameterStore.getParameters(params).promise();
  const values = result.Parameters.map(function (obj) {
    return obj.Value;
  });
  return values;
};

module.exports = { getParam, putParam };
