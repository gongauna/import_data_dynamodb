const AWS = require("aws-sdk");

const update = async (ambiente, item) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "us-east-1",
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const updateParams = {
    TableName: "collection_house_records" + ambiente,
    Key: {
      pk: "LOAN|d1931b24-6022-4962-9909-c4d2e6537568",
      sk: "HOUSE|optima|BUCKET|bucket_do_1",
    },
    /*ExpressionAttributeNames: {
      "#quantity": "quantity",
    },*/
    ExpressionAttributeValues: {
      ":quantity": -15,
    },
    UpdateExpression: "ADD quantity :quantity",
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
};

async function test(ambiente) {
  console.log("Inicio prueba");

  await update(ambiente, {});
  console.log("End prueba");
}

module.exports.test = test;
