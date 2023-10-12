const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');

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

const schemaDelete = {
  'id': {
    prop: 'pk',
    type: String
  },
  'house_id': {
    prop: 'sk',
    type: String
  }
}

async function deleteCollectionHouseRecords() {
  readXlsxFile('./duplicados-casas.xlsx', { schema: schemaDelete, sheet: 'Hoja1'}).then(async (rows) => {
    console.log("Inicio")
    const filas = rows.rows;


    console.log("Cantidad"+JSON.stringify(filas[0]));
    await Promise.all(filas.map((item) => {
      deleteLoan(item["pk"], item["sk"]);
    }));
    console.log("Fin")
  });
}

module.exports.deleteCollectionHouseRecords = deleteCollectionHouseRecords;

