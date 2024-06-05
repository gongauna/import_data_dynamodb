const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const getTicketsPending = async (fecha) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'costumer_tickets_records_qa',
    IndexName: 'status_index',
    ExpressionAttributeNames: {
      "#status": "status",
      "#type": "type",
      "#updated_at": "updated_at",
      "#sk": "sk"
    },
    ExpressionAttributeValues: {
      ":status": "pending",
      ":type": "TICKET_REQUEST",
      ":updated_at": fecha,
      ":sk": "TYPE|TICKET_REQUEST|QUEUE|"
    },
    KeyConditionExpression: "#status = :status AND #updated_at < :updated_at",
    FilterExpression: "#type = :type AND begins_with(#sk, :sk)"
  };

  let result = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
    if ((foundItems) && (foundItems.Items)) {
      result = result.concat(foundItems.Items);
    }
    if (typeof foundItems.LastEvaluatedKey != "undefined") {
      moreItems = true;
      findParams["ExclusiveStartKey"] = foundItems.LastEvaluatedKey;
    }
  }
  return result;
}

const updateTicket = async (ticketData) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const currentDateTime = new Date().toISOString();
  const updateParams = {
    TableName: "costumer_tickets_records_qa",
    Key: {
      pk: `${ticketData["pk"]}`,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": ticketData["status"],
    },
    UpdateExpression: "set #status = :status"
  };

  await dynamodbClient.update(updateParams).promise();//new UpdateCommand(updateParams);
  return true;
}

async function updateTicketsCompleted(fecha) {
  console.log("Empezo update to completed antes de:"+fecha);
  const arrayTicketsToDeleteAll = await getTicketsPending(fecha);
  
  
  console.log("Cantidad arrayTicketsToDeleteAll: "+arrayTicketsToDeleteAll.length)
  const arrayTicketsToDelete = []
  await Promise.all(arrayTicketsToDeleteAll.map(async (item) => {
    arrayTicketsToDelete.push(item);
  }));
  console.log("Cantidad filtradas: "+arrayTicketsToDelete.length)

  //Update to completed tickets
  await Promise.all(arrayTicketsToDelete.map((item) => {
    if (item["pk"]) {
      
      const updated = {
        pk: item["pk"],
        status: "completed"
      };
      return updateTicket(updated);
    }

  }));
  console.log("Tickets update to completed");
  console.log("Fin");
}


module.exports.updateTicketsCompleted = updateTicketsCompleted;