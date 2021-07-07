// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

const AWS = require('aws-sdk');

const region = process.env.AWS_REGION || "cn-northwest-1";

let dynamo = new AWS.DynamoDB.DocumentClient({ region:region });

const TABLE_NAME = 'video-metadata';

module.exports.initializateDynamoClient = newDynamo => {
	dynamo = newDynamo;
};

module.exports.saveItem = item => {
	const params = {
		TableName: TABLE_NAME,
		Item: item
	};

	return dynamo
		.put(params)
		.promise()
		.then((result) => {
			return item;
		}, (error) => {
			return error;
		});
};

module.exports.getItem = itemId => {
	const params = {
		Key: {
			id: itemId
		},
		TableName: TABLE_NAME
	};

	return dynamo
		.get(params)
		.promise()
		.then((result) => {
			return result.Item;
		}, (error) => {
			return error;
		});
};

module.exports.deleteItem = itemId => {
	const params = {
		Key: {
			id: itemId
		},
		TableName: TABLE_NAME
	};

	return dynamo.delete(params).promise();
};

module.exports.updateItem = (itemId, item) => {
	
	let vbl = "x";
	let adder = "y";
	let updateexp = 'set ';
	let itemKeys =  Object.keys(item);
	let expattvalues = {};

	for (let i = 0; i < itemKeys.length; i++) {
		vbl = vbl+adder;

		if((itemKeys.length-1)==i)
			updateexp += itemKeys[i] + ' = :'+ vbl;
		else
			updateexp += itemKeys[i] + ' = :'+ vbl + ", ";

		expattvalues[":"+vbl] = item[itemKeys[i]];
	}

	console.log("update expression and expressionAttributeValues");
	console.log(updateexp, expattvalues);

	const params = {
		TableName: TABLE_NAME,
		Key: {
			id: itemId
		},
		ConditionExpression: 'attribute_exists(id)',
		UpdateExpression: updateexp,
		ExpressionAttributeValues: expattvalues,
		ReturnValues: 'ALL_NEW'
	};
	

	return dynamo
		.update(params)
		.promise()
		.then(response => {
			return response.Attributes;
		}, (error) => {
			return error;
		});
};