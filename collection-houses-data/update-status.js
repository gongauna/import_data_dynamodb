const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');

const getLoanAssignments = async (pkParam, skParam) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: "collection_house_records",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk": "sk"
      },
      ExpressionAttributeValues: {
        ":pk": pkParam,
        ":sk": skParam
      },
      KeyConditionExpression: "#pk = :pk AND #sk = :sk",
  };
  
  let foundItems = await dynamodbClient.query(findParams).promise();
  return foundItems.Items;
}

const updateLoanAssignments = async (assignment) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const currentDateTime = new Date().toISOString();
  const updateParams = {
    TableName: "collection_house_records",
    Key: {
      pk: `${assignment["pk"]}`,
      sk: `${assignment["sk"]}`,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": assignment["status"],
    },
    UpdateExpression: "set #status = :status"
  };

  await dynamodbClient.update(updateParams).promise();//new UpdateCommand(updateParams);
  return true;
}

const getLoanState = async (loanId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const foundItem = await dynamodbClient.get({
    TableName: 'loan_state',
    Key: {
      loan_id: loanId
    }
  }).promise();

  return foundItem.Item;
}

const schemaUpdate = {
  'pk': {
    prop: 'pk',
    type: String
  },
  'sk': {
    prop: 'sk',
    type: String
  },
  'status': {
    prop: 'status',
    type: String
  },
  'loan_id': {
    prop: 'loan_id',
    type: String
  },
  'loan_status': {
    prop: 'loan_status',
    type: String
  },
  'settled': {
    prop: 'settled',
    type: String
  }
}

async function updateStatusCollectionHouse() {
  readXlsxFile('./ArreglarStatus.xlsx', { schema: schemaUpdate }).then(async (rows) => {
    console.log("Inicio status")
    const filas = rows.rows;

    console.log("Cant"+filas.length)
    const rowMap = new Map();
    await filas.map((i) => rowMap.set(i.loan_id, i))

    const assignments1 = await Promise.all(filas.map((item) => {
      return getLoanAssignments(item.pk, item.sk)
    }));

    console.log("assignments1"+assignments1.length);

    let counter = 0;
    await Promise.all(
      assignments1.map(async (item) => {
          const itemFirst = item[0];
          if (itemFirst) {
            const row = rowMap.get(itemFirst.shown_id)
            //console.log("rowrow"+JSON.stringify(row))
            const updated = {
              ...itemFirst
            };
            let statusHandle = "active";
            if (Number(row["settled"]) > 0 && row["loan_status"] === "released" ) {
              statusHandle = "partial";
            }

            if (row.loan_status === "fulfilled") {
              statusHandle = "fulfilled";
            }
            updated["status"] = statusHandle;
            counter = counter +1;
            return updateLoanAssignments(updated);
          }
      })
    );
    console.log("Fin. Actualizados status:"+counter)
  });
}

module.exports.updateStatusCollectionHouse = updateStatusCollectionHouse;

