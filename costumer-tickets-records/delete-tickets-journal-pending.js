const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const getTicketsPending = async () => {
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
      "#updated_at": "updated_at",
      "#sk": "sk"
    },
    ExpressionAttributeValues: {
      ":status": "pending",
      ":type": "TICKET_REQUEST",
      ":updated_at": "2023-10-11T13:00:38.081Z",
      ":sk": "TYPE|TICKET_REQUEST|QUEUE|review|COUNTRY"
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

const getTicketsJournal = async (ticket_id) => {
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
      "#sk": "sk",
      "#type": "type",
    },
    ExpressionAttributeValues: {
      ":sk": `TICKET_JOURNAL|TICKET_REQUEST|${ticket_id}`,
      ":type": "TICKET_JOURNAL",
    },
    KeyConditionExpression: "#sk = :sk",
    FilterExpression: "#type = :type"
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

const deleteCostumerTicket = async (pk) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.delete({
    TableName: 'costumer_tickets_records',
    Key: {
      pk: pk,
    },
  }).promise();
  return response;
}

const getUser = async (userId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'user',
    Key: {
      user_id: userId
    }
  };
  const { Item } = await dynamodbClient.get(params).promise();
  return Item;
}

const getLoanRequestData = async (loanRequestId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'loan_request',
    Key: {
      loan_request_id: loanRequestId
    }
  };
  const { Item } = await dynamodbClient.get(params).promise();
  return Item;
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
    TableName: "costumer_tickets_records",
    Key: {
      pk: `${ticketData["pk"]}`,
    },
    ExpressionAttributeNames: {
      "#props": "props",
    },
    ExpressionAttributeValues: {
      ":props": ticketData["props"],
    },
    UpdateExpression: "set #props = :props"
  };

  await dynamodbClient.update(updateParams).promise();//new UpdateCommand(updateParams);
  return true;
}


async function deleteJournalsPending() {
  console.log("Empezo delete journals");
  const items = await getTicketsPending();

  console.log("Cantidad tickets: "+items.length)

  const arrayJournalsToDelete = await Promise.all(items.map((item) => getTicketsJournal(item.props.value)));
  const journalsToDelete = [];
  arrayJournalsToDelete.map((item) => {
      item.forEach((i) => {
        journalsToDelete.push(i);
      });
  })
  console.log("Cantidad journalsToDelete: "+arrayJournalsToDelete.filter((item)=> item).length)
  let counter = 0;
  await Promise.all(journalsToDelete.map((item) => {
    if (item["pk"]) {
      counter = counter +1;
      deleteCostumerTicket(item["pk"]);
    }
  }));
  console.log("Borrados: "+counter)
  console.log("Fin")
}

async function deleteTickets() {
  console.log("Empezo delete tickets");
  const arrayTicketsToDelete = await getTicketsPending();

  console.log("Cantidad: "+arrayTicketsToDelete.length)
  await Promise.all(arrayTicketsToDelete.map((item) => {
    if (item["pk"]) {
      deleteCostumerTicket(item["pk"]);
    }
  }));
  console.log("Fin")
}

async function updateDataProps() {
  console.log("Empezo update tickets");
  const arrayTicketsToUpdate = await getTicketsPending();

  console.log("Cantidad: "+arrayTicketsToUpdate.length)
  const filtered = arrayTicketsToUpdate;
  //console.log("FILTERED"+JSON.stringify(filtered));
  await Promise.all(
    filtered.map(async (item) => {
        if (!item.props.amount) {
          const [user, loanRequest] = await Promise.all([
            getUser(item.props.user_id),
            getLoanRequestData(item.props.value)
          ]
          )
          const updated = {
            ...item
          };
          updated["props"]["first_name"] = user["personal"]["first_name"] ?? "";
          updated["props"]["last_name"] = user["personal"]["last_name"] ?? "";
          updated["props"]["amount"] = loanRequest["amount"] ?? "";
          //console.log("UPDATED"+JSON.stringify(updated))
          return updateTicket(updated);
        }
    })
  );
  console.log("Fin")
}

module.exports.deleteJournalsPending = deleteJournalsPending;
module.exports.deleteTickets = deleteTickets;
module.exports.updateDataProps = updateDataProps;