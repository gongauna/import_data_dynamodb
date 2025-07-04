const AWS = require("aws-sdk");
const items = require("./update-records.json");

const listJournal = async (ambiente, lastKey) => {
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
      ":type": "LOAN|JOURNAL",
    },
    KeyConditionExpression: "#type = :type",
  };

  if (lastKey) {
    findParams["ExclusiveStartKey"] = lastKey;
  }

  const maxItems = 24500;
  let lastEvaluatedKey;
  let items = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
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
};

const getUser = async (email, ambiente) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "us-east-1",
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: "collection_house_records" + ambiente,
    IndexName: "email_index",
    ExpressionAttributeNames: {
      "#email": "email",
    },
    ExpressionAttributeValues: {
      ":email": email,
    },
    KeyConditionExpression: "#email = :email",
  };
  const response = await dynamodbClient.query(findParams).promise();

  //console.log("Item: " + JSON.stringify(response));
  return response.Items[0];
};

const updateJournal = async (ambiente, item) => {
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
    },
    ExpressionAttributeValues: {
      ":props": item["props"],
    },
    UpdateExpression: "set #props = :props",
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
};

async function backfill(ambiente) {
  console.log("Inicio backfill journals");

  let lastKey = null; //{"pk":"LOAN|f3dd53a6-cea9-4806-94ef-249a6d9299a1","sk":"HOUSE|vana_fraud|BUCKET|bucket_gt_8","type":"LOAN|HOUSE"};
  let count = 0;
  const { items: journals, lastEvaluatedKey } = await listJournal(
    ambiente,
    lastKey
  );
  console.log("lastEvaluatedKey:" + JSON.stringify(lastEvaluatedKey));
  console.log("Quantity journals:" + journals.length);

  await Promise.all(
    journals.map(async (item) => {
      if (!item.props.modified_by || item.props.house_id) {
        return;
      }

      count = count + 1;
      const user = await getUser(item.props.modified_by, ambiente);

      if (!user.props.house_id) {
        console.log(
          "User without house_id: " +
            item.props.modified_by +
            " - " +
            JSON.stringify(user)
        );
        return;
      }

      const obj = {
        pk: item.pk,
        sk: item.sk,
        props: {
          ...item.props,
          house_id: user.props.house_id,
        },
      };
      //console.log("obj: " + JSON.stringify(obj));
      //console.log("PK: " + item.pk);
      //console.log("Updated: " + item.updated_at);
      //console.log("Update assignment: " + JSON.stringify(obj));
      return updateJournal(ambiente, obj);
    })
  );
  console.log("End --- Quantity updated: " + count);
}

module.exports.backfill = backfill;


const addOneSecondToISODate = (dateString) => {
  return dateString.replace(
    /(\d{2}):(\d{2}):(\d{2})/,
    (match, hours, minutes, seconds) => {
      let newSeconds = parseInt(seconds, 10) + 1;

      // Manejar el caso en que los segundos superen 59
      if (newSeconds === 60) {
        newSeconds = 0;
      }

      return `${hours}:${minutes}:${String(newSeconds).padStart(2, "0")}`;
    }
  );
};
