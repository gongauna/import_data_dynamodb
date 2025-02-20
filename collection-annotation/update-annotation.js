const AWS = require('aws-sdk');
const readXlsxFile = require('read-excel-file/node')
const { 
  v4: uuidv4,
} = require('uuid');

const getAnnotation = async (id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: "collection_annotation",
      ExpressionAttributeNames: {
        "#id": "id"
      },
      ExpressionAttributeValues: {
        ":id": id,
      },
      KeyConditionExpression: "#id = :id",
  };
  
  let foundItems = await dynamodbClient.query(findParams).promise();
  return foundItems.Items[0];
}

const updateAnnotationItem = async (id, data) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const updateParams = {
    TableName: "collection_annotation",
    Key: {
      id: `${id}`
    },
    ExpressionAttributeNames: {
      "#data": "data",
    },
    ExpressionAttributeValues: {
      ":data": data,
    },
    UpdateExpression: "set #data = :data"
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
}

const schemaUpdate = {
  'user_id': {
    prop: 'user_id',
    type: String
  },
  'loan_request_id': {
    prop: 'loan_request_id',
    type: String
  },
  'id': {
    prop: 'id',
    type: String
  },
  'data_text': {
    prop: 'data_text',
    type: String
  }
}

async function updateAnnotation() {
  console.log("Inicio update annotaions");
  readXlsxFile('./anotaciones_risk_issue.xlsx', { schema: schemaUpdate }).then(async (rows) => {
    const filas = rows.rows;

    console.log("Cantidad"+filas.length)
    await Promise.all(filas.map(async (item) => {
      console.log("Id anotacion:"+item.id);
      const annotation = await getAnnotation(item.id);
      //console.log("Annotation:"+JSON.stringify(annotation));

      const dataPayload = {
        ...annotation.data,
      }
      dataPayload.text = annotation.data.text.replace("Decision: REJECTED,", "Decision: DYNAMIC_OFFER,");
      //console.log("dataPayload"+JSON.stringify(dataPayload));
      return updateAnnotationItem(item.id, dataPayload)

    }))
  });
}

module.exports.updateAnnotation = updateAnnotation;

