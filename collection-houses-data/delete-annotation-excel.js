const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const schemaAnnotation = {
  'id': {
    prop: 'id',
    type: String
  },
}

const deleteAnnotation = async (idParam) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.delete({
    TableName: 'collection_annotation',
    Key: {
      id: idParam,
    },
  }).promise();
  return response;
}


async function deleteAnnotations() {
  console.log("Empezo borrado excel");
  readXlsxFile('./Anotaciones_borrar.xlsx', { schema: schemaAnnotation, sheet: 'Anotaciones_borrar'}).then(async (rows) => {
    const arrayAnnotationToDelete = rows.rows;

    await Promise.all(
      arrayAnnotationToDelete.map((item) => {
        deleteAnnotation(item["id"]);

        console.log("IDDD"+item["id"]);
      })
    )
  })
}

module.exports.deleteAnnotations = deleteAnnotations;