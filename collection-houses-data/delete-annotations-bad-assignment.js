const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');

const getAnnotationToDelete = async (loan_id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'collection_annotation',
    IndexName: 'loan_index',
    ExpressionAttributeNames: {
      "#type": "type",
      "#loan_id": "loan_id",
      "#created_at": "created_at"
    },
    ExpressionAttributeValues: {
      ":loan_id": loan_id,
      ":type": "collection_house_assignment",
      ":created_at": "2023-09-17T05:00:15.024Z"
    },
    KeyConditionExpression: "#loan_id = :loan_id",
    FilterExpression: "#created_at >= :created_at AND #type = :type"
  };

  let result = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
    if ((foundItems) && (foundItems.Items)) {
      result = result.concat(foundItems.Items);
    }
    if (typeof foundItems.LastEvaluatedKey != "undefined") {
      moreItems = true;
      findParams["ExclusiveStartKey"] = foundItems.LastEvaluatedKey;
    }
  }
  return result;
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

const schemaUpdate = {
  'bucket_id': {
    prop: 'bucket_id',
    type: String
  },
  'loan_id': {
    prop: 'loan_id',
    type: String
  },
  'house_id': {
    prop: 'house_id',
    type: String
  },
  'assigned_at': {
    prop: 'assigned_at',
    type: Date
  },
  'assigned_end_at': {
    prop: 'assigned_end_at',
    type: Date
  }
}

async function deleteBadAssignment() {
  readXlsxFile('./data-update-assigned.xlsx', { schema: schemaUpdate, sheet: 'Hoja1'}).then(async (rows) => {
    console.log("Inicio3333")
    const filas = rows.rows;

    const annotationsToDeleteArray = await Promise.all(filas.map((item) => getAnnotationToDelete(item.loan_id)))
    const annotationsToDelete = [];
    annotationsToDeleteArray.map((el) => {
      if (el.length > 0) {
        el.forEach((i) => annotationsToDelete.push(i)); 
      }
    });
    const filtered = annotationsToDelete.map((item) => item)
    console.log("CANTIDAD filtered: "+filtered.length);
    console.log("item test"+JSON.stringify(filtered[100]))
    /*await Promise.all(annotationsToDelete.map((item) => {
     deleteAnnotation(item["id"]);
    }));*/

    console.log("Fin. Borrado:")
  });
}

module.exports.deleteBadAssignment = deleteBadAssignment;

