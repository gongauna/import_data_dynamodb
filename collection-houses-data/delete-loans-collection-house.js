const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');


const getLoans = async () => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'collection_house_records',
    IndexName: 'type_index',
    Key: {
      type: 'LOAN|HOUSE'
    }
  };
  const { Items } = await dynamodbClient.query({
    TableName: 'collection_house_records',
    IndexName: 'type_index',
    ExpressionAttributeNames: {
      "#type": "type"
    },
    ExpressionAttributeValues: {
      ":type": `LOAN|HOUSE`,
    },
    KeyConditionExpression: "#type = :type"
  }).promise();
  console.log("CANTIDAD A BORRAR:"+Items.length);
  return Items;
}

const deleteLoan = async (pkParam, skParam) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.delete({
    TableName: 'collection_house_records',
    Key: {
      pk: pkParam,
      sk: skParam
    },
  }).promise();
  return response;
}


async function deleteCollectionHouseRecords() {
  console.log("111");
  const items = await getLoans();

  await Promise.all(items.map((item) => {
    deleteLoan(item["pk"], item["sk"]);
  }));
  console.log("2222")
}

module.exports.deleteCollectionHouseRecords = deleteCollectionHouseRecords;

