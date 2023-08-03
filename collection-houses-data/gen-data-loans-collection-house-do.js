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
  //console.log("ITEMMMM"+JSON.stringify(Item));
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
    }
}

const bucketsToId = {
  "91-180": "bucket_do_1",
  "181-210": "bucket_do_2",
  "211-360": "bucket_do_3",
  "361+": "bucket_do_4",
}

const bucketsNameToId = {
  "bucket_do_1": "Bucket 91-180 días",
  "bucket_do_2": "Bucket 181-210 días",
  "bucket_do_3": "Bucket 211-360 días",
  "bucket_do_4": "Bucket más de 361 días"
}

const houses = [
  "optima","recaguado","coreval"
]

readXlsxFile('./data-collection-houses_todas_do.xlsx', { schema: schemaLoans, sheet: 'Hoja1'}).then(async (rows) => {
  houses.forEach(async (house) => {

  const arrayBuckets = rows.rows.filter((item) => item.house_id === `HOUSE|${house}`);
  
  const now = new Date();
  const jsonLoansArray = await Promise.all(arrayBuckets.map(async (row) => {
    const userId = await getUserLoan(row.loan_id);
    const assignedAt = new Date(row.assigned_at );
    const assignedEndAtString = row.assigned_end_at ? row.assigned_end_at : "2100-12-31T00:00:00.000Z";
    
    const assignedEndAt =new Date(assignedEndAtString);
    const bucketIdHandled = bucketsToId[row.bucket_id];
    const bucketNameHandled = bucketsNameToId[bucketIdHandled];
    console.log
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
                  S: bucketNameHandled
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
    fs.writeFile(`./files_to_import/TODAS/${house}/collection_houses_loans_todas_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log(`Collection houses loans ${r} JSON file saved`);
    })
  }
  })
});
}

module.exports.generateCollectionHouseRecords = generateCollectionHouseRecords;

