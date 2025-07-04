const AWS = require("aws-sdk");
const items = require("./update-partial.json");

const listAssignments = async (ambiente, lastKey) => {
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
      "#sk": "sk",
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":type": "LOAN|HOUSE",
      ":sk": "HOUSE|activagroup|",
      ":status": "fulfilled",
    },
    KeyConditionExpression: "#type = :type AND begins_with(#sk, :sk)",
    FilterExpression: "#status = :status",
  };

  if (lastKey) {
    findParams["ExclusiveStartKey"] = lastKey;
  }

  const maxItems = 70000;
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

const getAssignment = async (pk, sk, ambiente) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "us-east-1",
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: "collection_house_records" + ambiente,
    Key: {
      pk: pk,
      sk: sk,
    },
  };
  const { Item } = await dynamodbClient.get(params).promise();

  return Item;
};

const updateAssignment = async (ambiente, item) => {
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
  console.log("Inicio backfill assignments DE PARTIAL A FULFILLED");

  let lastKey = null; //{"pk":"LOAN|f3dd53a6-cea9-4806-94ef-249a6d9299a1","sk":"HOUSE|vana_fraud|BUCKET|bucket_gt_8","type":"LOAN|HOUSE"};
  let count = 0;
  /*const { items: assignments, lastEvaluatedKey } = await listAssignments(
    ambiente,
    lastKey
  );*/
  const assignments = items.registros;
  //console.log("Last evaluated key: " + JSON.stringify(lastEvaluatedKey));
  /*const assignments = await Promise.all(items.map(async (item) => {
    return await getAssignment(item._source.pk, item._source.sk, ambiente);
  }));*/

  console.log("Quantity assignments:" + assignments.length);

  await Promise.all(
    assignments.map(async (item) => {
      count = count + 1;
      const assignmentRecord = await getAssignment(
        item._source.pk,
        item._source.sk,
        ambiente
      );

      if (!assignmentRecord) {
        console.log(
          "Assignment not found: " + item._source.pk + " - " + item._source.sk
        );
        return 0;
      }

      const obj = {
        pk: assignmentRecord.pk,
        sk: assignmentRecord.sk,
        props: {
          ...assignmentRecord.props,
          assignment_status: "fulfilled",
        },
      };
      //console.log("Updating assignment: " + JSON.stringify(obj));

      //console.log("PK: " + item.pk);
      //console.log("Updated: " + item.updated_at);
      //console.log("Update assignment: " + JSON.stringify(obj));
      return updateAssignment(ambiente, obj);
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
