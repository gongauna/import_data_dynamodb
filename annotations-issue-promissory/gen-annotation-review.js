const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

function generateAnnotationReview() {
const schemaLoans = {
    'loan_id': {
      prop: 'loan_id',
      type: String
    },
    'user_id': {
      prop: 'user_id',
      type: String
    }
}

readXlsxFile('./gen-review-excel.xlsx', { schema: schemaLoans}).then(async (rows) => {
  console.log("GENERANDO REVIEW");
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
                "S": "2024-03-26T12:00:00.395Z"
              },
              "data": {
                "M": {
                  "review": {
                    "BOOL": true
                  },
                  "text": {
                    "S": `El credito id ${row.loan_id} forma parte de la cartera vendida a Corpocredit. El cliente no puede solicitar un nuevo credito en Vana.`
                  }
                }
              },
              "loan_id": {
                "S": row.loan_id
              },
              "order_by": {
                "S": "2024-03-26T12:00:00.395Z"
              },
              "type": {
                "S": "review"
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
    fs.writeFile(`./files_to_import/issue_sold_corpo_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log(`Collection houses loans ${r} JSON file saved`);
    })
  }
});
}

module.exports.generateAnnotationReview = generateAnnotationReview;