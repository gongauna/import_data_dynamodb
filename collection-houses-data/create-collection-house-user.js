const AWS = require('aws-sdk');

const createUser = async (item) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const putParams = {
    TableName: "collection_house_records",
    Item: item,
  };
  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.put(putParams).promise();;
  return response;
}

async function createUserUseCase(house, numUser, email, firstName, lastName) {
  console.log("Start create user");
  const currentDateTime = new Date().toISOString();
  const userItem = {
    "pk": `USER|${house}_${numUser}`,
    "sk": `HOUSE|${house}`,
    "email": `${email}`,
    "props": {
     "created_at": `${currentDateTime}`,
     "email": `${email}`,
     "first_name": `${firstName}`,
     "house_id": `${house}`,
     "id": `${house}_${numUser}`,
     "last_name": `${lastName}`,
     "status": "enabled",
     "updated_at": `${currentDateTime}`
    },
    "shown_id": `${house}_${numUser}`,
    "type": "USER|HOUSE"
   }
   
   await createUser(userItem);
}

module.exports.createUserUseCase = createUserUseCase;