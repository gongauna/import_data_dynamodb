const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
//import { createObjectCsvWriter } from "csv-writer";
const csvWriterDep = require("csv-writer");
const { v4: uuidv4 } = require("uuid");

const scanCostumerTickets = async (lastKey) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: "costumer_tickets_records",
      IndexName: "status_index",
      ExpressionAttributeNames: {
        "#status": "status",
        "#type": "type"

      },
      ExpressionAttributeValues: {
        ":status": "completed",
        ":type": "TICKET_REQUEST",
      },
      //KeyConditionExpression: "#status = :status",
      FilterExpression: "#status = :status AND #type = :type"
  };

  if (lastKey) {
    findParams["ExclusiveStartKey"] = lastKey;
  }
  
  const maxItems = 10000;
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

const getCheckpointById = async (loanRequestId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'costumer_tickets_records',
    IndexName: "sk_index",
    ExpressionAttributeNames: {
      "#sk": "sk"
    },
    ExpressionAttributeValues: {
      ":sk": `TICKET_REQUEST|${loanRequestId}`,
    },
    KeyConditionExpression: "#sk = :sk"
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

const getLoanRequestState = async (id) => {
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
      loan_request_id: id
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

const similarity = (string1, string2) => {
  let longer = string1.trim();
  let shorter = string2.trim();
  if (string1.length < string2.length) {
    longer = string2;
    shorter = string1;
  }

  const longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (
    (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
  );
};

const editDistance = (string1, string2) => {
  const string1LowerCase = string1.toLowerCase();
  const string2LowerCase = string2.toLowerCase();

  const costs = new Array();
  for (let i = 0; i <= string1LowerCase.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= string2LowerCase.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (string1LowerCase.charAt(i - 1) != string2LowerCase.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[string2LowerCase.length] = lastValue;
  }
  return costs[string2LowerCase.length];
};

const handleHeader = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const obj = items[0];
  const propertyNames = Object.keys(obj);

  return propertyNames.map((propertyName) => ({
    id: propertyName,
    title: propertyName,
  }));
}

const generateCSV = async (data, pathFile) => {
  const headerHandled = handleHeader(data);

  const csvWriter = csvWriterDep.createObjectCsvWriter({
    path: pathFile,
    encoding: "utf-8",
    header: headerHandled,
  });

  return await csvWriter.writeRecords(data);
}


async function compareReferences() {
  console.log("Start compare references");
  const {items: loanRequest} = await scanCostumerTickets();
  console.log("loanRequest:"+loanRequest.length);
  const loanRequestData =[];
  await Promise.all(loanRequest.map(async (item) => {
    if (item && item.props.value) {
      const [[checkpoint], user, loanRequestState] = await Promise.all([
        getCheckpointById(item.props.value),
        getUser(item.props.user_id),
        getLoanRequestState(item.props.value)
      ]);
      
      const refs = {
        ref1_contact_name: null,
        ref1_full_name: null, 
        ref2_contact_name: null, 
        ref2_full_name: null,
      }
      let index = 1;
      for(const key of Object.keys(user.referrer.contacts)) {
        refs[`ref${index}_contact_name`] = user.referrer.contacts[key].contact_name;
        refs[`ref${index}_full_name`] = user.referrer.contacts[key].full_name;
        refs[`ref${index}_similariy`] = similarity(user.referrer.contacts[key].full_name, user.referrer.contacts[key].contact_name);
        index = index +1;
      }

      const dataObject = {
        loan_request_id: item.props.value,
        user_id: item.props.user_id,
        created_at: loanRequestState.created_at,
        status_loan_request: loanRequestState.status,
        ref1_contact_name: refs.ref1_contact_name,
        ref1_full_name: refs.ref1_full_name, 
        ref1_similariy: refs.ref1_similariy, 
        checkpoint_match_ref1: checkpoint.props.answers.contactName1MatchesReference,
        ref2_contact_name: refs.ref2_contact_name, 
        ref2_full_name: refs.ref2_full_name,
        ref2_similariy: refs.ref2_similariy, 
        checkpoint_match_ref2: checkpoint.props.answers.contactName2MatchesReference,
      }
      loanRequestData.push(dataObject);
    }
  }));

  generateCSV(loanRequestData, './compare-references.csv');
  console.log("End compare");
}

module.exports.compareReferences = compareReferences;