// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const md5 = require('crypto').createHash('md5');
let key = 'nodemedia2017privatekey';
let exp = (Date.now() / 1000 | 0) + 60000;
let streamId = '/stream/test05';
console.log(exp+'-'+md5.update(streamId+'-'+exp+'-'+key).digest('hex'));

// var streamName="test05";
// var password = '123456';
// var cryptedPassword = cryptPwd("/live/stream-1503458721-nodemedia2017privateke");
// var mytime=new Date("2022/8/24 11:25:22").getTime();
// console.log(mytime);
// console.log(cryptedPassword);