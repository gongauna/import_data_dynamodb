const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');


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

function generateCollectionHouseRecords() {
const schemaLoans = {
  'loan_id': {
    prop: 'loan_id',
    type: String
  },
  'loan_request_id': {
    prop: 'loan_request_id',
    type: String
  },
  'status': {
    prop: 'status',
    type: String
  },
  'user_id': {
    prop: 'user_id',
    type: String
  }
}

const bucketsToId = {
  "91-180": "bucket_gt_1",
  "181-210": "bucket_gt_2"
}

readXlsxFile('./listado-loan.xlsx', { schema: schemaLoans, sheet: 'Hoja1'}).then(async (rows) => {
  const arrayBuckets = rows.rows;
  
  const jsonLoansArray = await Promise.all(arrayBuckets.map(async (row) => {
    return {
        PutRequest: {
          Item: {
            pk: {S:`LOAN|${row.loan_id}`},
            sk: {S:`HOUSE|vana|BUCKET|bucket_gt_1`},
            props: {
              M: {
                assigned_at: {
                  S: "2023-07-03T00:00:00.000Z"
                },
                assigned_end_at: {
                  S: "2050-07-03T00:00:00.000Z"
                },
                loan_id: {
                  S: row.loan_id
                },
                user_id: {
                  S: row.user_id
                },
                bucket_name: {
                  S: `Bucket 91-180`
                },
                bucket_id: {
                  S: "bucket_gt_1"
                }            
              },
            },
            created_at: {
              S: "2023-07-03T00:00:00.000Z"
            },
            updated_at: {
              S: "2023-07-03T00:00:00.000Z"
            },
            shown_id: {
              S: row.loan_id
            },
            type: {
              S: "LOAN|HOUSE"
            },
            status:{
              S: "active"
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
      collection_house_records: filtered
    };
    fs.writeFile(`./files_to_import/collection_houses_loans_RD_ISSUE_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log(`Collection houses loans ${r} JSON file saved`);
    })
  }
});
}

module.exports.generateCollectionHouseRecords = generateCollectionHouseRecords;

