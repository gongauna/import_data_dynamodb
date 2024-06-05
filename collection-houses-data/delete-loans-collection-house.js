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

const pruebaQuery = async (id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });
  const dynamodbClient = new AWS.DynamoDB.DocumentClient();

  const queryParams = {
    TableName: 'collection_house_records',
    ExpressionAttributeNames: {
      "#pk": "pk"
    },
    ExpressionAttributeValues: {
      ":pk": `BUCKET|${id}`
    },
    KeyConditionExpression: "#pk = :pk",
  };
  let foundItems = await dynamodbClient.query(queryParams).promise();
  const [ Item ] = foundItems.Items;
  return Item;
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

const updateLoanAssignments = async (assignment) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const currentDateTime = new Date().toISOString();
  const updateParams = {
    TableName: "collection_house_records",
    Key: {
      pk: `${assignment["pk"]}`,
      sk: `${assignment["sk"]}`,
    },
    ExpressionAttributeNames: {
      "#status": "status",
      "#props": "props",
    },
    ExpressionAttributeValues: {
      ":status": assignment["status"],
      ":props": assignment["props"],
    },
    UpdateExpression: "set #status = :status, #props = :props"
  };

  await dynamodbClient.update(updateParams).promise();//new UpdateCommand(updateParams);
  return true;
}

const createLoanAssignments = async (item) => {
  const currentDateTime = new Date().toISOString();
  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const putParams = {
    TableName: "collection_house_records",
    Item: item,
  };
  await dynamodbClient.put(putParams).promise();
  return item;
}


async function deleteCollectionHouseRecords() {
  console.log("Empezo este 11");
  const houses = ["avantte", "recsa", "xdmasters", "itlumina", "contacto502", "recaguagt", "tecserfin", "activagroup", "lexcom"]
  houses.forEach(async (house) => {
    const items = await getLoansTypeIndex(house);
  
    /*if (house === "activagroup") {
      await Promise.all(items.map((item) => {
        deleteLoan(item["pk"], item["sk"]);
      }))
    }*/
    console.log(`** ${house}: `+items.length)
  })
  /*await Promise.all(items.map((item) => {
    deleteLoan(item["pk"], item["sk"]);
  }));*/
  console.log("Fin")
}

async function updateCollectionHouseRecordWrongHouse() {
  console.log("Prueba consulta.");
  const item = await pruebaQuery("bucket_gt_5");

  console.log("Item: "+JSON.stringify(item))
  console.log("Fin")
}

module.exports.deleteCollectionHouseRecords = updateCollectionHouseRecordWrongHouse;

