const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const getTicket = async (id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'costumer_tickets_records',
    Key: {
      pk: `TICKET_REQUEST|${id}`
    }
  };
  
  const { Item } = await dynamodbClient.get(params).promise();
  return Item;
}

const getUser = async (id) => {
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
      user_id: id
    }
  };
  
  const { Item } = await dynamodbClient.get(params).promise();
  return Item;
}

const getLoanRequest = async (id) => {
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
      loan_request_id: id
    }
  };
  
  const { Item } = await dynamodbClient.get(params).promise();
  return Item;
}

const getLoanRequestByStatus = async (status) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'loan_request_state',
    IndexName: "status_index",
    ExpressionAttributeNames: {
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":status": status
    },
    KeyConditionExpression: "#status = :status"
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

const getTicketsByStatus = async (status) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'costumer_tickets_records',
    IndexName: "status_index",
    ExpressionAttributeNames: {
      "#status": "status",
      "#type": "type"
    },
    ExpressionAttributeValues: {
      ":status": status,
      ":type": "TICKET_REQUEST"
    },
    KeyConditionExpression: "#status = :status",
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

const createTicket = async (item, createtAt) => {
  const currentDateTime = createtAt;
  const dbItem = {
    pk: `TICKET_REQUEST|${item["ticket_id"]}`,
    sk: `TYPE|TICKET_REQUEST|QUEUE|review|COUNTRY|${item["props"]["country"]}`,
    updated_at: currentDateTime,
    status: item["status"],
    type: "TICKET_REQUEST",
    props: item["props"],
  };

  const putParams = {
    TableName: "costumer_tickets_records",
    Item: dbItem,
  };
  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.put(putParams).promise();;
  return response;
}

async function createTicketLost() {
  console.log("Empezo creating");

  const [loanRequestDocumentSent, ticketPending, ticketAssigned] = await Promise.all([
    getLoanRequestByStatus("document_sent"),
    getTicketsByStatus("pending"),
    getTicketsByStatus("assigned"),
  ]) 

  console.log("Cantidad en doc sent: " +loanRequestDocumentSent.length);
  console.log("Cantidad pending: " +ticketPending.length);
  console.log("Cantidad assigned: " +ticketAssigned.length);
  const ticketToUpdate = [];
  const loanRequestWithoutTicket = await Promise.all(loanRequestDocumentSent.map(async (item) => {
    //console.log("id"+JSON.stringify(item["loan_request_id"]))
    const ticket = await getTicket(item["loan_request_id"]);


    if (!ticket) {
      return item;
    }

    //console.log("tickeeee"+JSON.stringify(ticket))
    if (ticket?.["status"] === "completed") {
      ticketToUpdate.push(ticket)
    }
    return null;
  }));

  const toCreate = loanRequestWithoutTicket.filter((item) => item);


  console.log("Cantidad a crear: " +toCreate.length);
  console.log("Cantidad a actualizar: " +ticketToUpdate.length);

  const created = await Promise.all(toCreate.map( async (item) => {
    const user = await getUser(item["user_id"]);
    const loanRequest = await getLoanRequest(item["loan_request_id"]);
    

    const ticketItem = {
      ticket_id: item["loan_request_id"],
      type: "request",
      props: {
        user_id: item["user_id"],
        type: "request",
        value: item["loan_request_id"],
        queue: "review",
        snooze_until: null,
        country: user["personal"]["country"],
        first_name: user["personal"]["first_name"] ?? "",
        last_name: user["personal"]["last_name"] ?? "",
        amount: loanRequest?.["amount"] ?? 0,
      },
      status: "pending",
    }

    console.log("ITEM"+JSON.stringify(ticketItem));
    return createTicket(ticketItem, item["updated_at"]);
  }));

  console.log("created"+JSON.stringify(created));


  console.log("FIN creating")
}

module.exports.createTicketLost = createTicketLost;