const AWS = require('aws-sdk');

const listUserWorkInformation = async (ambiente, lastKey) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: "costumer_tickets_records"+ambiente,
      IndexName: "type_sk_index",
      ExpressionAttributeNames: {
        "#type": "type",
        "#sk": "sk",
        "#updated_at": "updated_at"
      },
      ExpressionAttributeValues: {
        ":type": "TICKET_WORK_INFORMATION",
        ":sk": "TYPE",
        ":updated_at": "2024-07-21T16:10:20.827Z"
      },
      KeyConditionExpression: "#type = :type AND begins_with(#sk,:sk)",
      FilterExpression: "#updated_at >= :updated_at"
  };

  if (lastKey) {
    findParams["ExclusiveStartKey"] = lastKey;
  }
  
  const maxItems = 100000;
  let lastEvaluatedKey;
  let items = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
    if (foundItems && Array.isArray(foundItems.Items)) {
      items.push(...foundItems.Items);
    }
    console.log("LastKey"+JSON.stringify(foundItems.LastEvaluatedKey))
    if (typeof foundItems.LastEvaluatedKey !== "undefined") {
      moreItems = true;
      findParams["ExclusiveStartKey"] = foundItems.LastEvaluatedKey;
      if (items.length >= maxItems) {
        moreItems = false;
        lastEvaluatedKey = foundItems.LastEvaluatedKey;
      }
    }
  }
  return { items: items, lastEvaluatedKey: lastEvaluatedKey };
}

const getMetadataRecord = async (ambiente, userId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'internal_metadata'+ambiente,
    ExpressionAttributeNames: {
      "#pk": "pk",
    },
    ExpressionAttributeValues: {
      ":pk": `USER_INFORMATION|${userId}`,
    },
    KeyConditionExpression: "#pk = :pk",
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

const getLoanRequest = async (ambiente, id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'loan_request'+ambiente,
    Key: {
      loan_request_id: id
    }
  };
  
  const { Item } = await dynamodbClient.get(params).promise();
  return Item;
}


const getUser = async (ambiente,id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'user'+ambiente,
    Key: {
      user_id: id
    }
  };
  
  const { Item } = await dynamodbClient.get(params).promise();
  return Item;
}

const updateMetadata = async (ambiente, item) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const updateParams = {
    TableName: "internal_metadata"+ambiente,
    Key: {
      pk: `${item["pk"]}`,
      sk: `${item["sk"]}`
    },
    ExpressionAttributeNames: {
      "#props": "props",
    },
    ExpressionAttributeValues: {
      ":props": item["props"],
    },
    UpdateExpression: "set #props = :props"
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
}

const createMetadata = async (ambiente, item) => {
  const currentDateTime = new Date().toISOString();
  const dbItem = {
    ...item,
    created_at: currentDateTime,
    updated_at: currentDateTime
  };

  const putParams = {
    TableName: "internal_metadata"+ambiente,
    Item: dbItem,
  };
  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.put(putParams).promise();;
  return response;
}

async function backfillUserWorkInformation(ambiente) {
  console.log("Inicio backfill user WORK information in metadata table");
  const { items: workInformation } = await listUserWorkInformation(ambiente);
  console.log("Cantidad workInformation:"+workInformation.length);
  
  let counterCreate = 0 
  let counterUpdate = 0 
  const promises = workInformation.map(async (item) => {
      const loanRequestId = item.sk.split("|")[3];
      if (!loanRequestId) {
        return null;
      }

      const loanRequest = await getLoanRequest(ambiente, loanRequestId)
      if (!loanRequest) {
        return null;
      }

      const [[metadataRecord], userData] = await Promise.all([
        getMetadataRecord(ambiente, loanRequest.user_id),
        getUser(ambiente, loanRequest.user_id)
      ]);

      if (!userData.personal.country) {
        console.log("####################### USER SIN PAIS #######################: "+loanRequest.user_id);
        return;
      }

      const workKey = userData.personal.country === "GT" ? "igss" : (userData.personal.country === "HN" ? "rtn" : null);
      if (!workKey) {
        console.log("####################### USER workKey #######################: "+loanRequest.user_id);
        return;
      }

      if (!metadataRecord) {
        //Create record
        const itemCreate = {
          "pk": `USER_INFORMATION|${loanRequest.user_id}`,
          "sk": `USER_INFORMATION|${loanRequest.user_id}`,
          "props": {
            [workKey]: {...item.props}
          },
          "shown_id": `${loanRequest.user_id}`,
          "type": "USER_INFORMATION",
        }
        //console.log("CREATING RECORD"+JSON.stringify(itemCreate))
        counterCreate = counterCreate +1;
        return createMetadata(ambiente, itemCreate);
      } else {
        const itemUpdate = {
          ...metadataRecord
        }

        itemUpdate.props = { 
          ...itemUpdate.props , 
          [workKey]: {...item.props}
        }
        counterUpdate = counterUpdate +1;
        //console.log("Updating RECORD"+JSON.stringify(itemUpdate))
        return updateMetadata(ambiente, itemUpdate);
      }
  })
  
  await Promise.all(promises);

  console.log("Cantidad creados:"+counterCreate);
  console.log("Cantidad actualizados:"+counterUpdate);
  
  console.log("Fin backfill user work information");
}

module.exports.backfillUserWorkInformation = backfillUserWorkInformation;

