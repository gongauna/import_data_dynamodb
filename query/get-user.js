const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');

const getUser = async (userEmail) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });


  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.query({
    TableName: 'internal_users_qa_dev',
    IndexName: "email_index",
    ExpressionAttributeNames: {
      "#sk": "sk",
      "#email": "email"
    },
    ExpressionAttributeValues: {
      ":sk": `USER|`,
      ":email": userEmail,
    },
    KeyConditionExpression: "#email = :email AND begins_with(#sk, :sk)"
  }).promise();
  return response.Items;
}

async function executeQuery() {
  const response = await getUser("gonzalo.gauna@vana.gt");
  console.log("response"+JSON.stringify(response));
}

executeQuery();

