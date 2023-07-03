const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");


const getUserLoan = async (loanId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'loan',
    Key: {
      id: loanId
    }
  };
  const { Item } = await dynamodbClient.get({
    TableName: 'loan',
    Key: {
      'loan_id': loanId
    },
  }).promise();
  return Item["user_id"] ?? "to_be_defined";
}

function generateCollectionHouseRecordsAnnotations() {
const schemaLoans = {
    'bucket_id': {
      prop: 'bucket_id',
      type: String
    },
    'loan_id': {
      prop: 'loan_id',
      type: String
    },
    'house_id': {
      prop: 'house_id',
      type: String
    },
    'assigned_at': {
      prop: 'assigned_at',
      type: Date
    },
    'assigned_end_at': {
      prop: 'assigned_end_at',
      type: Date
    },
}

const bucketsToId = {
  "91-180": "bucket_gt_1",
  "181-210": "bucket_gt_2"
}

readXlsxFile('./data-collection-houses_avantte.xlsx', { schema: schemaLoans, sheet: 'loans'}).then(async (rows) => {
  const arrayBuckets = rows.rows;
  
  const now = new Date();
  const jsonLoansArray = await Promise.all(arrayBuckets.map(async (row) => {
      const userId = await getUserLoan(row.loan_id);
      const assignedAt = new Date(row.assigned_at);
      const assignedEndAt = new Date(row.assigned_end_at);
      const bucketIdHandled = bucketsToId[row.bucket_id];
      return {
          PutRequest: {
            Item: {
              "id": {
                "S": uuidv4()
              },
              "created_at": {
                "S": "2023-06-28T00:00:00.395Z"
              },
              "data": {
                "M": {
                  "text": {
                    "S": `El crédito ${row.loan_id} ha sido asignado a la casa de cobranza avantte al encontrarse en el bucket ${row.bucket_id} el día ${assignedAt.toISOString()}. Sera gestionado por dicha casa de cobranza hasta ${assignedEndAt.toISOString()}.`
                  }
                }
              },
              "loan_id": {
                "S": row.loan_id
              },
              "order_by": {
                "S": "2023-06-28T00:00:00.395Z"
              },
              "type": {
                "S": "collection_house_assignment"
              },
              "user_id": {
                "S": userId
              }
            }
          }
      };
  }));

  const cantRequest = 24;
  const cantFiles = Math.ceil(jsonLoansArray.length / cantRequest);

  for (let r=0; r< cantFiles; r++) {
    const startRow = r*cantRequest;  
    const endRow = (r+1)*cantRequest;
    const filtered = jsonLoansArray.filter((row) => jsonLoansArray.indexOf(row) >= startRow && jsonLoansArray.indexOf(row) < endRow);
    let collectionHousesRecordsJson = {
      collection_annotation: filtered
    };
    fs.writeFile(`./files_to_import/collection_houses_loans_annotations_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log(`Collection houses loans ${r} JSON file saved`);
    })
  }
});
}

module.exports.generateCollectionHouseRecordsAnnotations = generateCollectionHouseRecordsAnnotations;

