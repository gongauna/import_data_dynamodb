const AWS = require('aws-sdk');
const { 
  v4: uuidv4,
} = require('uuid');

const typesCreate = require("./types-create.json");


const listInternalUsers = async (ambiente) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: "internal_users"+ambiente,
      ExpressionAttributeNames: {
        "#type": "type",
      },
      ExpressionAttributeValues: {
        ":type": "USER",
      },
      FilterExpression: "#type = :type",
  };
  
  const maxItems = 10000000;
  let lastEvaluatedKey;
  let items = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.scan(findParams).promise();
    if (foundItems && Array.isArray(foundItems.Items)) {
      items.push(...foundItems.Items);
    }
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

const listAnnotations = async (ambiente, lastKey) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: "collection_annotation"+ambiente,
      FilterExpression: 'attribute_not_exists(#user_department) OR #user_department = :nullValue',
      ExpressionAttributeNames: {
          '#user_department': 'user_department'
      },
      ExpressionAttributeValues: {
          ':nullValue': null
      }
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
    let foundItems = await dynamodbClient.scan(findParams).promise();
    if (foundItems && Array.isArray(foundItems.Items)) {
      items.push(...foundItems.Items);
    }
    //console.log("LastKey"+JSON.stringify(foundItems.LastEvaluatedKey))
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

const updateAnnotations = async (ambiente, item) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const updateParams = {
    TableName: "collection_annotation"+ambiente,
    Key: {
      id: `${item["id"]}`
    },
    ExpressionAttributeNames: {
      "#data": "data",
      "#user_department": "user_department",
    },
    ExpressionAttributeValues: {
      ":data": item["data"],
      ":user_department": item["user_department"],
    },
    UpdateExpression: "set #data = :data, #user_department = :user_department"
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
}

async function backfillAnnotationsDepartment(ambiente) {
  console.log("Inicio backfill annotation department");
  const { items: internalUsers } = await listInternalUsers(ambiente);
  console.log("Cantidad internalUsers:"+internalUsers.length);

  // Mapping users
  const internalUsersMap = new Map();
  internalUsers.map((item) => {
    internalUsersMap.set(item.shown_id, item);
    internalUsersMap.set(item.email, item);
  });

  // Mapping types
  const typesMap = new Map();
  typesCreate["types-create"].map((item) => {
    typesMap.set(item.id, item);
  });

  const lastKey = {"id":"c9215d06-e05b-47a6-91d5-eb58beb36ccf"};
  const { items: annotation, lastEvaluatedKey} = await listAnnotations(ambiente, lastKey);
  console.log("lastEvaluatedKey:"+JSON.stringify(lastEvaluatedKey));
  console.log("Cantidad actualizar:"+annotation.length);
  
  let counterUpdate = 0 
  await Promise.all(
    annotation.map((item) => {
      const typeItem = typesMap.get(item.type)
      const department = (item.created_by ? internalUsersMap.get(item.created_by)?.department : ( typeItem ?  typeItem.department : null )) ?? "vana"

      if (item.user_id) {
        counterUpdate = counterUpdate + 1;
        const obj = {
          "id": item.id,
          "data": { ...item.data, "department": department },
          "user_department": `USER|${item.user_id}|DEPARTMENT|${department}`
        }
        return updateAnnotations(ambiente, obj);
      } else {
        return null;
      }
    })
  );
  console.log("Cantidad actualizados:"+counterUpdate);
  
  console.log("Fin backfill annotation department");
}

module.exports.backfillAnnotationsDepartment = backfillAnnotationsDepartment;

