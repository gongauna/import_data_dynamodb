const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: 'us-east-1' 
});
const lambda = new AWS.Lambda({ region: 'us-east-1' }); // Replace 'your-region' with your AWS region

const getTicketsCreated = async (fecha) => {
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
      "#sk": "sk"
    },
    ExpressionAttributeValues: {
      ":status": "created",
      ":type": "TICKET_REQUEST",
      ":sk": "TYPE|TICKET_REQUEST|QUEUE|"
    },
    KeyConditionExpression: "#status = :status",
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

const getIntentPending = async (requestId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'document_analysis_records',
    IndexName: 'sk_index',
    ExpressionAttributeNames: {
      "#sk": "sk",
      "#status_decision_engine": "status_decision_engine"
    },
    ExpressionAttributeValues: {
      ":sk": `LOAN_REQUEST|${requestId}`,
      ":status_decision_engine": "pending"
    },
    KeyConditionExpression: "#sk = :sk",
    FilterExpression: "#status_decision_engine = :status_decision_engine"
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

async function updateTicketsCreated() {
  console.log("Empezo created1:");
  const arrayTicketsCreated = await getTicketsCreated();
  
  console.log("Cantidad arrayTicketsCreated: "+arrayTicketsCreated.length);

  //Update to pending tickets
  const promises = arrayTicketsCreated.map(async (item) => {
    const loanRequestId = item["pk"].split("|")[1];
    //console.log("Id:  "+loanRequestId)
    const [intent] = await getIntentPending(loanRequestId);

    //console.log("intent"+JSON.stringify(intent));
    if (intent) { 
      console.log("TIENE INTENT");
      /*return new Promise((resolve, reject) => {
        const lambdaParams = {
          FunctionName: 'internal-tickets-automated-process',
          Payload: JSON.stringify({
            "data": {
              "intent_id": intent["pk"],
              "loan_request_id": loanRequestId,
              "user_id": item["props"]["user_id"],
              "country":item["props"]["country"].toLowerCase(),
              "status": intent["status"]
            }
          })
        };
        
        //console.log("lambdaParams"+JSON.stringify(lambdaParams))
        lambda.invoke(lambdaParams, (err, data) => {
          if (err) {
            console.log('Error invoking Lambda function:', err);
            reject(err); // Reject the promise on error
          } else {
            //console.log('Lambda function executed successfully:', data);
            resolve(data); // Resolve the promise on success
          }
        });
      });*/
    } else {
      console.log("updating "+item["pk"])
       const updated = {
        pk: item["pk"],
        status: "pending"
      };
      //return updateTicket(updated);
    }
    
  });

  const response = await Promise.allSettled(promises);  
  //console.log("RESPONSE"+JSON.stringify(response));
  console.log("Tickets created end");
}


module.exports.updateTicketsCreated = updateTicketsCreated;
