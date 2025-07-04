const AWS = require("aws-sdk");
const items = require("./update-to-fulfilled.json");

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

const getLoanState = async (loanId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "us-east-1", // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const foundItem = await dynamodbClient
    .get({
      TableName: "loan_state",
      Key: {
        loan_id: loanId,
      },
    })
    .promise();
  return foundItem.Item;
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
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":props": item["props"],
      ":status": item["status"],
    },
    UpdateExpression: "set #props = :props, #status = :status",
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
};
async function backfill(ambiente) {
  console.log("Inicio update partial");

  let count = 0;
  await Promise.all(
    items.map(async (item) => {
      const [record, loanState] = await Promise.all([
        getAssignment(item._source.pk, item._source.sk, ambiente),
        getLoanState(item._source.pk.split("|")[1]),
      ]); 

      if (loanState.status === "released") {
        console.log(
          `Skipping assignment: ${item._source.pk} - ${item._source.sk} because loan is released`
        );
        return;
      }

      count = count + 1;
      const obj = {
        pk: record.pk,
        sk: record.sk,
        props: {
          ...record.props,
          assignment_status: "fulfilled",
        },
        status: "fulfilled",
      };

      console.log(`Updating assignment: ${obj.pk} - ${obj.sk}`);

      return updateAssignment(ambiente, obj);
    })
  );
  console.log("End partiallll--- Quantity updated: " + count);
}

module.exports.backfill = backfill;
