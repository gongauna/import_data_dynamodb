const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');

const getItemsToDelete = async (ambiente) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const { Items } = await dynamodbClient.scan({
    TableName: 'internal_users'+ambiente,
    FilterExpression: '#type = :typeValue',
    ExpressionAttributeNames: {
      '#type': 'type' // Mapear el nombre del campo
    },
    ExpressionAttributeValues: {
      ':typeValue': 'USER|ROLE' // Valor que queremos filtrar
    }
  }).promise();
  return Items;
}

const deleteItem = async (pkParam, skParam, ambiente) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.delete({
    TableName: 'internal_users'+ambiente,
    Key: {
      pk: pkParam,
      sk: skParam
    },
  }).promise();
  return response;
}


async function deleteInternalUsersRecords(ambiente) {
  console.log("Empezo");
  const items = await getItemsToDelete(ambiente);

  console.log("Cantidad User Role: "+items.length)
  await Promise.all(items.map((item) => {
    deleteItem(item["pk"], item["sk"], ambiente);
  }));
  console.log("Fin")
}

module.exports.deleteInternalUsersRecords = deleteInternalUsersRecords;

