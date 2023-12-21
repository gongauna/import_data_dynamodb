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

const getLoansTypeIndex = async (house) => {
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
      ":sk": `HOUSE|${house}|BUCKET|bucket_gt_5`,
      ":type": "LOAN|HOUSE",
      ":created_at": "2022-11-13T18:00:15.024Z"
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
  console.log("UPDATEEEEEEE222");
  const items1 = await getLoansTypeIndex("avantte");

  console.log("Cantidad: "+items1.length)
  const items = items1;
  await Promise.all(items.map((item) => {
    if (item) {
      const updated = {
        ...item
      };
      updated["props"]["status"] = "inactive";
      updated["status"] = "inactive";
      //console.log("updatedupdated"+JSON.stringify(updated))
      return updateLoanAssignments(updated);
    }
  }));
  console.log("Fin")
}

module.exports.deleteCollectionHouseRecords = updateCollectionHouseRecordWrongHouse;

