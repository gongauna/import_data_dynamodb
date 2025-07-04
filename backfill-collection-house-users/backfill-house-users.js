const AWS = require("aws-sdk");
const cognitoUtil = require("./get-cognito-user");

const listUsers = async (ambiente) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "us-east-1",
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: "collection_house_records" + ambiente,
    IndexName: "type_index",
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ExpressionAttributeValues: {
      ":type": "USER|HOUSE",
    },
    KeyConditionExpression: "#type = :type",
  };

  let lastEvaluatedKey;
  let items = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
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
};

const updateUser = async (ambiente, item) => {
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
      pk: `${item["pk"]}`,
      sk: `${item["sk"]}`,
    },
    ExpressionAttributeNames: {
      "#props": "props",
      "#created_at": "created_at",
    },
    ExpressionAttributeValues: {
      ":props": item["props"],
      ":created_at": item["props"]["created_at"],
    },
    UpdateExpression: "set #props = :props, #created_at = :created_at",
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
};

async function backfill(ambiente) {
  console.log("Inicio backfill house users");

  let count = 0;
  const { items: users, lastEvaluatedKey } = await listUsers(ambiente, null);

  console.log("Quantity Users:" + users.length);

  await Promise.all(
    [users[0]].map(async (item) => {
      count = count + 1;
      const idCognito = await cognitoUtil.findUserByEmail(item.email);
      const obj = {
        email: item.email,
        pk: item.pk,
        sk: item.sk,
        props: {
          ...item.props,
          id_cognito: idCognito ?? null,
          active:
            item.active === undefined
              ? (item.status ?? "enabled") === "enabled"
                ? true
                : false
              : item.active,
          role: item.role ?? "admin",
        },
      };

      delete obj.props.status;
      
      console.log("Update User: " + JSON.stringify(obj));
      return updateUser(ambiente, obj);
    })
  );
  console.log("End --- Quantity updated: " + count);
}

module.exports.backfill = backfill;

