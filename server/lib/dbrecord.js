// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const db = require('./db');

var item = new Object();

item.channel='test05';
item.isFlv='true';
item.isHls='false';
item.isVideo='false';
item.isImage='false';
item.isMotion='false';
item.isOnDemand='false';
item.video_time='60';
item.image_time='30';
item.hls_time='2';
item.hls_list_size='5';
item.key='534524w5twsdgf';

db.saveItem(item);