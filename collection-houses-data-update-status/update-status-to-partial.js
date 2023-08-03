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
      "#status": "status",
      //"#sk": "sk"
    },
    ExpressionAttributeValues: {
      ":type": `LOAN|HOUSE`,
      ":status_active": "active",
      //":sk": "HOUSE|corpocredit|BUCKET|bucket_gt_4"
    },
    KeyConditionExpression: "#type = :type",
    //KeyConditionExpression: "#sk = :sk",
    FilterExpression: "#status = :status_active"
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

const getLoanState = async (loanId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const foundItem = await dynamodbClient.get({
    TableName: 'loan_state',
    Key: {
      loan_id: loanId
    }
  }).promise();
  return foundItem.Item;
}

const updateAssignment = async (pkParam, skParam) => {
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
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":status": "partial"
    },
    UpdateExpression: "set #status = :status"
  }).promise();
}


async function updateCollectionHouseRecords() {
  const loansActive = await getLoans();

  console.log("Cantidad de loansActive "+ loansActive.length);
  const loansToPartial = [];
  await Promise.all(loansActive.map(async (item) => {

    const loanId = item["pk"].split("|")[1];
    const loanState = await getLoanState(loanId);

    if (loanState["settled"] > 0 && loanState["status"] === "released" ) {
      loansToPartial.push({pk: item["pk"], sk: item["sk"]});
    } else {
      return null
    }
  }));
  console.log("Cantidad de loans: "+loansToPartial.length);

  await Promise.all(loansToPartial.map( async (item) => {
    //console.log("ITEMMMM"+JSON.stringify(item));
    await updateAssignment(item["pk"], item["sk"]);
  }));

  console.log("Finalizado")
}

module.exports.updateCollectionHouseRecords = updateCollectionHouseRecords;

