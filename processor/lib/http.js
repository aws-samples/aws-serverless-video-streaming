// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

 
var axios = require('axios');
const config=require('./config');

const functions = {};
 
functions.checkOnServer = async () => {
    var serverStatus ;
    const serverUrl='http://'+config.address+':8000/api/server';
    console.log("Checking Server Status...");
   // Make a request for a user with a given ID
    axios.get(serverUrl, {timeout: 3000})
    .then(function (response) {
       return  serverStatus = true;
    })
    .catch(function (error) {
       return serverStatus = false;
    })
 
}

module.exports = functions;

