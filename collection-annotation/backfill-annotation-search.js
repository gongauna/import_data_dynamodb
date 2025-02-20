const AWS = require("aws-sdk");

const listAnnotations = async (ambiente, lastKey) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "us-east-1",
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: "collection_annotation" + ambiente,
    FilterExpression: "attribute_not_exists(#search) OR #search = :nullValue",
    ExpressionAttributeNames: {
      "#search": "search",
    },
    ExpressionAttributeValues: {
      ":nullValue": null,
    },
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
};

const updateAnnotations = async (ambiente, item) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "us-east-1",
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const updateParams = {
    TableName: "collection_annotation" + ambiente,
    Key: {
      id: `${item["id"]}`,
    },
    ExpressionAttributeNames: {
      "#search": "search",
    },
    ExpressionAttributeValues: {
      ":search": item["search"],
    },
    UpdateExpression: "set #search = :search",
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
};

async function backfillAnnotationsSearchField(ambiente) {
  console.log("Inicio backfill annotation search field");

  const lastKey = null; //{"id":"c9215d06-e05b-47a6-91d5-eb58beb36ccf"};
  const { items: annotation, lastEvaluatedKey } = await listAnnotations(
    ambiente,
    lastKey
  );
  console.log("lastEvaluatedKey:" + JSON.stringify(lastEvaluatedKey));
  console.log("Cantidad actualizar:" + annotation.length);

  let counterUpdate = 0;
  await Promise.all(
    annotation.map((item) => {
      //console.log("ITEM::: " + item.id);
      counterUpdate = counterUpdate + 1;
      const obj = {
        id: item.id,
        search: `SOURCE|vana|USER|${item.user_id}`,
      };
      return updateAnnotations(ambiente, obj);
    })
  );
  console.log("Cantidad actualizados:" + counterUpdate);

  console.log("Fin backfill annotation search");
}

module.exports.backfillAnnotationsSearchField = backfillAnnotationsSearchField;
