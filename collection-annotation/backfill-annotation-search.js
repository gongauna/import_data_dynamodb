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

  const maxItems = 1;
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

  let lastKey = null; //{ id: "ef1548a0-010b-4002-8f58-3636cf14e209" };
  let count = 0;
  let counterUpdate = 0;
  while (count < 1) {
    //lastKey) {
    console.log("COUNT: " + count);
    const { items: annotation, lastEvaluatedKey } = await listAnnotations(
      ambiente,
      lastKey
    );
    console.log("lastEvaluatedKey:" + JSON.stringify(lastEvaluatedKey));
    lastKey = lastEvaluatedKey;
    console.log("Cantidad actualizar:" + annotation.length);

    console.log("ITEM id::: " + annotation[0].id);
    console.log("ITEM::: " + annotation[0].search);
    await Promise.all(
      annotation.map((item) => {
        counterUpdate = counterUpdate + 1;
        const obj = {
          id: item.id,
          search: `SOURCE|vana|USER|${item.user_id}`,
        };
        return 1;//updateAnnotations(ambiente, obj);
      })
    );
    console.log("Cantidad actualizados:" + counterUpdate);
    count = count + 1;
  }
  console.log("FIN Cantidad actualizados:" + counterUpdate);

  console.log("Fin backfill annotation search");
}

module.exports.backfillAnnotationsSearchField = backfillAnnotationsSearchField;