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
  const findParams = {
    TableName: 'collection_house_records',
    IndexName: 'type_index',
    ExpressionAttributeNames: {
      "#type": "type",
      //"#sk": "sk"
    },
    ExpressionAttributeValues: {
      ":type": `LOAN|HOUSE`,
      //":sk": "HOUSE|admicarter|BUCKET|bucket_gt_1"
    },
    KeyConditionExpression: "#type = :type",
  }

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

const updateAssignment = async (pkParam, skParam, props) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  return await dynamodbClient.update({
    TableName: 'collection_house_records',
    Key: {
      pk: pkParam,
      sk: skParam
    },
    ExpressionAttributeNames: {
      "#props": "props"
    },
    ExpressionAttributeValues: {
      ":props": props
    },
    UpdateExpression: "set #props = :props"
  }).promise();
}


async function updateCollectionHouseRecords() {
  const loansActive = await getLoans();

  console.log("Cantidad de loansActive "+ loansActive.length);
  //const loansToUpdate = [loansActive[2]];
  await Promise.all(loansActive.map(async (item) => {
      const props = item["props"];
      const bucket_name = props["bucket_name"].replace("Bucket ", "");
      props["bucket_name"] = bucket_name;
      //console.log("updating::"+JSON.stringify(item));
      //console.log("props::"+JSON.stringify(props));
      await updateAssignment(item["pk"], item["sk"], props);
  }));

  console.log("Finalizado");
}

module.exports.updateCollectionHouseRecordsBucketName = updateCollectionHouseRecords;

