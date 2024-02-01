const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');

const getAssignmentsByStatusHouse = async (status, house) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });


  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: "collection_house_records",
      IndexName: "status_index",
      ExpressionAttributeNames: {
        "#status": "status",
        "#sk": "sk"
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":sk": `HOUSE|${house}`
      },
      KeyConditionExpression: "#status = :status AND begins_with(#sk, :sk)",
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
      ":updated_at": "2024-01-31T20:00:00.395Z",
      ":props": assignment["props"],
    },
    UpdateExpression: "set #updated_at = :updated_at, #props = :props"
  };

  await dynamodbClient.update(updateParams).promise();//new UpdateCommand(updateParams);
  return true;
}


async function updateDoAssignedEndAt() {
  console.log("Start update assigned end at DO loans");
  const housesDO = [
    //"avanttedo",
    //"chamiisa",
    //"coreval",
    //"optima",
    //"recaguado",
    "vertia",
  ]

  housesDO.map(async(house) => {
    const [assignmentsActive, assignmentsPartial] = await Promise.all([
      getAssignmentsByStatusHouse("active", house),
      getAssignmentsByStatusHouse("partial", house)
    ]); 

    const assignments = assignmentsActive.concat(assignmentsPartial);

    console.log(`Assignments to ${house}: ${assignments.length}`);

    let counter = 0;
    const updatedAt = "2024-01-31T20:00:00.395Z"
    const assignedEndAt = "2024-02-02T12:00:00.395Z"
    await Promise.all(
      assignments.map(async (item) => {
          const updated = {
            ...item
          };
          updated["props"]["assigned_end_at"] = assignedEndAt;
          updated["updated_at"] = updatedAt;
          counter = counter +1;
          //console.log("updatedupdated"+JSON.stringify(updated))
          return updateLoanAssignments(updated);
      })
    );

    console.log(`Assignments UPDATED to ${house}: ${counter}`);
  })

  console.log("End update assigned end at DO loans");
}

module.exports.updateDoAssignedEndAt = updateDoAssignedEndAt;

