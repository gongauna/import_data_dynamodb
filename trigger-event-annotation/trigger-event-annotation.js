const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');


const getAnnotation = async (id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const { Item } = await dynamodbClient.get({
    TableName: 'collection_annotation',
    Key: {
      'id': id
    },
  }).promise();
  return Item;
}

const putEventInEventBridge = async (annotationData) => {
  const eventBridge = new AWS.EventBridge();

  const params = {
    Entries: [
      {
        EventBusName: 'vana',
        Source: 'vana.annotation.service',
        DetailType: 'CollectionAnnotation.Created',
        Detail: JSON.stringify(annotationData),
      }
    ]
  };

  try {
    const result = await eventBridge.putEvents(params).promise();
    //console.log('Event successfully sent:', result);
  } catch (error) {
    console.error('Error sending event:', error);
  }
}

function triggerEventAnnotation() {
const schemaAnnotation = {
    'id': {
      prop: 'id',
      type: String
    },
    'user_id': {
      prop: 'user_id',
      type: String
    }
}

readXlsxFile('../anotaciones_review_issue.xlsx', { schema: schemaAnnotation}).then(async (rows) => {
  console.log("Trigger event review");
  const annotations = rows.rows;
  
  annotations.shift();
  console.log("Cant annotation: "+annotations.length);

  await Promise.all(
    annotations.map(async (annotation) => {
      const annotationData = await getAnnotation(annotation.id);
      console.log(JSON.stringify(annotationData.id))
      await putEventInEventBridge(annotationData);
    })
  )
});
}

module.exports.triggerEventAnnotation = triggerEventAnnotation;