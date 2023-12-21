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
    TableName: 'costumer_tickets_records',
    IndexName: 'status_index',
    ExpressionAttributeNames: {
      "#status": "status",
      "#type": "type",
      "#updated_at": "updated_at",
      "#sk": "sk"
    },
    ExpressionAttributeValues: {
      ":status": "assigned",
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

const getTicket = async (ticketId) => {
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
      pk: "TICKET_REQUEST|"+ticketId
    }
  };
  const { Item } = await dynamodbClient.get(params).promise();
  return Item;
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

const getLoanRequestStateData = async (loanRequestId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'loan_request_state',
    Key: {
      loan_request_id: loanRequestId
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
    IndexName: 'status_index',
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": status,
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

const createTicket = async (item) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const currentDateTime = new Date().toISOString();
  const typeHandled = "TICKET_REQUEST";
  const dbItem = {
    pk: `${typeHandled}|${item["ticket_id"]}`,
    sk: `TYPE|${typeHandled}|QUEUE|review|COUNTRY|${item["props"]["country"]}`,
    updated_at: item["updated_at"],
    status: item["status"],
    type: `${typeHandled}`,
    props: item["props"],
  };

  const putParams = {
    TableName: "costumer_tickets_records",
    ConditionExpression: `attribute_not_exists(pk)`,
    Item: dbItem,
  };

  await dynamodbClient.put(putParams).promise();
  return true;
}

async function deleteTickets(fecha) {
  console.log("Empezo delete tickets COMPLETO");
  const arrayTicketsToDeleteAll = await getTicketsPending(fecha);
  
  
  console.log("Cantidad arrayTicketsToDeleteAll: "+arrayTicketsToDeleteAll.length)
  const arrayTicketsToDelete = []
  await Promise.all(arrayTicketsToDeleteAll.map(async (item) => {
    const loanRequestItem = await getLoanRequestStateData(item.props.value)

    if (loanRequestItem["status"] !== "document_sent" /*&& loanRequestItem["status"] === "reviewing" /*&& loanRequestItem["status"] !== "document_rejected"*/) {
      //console.log(loanRequestItem["loan_request_id"]+"--------------"+loanRequestItem["status"]);
      arrayTicketsToDelete.push(item);
    }
  }));
  console.log("Cantidad filtradas: "+arrayTicketsToDelete.length)
  console.log("Estos: "+JSON.stringify(arrayTicketsToDelete));

  //Delete journals
  const arrayJournalsToDelete = await Promise.all(arrayTicketsToDelete.map((item) => getTicketsJournal(item.props.value)));
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
      //deleteCostumerTicket(item["pk"]);
    }
  }));
  console.log("Journals Borrados: "+counter);

  //Delete tickets
  //console.log("ESTOS: "+JSON.stringify(arrayTicketsToDelete));
  await Promise.all(arrayTicketsToDelete.map((item) => {
    if (item["pk"]) {
      deleteCostumerTicket(item["pk"]);
    }
  }));
  console.log("Tickets Borrados");
  console.log("Fin");
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

async function createTicketsPending(state) {
  console.log("Empezo create tickets");
  const loanRequestByStatusAll = await getLoanRequestByStatus(state);

  console.log("loanRequestByStatusAll: "+loanRequestByStatusAll.length)
  const loanRequestByStatus = [];
  await Promise.all(
    loanRequestByStatusAll.map(async (item) => {
      const ticket = await getTicket(item.loan_request_id);

      if (!ticket) {
          loanRequestByStatus.push(item);
      }
    })
  )
  console.log("loanRequestByStatusToCreate: "+loanRequestByStatus.length)

  const filtered = loanRequestByStatus;
  await Promise.all(
    filtered.map(async (item) => {
      const [user, loanRequest] = await Promise.all([
        getUser(item.user_id),
        getLoanRequestData(item.loan_request_id)
      ]);

      if (user && loanRequest) {
        const ticketItem = {
          ticket_id: item.loan_request_id,
          type: "request",
          props: {
            user_id: item.user_id,
            type: "request",
            value: item.loan_request_id,
            queue: "review",
            snooze_until: null,
            country: user["personal"]["country"],
            first_name: user["personal"]["first_name"] ?? "",
            last_name: user["personal"]["last_name"] ?? "",
            amount: loanRequest?.["amount"] ?? 0,
            obs: "created_manually"
          },
          status: "pending",
          updated_at: item["updated_at"]
        };
        //console.log("TICKET A CREAR" + JSON.stringify(ticketItem));
        //return createTicket(ticketItem);
      } else {
        console.log("NO ENCONTRADO" + item.loan_request_id);
      }
    })
  );
  console.log("Fin")
}

module.exports.deleteTickets = deleteTickets;
module.exports.updateDataProps = updateDataProps;
module.exports.createTicketsPending = createTicketsPending;