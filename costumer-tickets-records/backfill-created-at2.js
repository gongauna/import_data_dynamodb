const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const getTicketsRequest = async () => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'costumer_tickets_records',
    IndexName: 'status_index',
    ExpressionAttributeNames: {
      "#status": "status",
      "#type": "type",
      "#sk": "sk",
      "#created_at": "created_at"
    },
    ExpressionAttributeValues: {
      ":status": "completed",
      ":type": "TICKET_REQUEST",
      ":sk": "TYPE|TICKET_REQUEST|QUEUE|"
    },
    KeyConditionExpression: "#status = :status",
    FilterExpression: "#type = :type AND begins_with(#sk, :sk) AND attribute_not_exists(#created_at)"
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

const getTicketsJournal = async (ticketPk) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'costumer_tickets_records',
    IndexName: 'sk_index',
    ExpressionAttributeNames: {
      "#sk": "sk"
    },
    ExpressionAttributeValues: {
      ":sk": `TICKET_JOURNAL|${ticketPk}`
    },
    KeyConditionExpression: "#sk = :sk",
  };

  let result = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
    if ((foundItems) && (foundItems.Items)) {
      result = result.concat(foundItems.Items);
    }
    if (typeof foundItems.LastEvaluatedKey != "undefined" || result.length < 200) {
      moreItems = true;
      findParams["ExclusiveStartKey"] = foundItems.LastEvaluatedKey;
    }
  }
  return result;
}

const updateTicketRequest = async (pk, createdAt) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const updateParams = {
    TableName: 'costumer_tickets_records',
    Key: {
      pk: `${pk}`,
    },
    ExpressionAttributeNames: {
      "#created_at": "created_at",
    },
    ExpressionAttributeValues: {
      ":created_at": createdAt,
    },
    UpdateExpression: "set #created_at = :created_at"
  };

  await dynamodbClient.update(updateParams).promise();
  return true;
}

async function backfillTicketRequestCreatedAt() {
  console.log("Empezo backfill");

  const tickets = await getTicketsRequest();
  console.log("TIckets cant"+tickets.length);

  const arrayTest = [];
  /*await Promise.all(tickets.map(async (ticket) => {
    if (!ticket.created_at) {
      const journals = await getTicketsJournal(ticket.pk);
  
      const [journalCreated] = journals.filter((item) => item.props.status === "created");
      //console.log("journal"+JSON.stringify(journals));
      const createdAt = journalCreated?.["props"]?.["created_at"];
      if (createdAt) {
        //console.log("ticket.pk"+ticket.pk);
       // console.log("journalCreated"+journalCreated["props"]["created_at"]);
        //arrayTest.push(ticket.pk);
        await updateTicketRequest(ticket.pk, createdAt)
      }
    }
  }))*/

  console.log("arrayTest cant"+arrayTest.length);
  console.log("Fin")
}

module.exports.backfillTicketRequestCreatedAt = backfillTicketRequestCreatedAt;