const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { stringify } = require('querystring');

const getLoansTypeIndex = async () => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'collection_house_records',
    IndexName: 'type_index',
    ExpressionAttributeNames: {
      "#sk": "sk",
      "#type": "type",
      "#created_at": "created_at"
    },
    ExpressionAttributeValues: {
      ":sk": `HOUSE|avantte|BUCKET|bucket_gt_9`,
      ":type": "LOAN|HOUSE",
      ":created_at": "2024-07-07T10:18:54.369Z"
    },
    KeyConditionExpression: "#type = :type AND begins_with(#sk, :sk)",
    FilterExpression: "#created_at > :created_at"
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

const deleteLoan = async (pkParam, skParam) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.delete({
    TableName: 'collection_house_records',
    Key: {
      pk: pkParam,
      sk: skParam
    },
  }).promise();
  return response;
}


async function deleteCollectionHouseRecordsAssignments() {
  console.log("Empezo delete undefined");
  const items = await getLoansTypeIndex();

  console.log("Cantidad: "+items.length)

  const actives = items.filter((item) => ['active','partial'].includes(item.status));  
  const inactives = items.filter((item) => ['inactive'].includes(item.status));
  console.log("Cantidad actives: "+actives.length)
  console.log("Cantidad inactives: "+inactives.length)

  //itemsfil = [items[0]]
  await Promise.all(items.map((item) => {
    deleteLoan(item["pk"], item["sk"]);
  }));
  console.log("Fin delete undefined")
}

module.exports.deleteCollectionHouseRecordsAssignments = deleteCollectionHouseRecordsAssignments;

