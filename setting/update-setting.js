const AWS = require('aws-sdk');

const update = async (settingId, bureauKey, executionDate) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const updateParams = {
    TableName: "setting_global_dev",
    Key: { "setting_id": `${settingId}` },
    UpdateExpression:
      `set metadata.#bureau.#last_execution_date = :execution_date`,
    ExpressionAttributeNames: { "#bureau" : bureauKey, "#last_execution_date": "last_execution_date"},
    ExpressionAttributeValues: { ":execution_date": executionDate}
  };

  await dynamodbClient.update(updateParams).promise();//new UpdateCommand(updateParams);
  return true;
}


async function updateSetting() {
  console.log("Actualizando setting");
  const now = new Date().toISOString();
  await update("credit-bureau", "transunion-do", now);
  console.log("Fin Actualizando setting");
}

module.exports.updateSetting = updateSetting;

