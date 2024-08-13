const AWS = require('aws-sdk');
const fs = require('fs');

const lambda = new AWS.Lambda({ region: 'us-east-1' }); 

const listDocumentAnalysis = async (ambiente, lastKey) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: "document_analysis_records",
    IndexName: "type_created_index",
    ExpressionAttributeNames: {
      "#type": "type",
      "#created_at": "created_at",
    },
    ExpressionAttributeValues: {
      ":type": "LOAN_REQUEST_INTENT",
      ":created_at": "2024-08-01T05:00:15.024Z"
    },
    KeyConditionExpression: "#type = :type AND #created_at > :created_at"
};

  if (lastKey) {
    findParams["ExclusiveStartKey"] = lastKey;
  }
  
  const maxItems = 10000;
  let lastEvaluatedKey;
  let items = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
    if (foundItems && Array.isArray(foundItems.Items)) {
      items.push(...foundItems.Items);
    }
    console.log("LastKey"+JSON.stringify(foundItems.LastEvaluatedKey))
    if (typeof foundItems.LastEvaluatedKey !== "undefined") {
      moreItems = true;
      findParams["ExclusiveStartKey"] = foundItems.LastEvaluatedKey;
      if (items.length >= maxItems) {
        moreItems = false;
        lastEvaluatedKey = foundItems.LastEvaluatedKey;
      }
    }
  }
  return { items: items, lastEvaluatedKey: lastEvaluatedKey };
}

const checkLabelsInResponse = (labelsToDetect, minConfidence, response) => {
  const labelsMust = ["Phone", "Mobile Phone"]
  const result = [];

  // Loop through the labels you want to detect
  for (let label of labelsMust) {
    const foundLabel = response?.data?.labels?.find(item => item.name === label);

    // Check if the label exists and if the confidence is greater than the minimum
    if (foundLabel && foundLabel.confidence >= minConfidence) {
        result.push({ name: label, confidence: foundLabel.confidence });
    }
  }
  
  if (result.length===0) {
    return result;
  }

  for (let label of labelsToDetect) {
      // Find the label in the response
      const foundLabel = response?.data?.labels?.find(item => item.name === label);

      // Check if the label exists and if the confidence is greater than the minimum
      if (foundLabel && foundLabel.confidence >= minConfidence) {
          result.push({ name: label, confidence: foundLabel.confidence });
      }
  }

  return result;
}

async function analyzeDocuments(ambiente) {
  console.log("Inicio document analyzer");
  const { items: documentAnalysis } = await listDocumentAnalysis(ambiente);
  console.log("Cantidad analisis:"+documentAnalysis.length);
  
  const processedData = await Promise.all(
    documentAnalysis.map(async (item) => {
      const imageUrl = item.quality_analysis.back.url;
      const lambdaParams = {
        FunctionName: 'detect-labels',
        Payload: JSON.stringify({
          "data": {
            "image_url": imageUrl,
          }
        })
      };
      
      const response = await lambda.invoke(lambdaParams).promise();
      const parsedBody = JSON.parse(JSON.parse(response.Payload).body);

      const labelsReponse = checkLabelsInResponse(["Hardware", "Screen", "Monitor", "Electronics", "Computer Hardware"], 80, parsedBody);

      if (labelsReponse.length > 0) {
        return {
          loan_request_id: item.sk.split("|")[1],
          image_url: imageUrl,
          user_id: item.user_id,
          labels: labelsReponse
        }
      } else {
        return null;
      }
    })
  )

  const filtered = processedData.filter((item) => item);
  const outputFilePath = 'stats-doc-analysis.json';
  fs.writeFileSync(outputFilePath, JSON.stringify(filtered));
  

  console.log("Fin analisis");
}

module.exports.analyzeDocuments = analyzeDocuments;

