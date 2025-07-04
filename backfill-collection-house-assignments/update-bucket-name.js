const AWS = require("aws-sdk");
const items = require("./update-records-bucket-name.json");

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

const getBucket = async (bucketId, ambiente) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "us-east-1",
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: "collection_house_records" + ambiente,
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":pk": "BUCKET|" + bucketId,
      ":sk": "BUCKET|",
    },
    KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
  };

  const foundItems = await dynamodbClient.query(findParams).promise();
  return foundItems.Items[0];
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
  console.log("Inicio backfill bucket_name");

  let count = 0;
  await Promise.all(
    items.map(async (item) => {
      count = count + 1;
      const [record, bucket] = await Promise.all([
        getAssignment(item._source.pk, item._source.sk, ambiente),
        getBucket(item._source.bucket_id, ambiente),
      ]);

      if (!bucket) {
        console.log(
          `Bucket not found for ID: ${item._source.props.bucket_id}, skipping item with PK: ${item._source.pk}`
        );
        return;
      }

      const obj = {
        pk: record.pk,
        sk: record.sk,
        props: {
          ...record.props,
          bucket_name: bucket.props.name,
        },
      };

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
