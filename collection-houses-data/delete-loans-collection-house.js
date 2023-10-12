const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');


const getLoans = async () => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'collection_house_records',
    IndexName: 'type_index',
    Key: {
      type: 'LOAN|HOUSE'
    }
  };
  const { Items } = await dynamodbClient.query({
    TableName: 'collection_house_records',
    IndexName: 'sk_index',
    ExpressionAttributeNames: {
      "#sk": "sk"
    },
    ExpressionAttributeValues: {
      ":sk": `HOUSE|admicarter|BUCKET|bucket_gt_1`,
    },
    KeyConditionExpression: "#sk = :sk"
  }).promise();
  return Items;
}

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
      "#type": "type",
      "#sk": "sk",
      "#created_at": "created_at"
    },
    ExpressionAttributeValues: {
      ":sk": `HOUSE|contacto502|BUCKET|bucket_gt_4`,
      ":type": "LOAN|HOUSE",
      ":created_at": "2023-10-08T19:00:15.024Z"
    },
    KeyConditionExpression: "#type = :type AND begins_with(#sk, :sk)",
    FilterExpression: "#created_at >= :created_at"
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


async function deleteCollectionHouseRecords() {
  console.log("Empezo44555");
  const items = await getLoansTypeIndex();

  console.log("Cantidad: "+items.length)
  /*await Promise.all(items.map((item) => {
    deleteLoan(item["pk"], item["sk"]);
  }));*/
  console.log("Fin")
}

module.exports.deleteCollectionHouseRecords = deleteCollectionHouseRecords;

