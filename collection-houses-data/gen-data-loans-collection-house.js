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

readXlsxFile('./data-collection-houses_xdmasters.xlsx', { schema: schemaLoans, sheet: 'Hoja1'}).then(async (rows) => {
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
            pk: {S:`LOAN|${row.loan_id}`},
            sk: {S:`${row.house_id}|BUCKET|${bucketIdHandled}`},
            props: {
              M: {
                assigned_at: {
                  S: assignedAt.toISOString()
                },
                assigned_end_at: {
                  S: assignedEndAt.toISOString()
                },
                loan_id: {
                  S: row.loan_id
                },
                user_id: {
                  S: userId
                },
                bucket_name: {
                  S: `Bucket ${row.bucket_id}`
                },
                bucket_id: {
                  S: bucketIdHandled
                }            
              },
            },
            created_at: {
              S: now.toISOString()
            },
            updated_at: {
              S: now.toISOString()
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
    fs.writeFile(`./files_to_import/collection_houses_loans_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log(`Collection houses loans ${r} JSON file saved`);
    })
  }
});
}

module.exports.generateCollectionHouseRecords = generateCollectionHouseRecords;

