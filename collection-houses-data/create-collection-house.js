const AWS = require('aws-sdk');

const createHouse = async (item) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1'
  });

  const putParams = {
    TableName: "collection_house_records",
    Item: item,
  };
  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.put(putParams).promise();;
  return response;
}

async function createHouseUseCase(house, houseName, country) {
  console.log("Start create house");
  const currentDateTime = new Date().toISOString();
  const houseItem = {
    "pk": `HOUSE|${house}`,
    "sk": `HOUSE|${house}`,
    "props": {
     "country": `${country}`,
     "created_at": `${currentDateTime}`,
     "id": `${house}`,
     "name": `${houseName}`,
     "status": "enabled",
     "updated_at": `${currentDateTime}`,
    },
    "shown_id": `${house}`,
    "type": "HOUSE"
   }
   
   await createHouse(houseItem);
}

module.exports.createHouseUseCase = createHouseUseCase;