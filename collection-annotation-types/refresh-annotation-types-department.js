const AWS = require('aws-sdk');
const { 
  v4: uuidv4,
} = require('uuid');

const typesCreate = require("./types-create.json");

const getItemsToDelete = async (ambiente) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const { Items } = await dynamodbClient.scan({
    TableName: 'collection_annotation_type'+ambiente,
  }).promise();
  return Items;
}

const deleteType = async (ambiente, id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.delete({
    TableName: 'collection_annotation_type'+ambiente,
    Key: {
      id: id,
    },
  }).promise();
  return response;
}

const createType = async (ambiente, item) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const putParams = {
    TableName: "collection_annotation_type"+ambiente,
    Item: item,
  };
  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.put(putParams).promise();;
  return response;
}

async function refreshAnnotationTypesInformation(ambiente) {
  console.log("Inicio refresh annotation types");
  const typesDelete = await getItemsToDelete(ambiente);
  
  console.log("Cantidad delete: "+typesDelete.length)
  let counter = 0;
  /*await Promise.all(typesDelete.map((item) => {
    if (item["id"]) {
      counter = counter +1;
      deleteType(ambiente, item["id"]);
    }
  }));*/
  console.log("Cantidad borrados: "+counter)
  
  let counterCreate = 0 
  const createdAt = new Date().toISOString();
  await Promise.all(
    typesCreate["types-create"].map((item) => {
      counterCreate = counterCreate + 1;
      console.log("ITEM ID"+item.id)
      return createType(ambiente, {
        "id": item.id,
        "name": item.name,
        "department": item.department,
        "status": "enabled",
        "created_at": createdAt
      })
    })
  )
  console.log("Cantidad creado: "+counterCreate)
  
  console.log("Fin refresh annotation types");
}

module.exports.refreshAnnotationTypesInformation = refreshAnnotationTypesInformation;

