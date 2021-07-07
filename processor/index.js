// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const _ = require('lodash');
const ejs = require('ejs');
const fs = require('fs');
const AWS = require('aws-sdk');

const generateTemplate = async () => {
  const channel=process.env.CHANNEL_NAME || "natlgeo"

 console.log(JSON.stringify(process.argv));
  const templateFile = process.argv[2];
  const outputFile = process.argv[3];
  const template = fs.readFileSync(templateFile, 'utf8');
  //console.log(template);
  const output = ejs.render(template, { channel }, {});
  //console.log('output-------'+output);
  fs.writeFileSync(outputFile, output);
};

generateTemplate();