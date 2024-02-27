const AWS = require('aws-sdk');

const environmentSuffix = "";
const table = `disbursals${environmentSuffix}`;

const services = ["gt-trans"]//, "do-trans1"];
const services_source_table_map = {
  "gt-trans": `gt_trans_disbursals${environmentSuffix}`,
  "do-trans": `do_trans_disbursals${environmentSuffix}`,
}

const services_last_keys_map = {
  "gt-trans": {},
  "do-trans": {},
}

const firstTime = true;

const listDisbursals = async (service, lastKey) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: table,
      ExpressionAttributeNames: {
        "#service": "service",
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":service": service,
        ":status": "released"
      },
      FilterExpression: "#service = :service AND attribute_not_exists(account) AND #status = :status",
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
      /*for (let i = 0; i < foundItems.Items.length; i++) {
        items.push(foundItems.Items[i]);
      }*/
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

const getSourceData = async (tableSource, identifier) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: tableSource,
      IndexName: "identifier_index",
      ExpressionAttributeNames: {
        "#identifier": "identifier",
      },
      ExpressionAttributeValues: {
        ":identifier": identifier
      },
      KeyConditionExpression: "#identifier = :identifier"
  };
  
  let foundItems = await dynamodbClient.query(findParams).promise();
  return foundItems.Items;
}

const updateDisbursal = async (id, account) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const updateParams = {
    TableName: table,
    Key: {
      id: id
    },
    ExpressionAttributeNames: {
      "#account": "account",
    },
    ExpressionAttributeValues: {
      ":account": account,
    },
    UpdateExpression: "set #account = :account"
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
}

async function updateDisbursalProcess() {
  let start = process.hrtime()
  await Promise.all(services.map(async (service) => {
    let lastKey = firstTime ? null : services_last_keys_map[service];
    console.log("Service: " + service);

    const disbursals = await listDisbursals(service, lastKey);
    if (disbursals.lastEvaluatedKey) {
      lastKey = disbursals.lastEvaluatedKey;
    }
    const disbUpdate = disbursals.items;
  
    console.log(`Disbursals_${service}:${disbUpdate.length}`);
    //console.log(`Disbursals_${service}:${JSON.stringify(disbUpdate)}`);
    console.log(`Disbursals_${service}:${JSON.stringify(disbursals.lastEvaluatedKey)}`);
  
    const tableSource = services_source_table_map[service];
    await Promise.all(
      disbUpdate.map(async (item) => {
        if (item.account) {
          return null;
        }
        const [sourceData] = await getSourceData(tableSource, item.loan_request_id);
  
        if (sourceData && sourceData.account) {
          return updateDisbursal(item.id, sourceData.account);
        }
      })
    )
  }));

  console.log(`Function backfill took ${process.hrtime(start)[0]} seconds to execute.`);
  return null;
}

module.exports.updateDisbursalProcess = updateDisbursalProcess;

