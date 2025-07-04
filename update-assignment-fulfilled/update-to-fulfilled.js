const AWS = require("aws-sdk");
const datosUpdate = require("./data.json");

const update = async (pk, sk) => {
  let ambiente = "";
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
      pk: `${pk}`,
      sk: `${sk}`,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": "fulfilled",
    },
    UpdateExpression: "set #status = :status",
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
};

async function updateProcess(ambiente) {
  console.log("Inicio update to fulfilled");
  let count = 0;
  console.log("Quantity datos:" + datosUpdate.length);

  await Promise.all(
    datosUpdate.map(async (item) => {
      //console.log("Update User: " + JSON.stringify(item));
      count = count +1;
      return update(item.pk, item.sk);
    })
  );
  console.log("End --- Quantity updated: " + count);
}

module.exports.updateProcess = updateProcess;
