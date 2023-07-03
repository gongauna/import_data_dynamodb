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

function generatePromissoryNoteAnnotations() {
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

readXlsxFile('./listado-loan.xlsx', { schema: schemaLoans, sheet: 'Hoja1'}).then(async (rows) => {
  const arrayBuckets = rows.rows;
  
  const now = new Date();
  const jsonLoansArray = await Promise.all(arrayBuckets.map(async (row) => {
      return {
          PutRequest: {
            Item: {
              "id": {
                "S": uuidv4()
              },
              "created_at": {
                "S": "2023-06-30T00:00:00.395Z"
              },
              "data": {
                "M": {
                  "text": {
                    "S": `Issue_Pagare_DO. Si el cliente se contacta indicando diferencias con el monto en app versus su pagaré, por favor, ponte en contacto con tu supervisor para más detalles antes de darle información al cliente. Loan_request_id: ${row.loan_request_id} , Loan_id: ${row.loan_id}`
                  }
                }
              },
              "loan_id": {
                "S": row.loan_id
              },
              "loan_id": {
                "S": row.loan_request_id
              },
              "order_by": {
                "S": "2023-06-30T00:00:00.395Z"
              },
              "type": {
                "S": "collection_house_assignment"
              },
              "user_id": {
                "S": row.user_id
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
    fs.writeFile(`./files_to_import/issue_promissory_note_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log(`Collection houses loans ${r} JSON file saved`);
    })
  }
});
}

module.exports.promissoryNoteAnnotations = generatePromissoryNoteAnnotations;