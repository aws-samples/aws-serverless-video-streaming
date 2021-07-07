// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

"use strict";
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const ssm = require("./ssm");
// const socketIo = require("socket.io");
// connection with dynamodb
const region = process.env.AWS_REGION || "cn-northwest-1";
const ddb = new AWS.DynamoDB.DocumentClient({ region: region });
const tableName = "video-metadata";
const onlineTableName = "video-streaming";
// Constants
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";

const CLIENT_BUILD_PATH = path.join(__dirname, "../../client/build");

// App
const app = express();

// setupWebSocket.js
const WebSocket = require("ws");

const server = http.createServer(app);

// accepts an http server (covered later)
function setupWebSocket(server) {
  // ws instance
  const wss = new WebSocket.Server({ noServer: true });

  // broadcastPipeline(wss.clients);

  // handle upgrade of the request
  server.on("upgrade", function upgrade(request, socket, head) {
    console.info("upgrade:", upgrade);
    try {
      // authentication and some other steps will come here
      // we can choose whether to upgrade or not

      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit("connection", ws, request);
      });
    } catch (err) {
      console.log("upgrade exception", err);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
  });

  // what to do after a connection is established
  wss.on("connection", (ctx) => {
    // print number of active connections
    console.log("connected", wss.clients.size);

    // handle message events
    // receive a message and echo it back
    ctx.on("message", (message) => {
      console.log(`Received message => ${message}`);
      console.log("wss.clients:", wss.clients);
      // ctx.send(`you said ${message}`);
      for (let c of wss.clients.values()) {
        c.send(JSON.stringify(JSON.parse(message)));
      }
    });

    // handle close event
    ctx.on("close", () => {
      console.log("closed", wss.clients.size);
    });

    // sent a message that we're good to proceed
    ctx.send(JSON.stringify({ msg: "connection established." }));
  });
}

setupWebSocket(server);

// Static files
app.use(express.static(CLIENT_BUILD_PATH));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.use("/login", (req, res) => {
  res.send({
    token: "test123",
  });
});

app.get("/streamdns", async (req, res) => {
  res.set("Content-Type", "application/json");
  const value = await ssm.getParam(["pullDNS", "pushDNS"]);
  const data = {};
  data.pullDNS = value[0];
  data.pushDNS = value[1];
  const response = {
    statusCode: 200,
    data: data,
  };
  res.json(response);
});

app.post("/streamdns", async (req, res) => {
  let body = req.body;
  await ssm.putParam("pullDNS", body.pullDNS);
  await ssm.putParam("pushDNS", body.pushDNS);
  res.send("success");
});

app.get("/videostreams/online", async (req, res) => {
  res.set("Content-Type", "application/json");
  //  console.info('received:', event);
  var params = {
    TableName: onlineTableName,
  };
  const data = await ddb.scan(params).promise();
  const items = data.Items;

  const response = {
    statusCode: 200,
    data: items,
  };
  console.log(response);
  res.send(response);
});
// API
app.get("/videostreams", async (req, res) => {
  res.set("Content-Type", "application/json");
  //  console.info('received:', event);
  var params = {
    TableName: tableName,
  };
  const data = await ddb.scan(params).promise();
  const items = data.Items;

  const response = {
    statusCode: 200,
    data: items,
  };
  res.send(response);
});

//update stream
app.put("/videostreams/:id", async (req, res) => {
  let streamId = req.params.id;
  let body = req.body;
  updateItem(streamId, body, res);
});

//delete  an stream
app.delete("/videostreams/:id", async (req, res) => {
  let streamId = req.params.id;
  console.log(streamId);
  let params = {
    TableName: tableName,
    Key: {
      id: streamId,
    },
    ConditionExpression: "attribute_exists(id)",
  };
  try {
    await ddb
      .delete(params, function (err, data) {
        if (err) {
          //   console.log("Unable to delete item. Error JSON:",JSON.stringify(err, null, 2))
        } else {
          console.log("Delete succeeded:", JSON.stringify(data));
        }
      })
      .promise();
    res.send("deleted stream id:" + streamId);
  } catch (err) {
    res.send("Unable to delete item id:" + streamId);
  }
});

//save updated employee
app.post("/videostreams", (req, res) => {
  let item = req.body;
  item.id = uuidv4();
  //add 3 day ttl to db
  // let date = Date.now();
  // item.TimeStamp = addDays(date, 3);
  let exp = (new Date(item.outdate).getTime() / 1000) | 0;
  item.key = getSignKey(exp, item.id);

  let params = {
    TableName: tableName,
    Item: item,
  };
  ddb
    .put(params, (err, data) => {
      if (err) {
        console.error("Error JSON:", JSON.stringify(err));
      } else {
        console.log(" added to table: ", item);
      }
    })
    .promise()
    .then(() => {
      return res.send(item);
    });
});

// All remaining requests return the React app, so it can handle routing.
// app.get('*', function (request, response) {
//   response.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
// });
const updateItem = async (itemId, item, res) => {
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

  // console.log("update expression and expressionAttributeValues");
  //console.log(updateexp, expattvalues);

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
        res.json(response);
      },
      (error) => {
        res.send(error);
      }
    );
};

const addDays = (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return Math.floor(result.getTime() / 1000);
};

const getSignKey = (date, id) => {
  const md5 = require("crypto").createHash("md5");
  let key = "nodemedia2017privatekey";
  let exp = date;
  let streamId = "/stream/" + id;
  return exp + "-" + md5.update(streamId + "-" + exp + "-" + key).digest("hex");
};
// app.listen(PORT);
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
console.log(`Running on http://${HOST}:${PORT}`);
