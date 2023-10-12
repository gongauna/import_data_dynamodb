const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');

const getLoanAssignments = async (loanId, skParam) => {
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
        ":pk": `LOAN|`+loanId,
        ":sk": skParam
      },
      KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
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
      "#updated_at": "updated_at",
      "#props": "props",
    },
    ExpressionAttributeValues: {
      ":updated_at": currentDateTime,
      ":props": assignment["props"],
    },
    UpdateExpression: "set #updated_at = :updated_at, #props = :props"
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
  'bucket_id': {
    prop: 'bucket_id',
    type: String
  },
  'loan_id': {
    prop: 'loan_id',
    type: String
  },
  'house_id': {
    prop: 'house_id',
    type: (value) => {
      const arrayHouse = value.split('|');
      if (!arrayHouse) {
        return null;
      } else {
        return arrayHouse[1].toLowerCase()
      }
    }
  },
  'assigned_at': {
    prop: 'assigned_at',
    type: Date
  },
  'assigned_end_at': {
    prop: 'assigned_end_at',
    type: Date
  }
}

async function updateCollectionHouseRecordsAssignedEndAt() {
  readXlsxFile('./data-update-assigned.xlsx', { schema: schemaUpdate, sheet: 'Hoja1'}).then(async (rows) => {
    console.log("Inicio assigned_end_at")
    const filas = rows.rows;

    console.log("Cant"+filas.length)
    const rowMap = new Map();
    filas.map((i) => rowMap.set(i.loan_id, i)
    )

    const assignments = await Promise.all(filas.map((item) => {
      console.log("item"+JSON.stringify(item))
      return getLoanAssignments(item.loan_id, `HOUSE|${item.house_id}|BUCKET|bucket_gt_1`)
    }));

    //console.log("assignments"+JSON.stringify(assignments))
    const updatedAt = "2023-10-05T12:00:00.395Z"
    
    let counter = 0;
    await Promise.all(
      assignments.map(async (item) => {
          const itemFirst = item[0];
          if (itemFirst) {
            const row = rowMap.get(itemFirst.shown_id)
            const updated = {
              ...itemFirst
            };
            updated["props"]["assigned_end_at"] = new Date(row.assigned_end_at).toISOString();
            updated["updated_at"] = updatedAt;
            counter = counter +1;
            //console.log("updatedupdated"+JSON.stringify(updated))
            return updateLoanAssignments(updated);
          }
      })
    );
    console.log("Fin. Actualizados assigned_end_at:"+counter)
  });
}

module.exports.updateCollectionHouseRecordsAssignedEndAt = updateCollectionHouseRecordsAssignedEndAt;

