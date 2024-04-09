const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const getAnalysisToDelete = async () => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'document_analysis_records',
    IndexName: 'type_created_index',
    ExpressionAttributeNames: {
      "#type": "type",
      "#created_at": "created_at",
    },
    ExpressionAttributeValues: {
      ":type": "LOAN_REQUEST_INTENT",
      ":created_at": "2024-04-03T00:00:38.081Z",
    },
    KeyConditionExpression: "#type = :type AND #created_at > :created_at"
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

const deleteDocumentAnalysis = async (pk) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.delete({
    TableName: 'document_analysis_records',
    Key: {
      pk: pk,
    },
  }).promise();
  return response;
}

async function deleteAnalysis() {
  console.log("Empezo delete analysis");
  const analysis = await getAnalysisToDelete();
  const props = ["back","front","selfie"];
  console.log("analysis:"+analysis.length);
  const analysisWithoutImages = []
  await Promise.all(analysis.map((item) => {
    if (item && item.quality_analysis) {
      for (const prop of props) {
        if (!item.quality_analysis[prop]) {
          console.log("prop"+prop)
          analysisWithoutImages.push(item);
          break;
        }
      }
    }
  }));
  
  console.log("analysisWithoutImages:"+analysisWithoutImages.length);
  await Promise.all(analysisWithoutImages.map((item) => {
    if (item["pk"]) {
      //console.log("PK"+item["pk"]);
      //deleteDocumentAnalysis(item["pk"]);
    }
  }));
  console.log("delete analysis");
}

module.exports.deleteAnalysis = deleteAnalysis;