// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const { CognitoSync } = require('aws-sdk');
var AWS = require('aws-sdk');
 

   describe_stack = function(){
    const region = process.env.AWS_REGION || "cn-northwest-1";

      var cloudformation = new AWS.CloudFormation({ region:region });

       var params = {
         'StackName': 'video-streaming-origin'
       };

       cloudformation.describeStacks(params, function(err, data) {
         if (err) {
          console.log(JSON.stringify(err));
         } else {
          //console.log(JSON.stringify(data.Stacks[0].Outputs));
           data.Stacks[0].Outputs.forEach(element => {
            if(element.OutputKey==='LBDomain')
            console.log(element.OutputValue);
          });
         }
       });

   }

   describe_stack();
