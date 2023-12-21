const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");


function generateAnnotationExcel() {
const schemaLoans = {
    'annotation': {
      prop: 'annotation',
      type: String
    },
    'loan_id': {
      prop: 'loan_id',
      type: String
    },
    'user_id': {
      prop: 'user_id',
      type: String
    }
}

readXlsxFile('./gen_annotation.xlsx', { schema: schemaLoans, sheet: 'template'}).then(async (rows) => {
  const arrayAnnotation = rows.rows;

  const createdAt = "2023-11-06T13:21:14.438Z"
  const jsonAnnArray = await Promise.all(arrayAnnotation.map(async (row) => {
      return {
          PutRequest: {
            Item: {
              "id": {
                "S": uuidv4()
              },
              "created_at": {
                "S": createdAt
              },
              "data": {
                "M": {
                  "text": {
                    "S": row.annotation
                  }
                }
              },
              "loan_id": {
                "S": row.loan_id
              },
              "order_by": {
                "S": createdAt
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
  const filteredNotNull = jsonAnnArray.filter((item) => item);
  const cantFiles = Math.ceil(filteredNotNull.length / cantRequest);

  for (let r=0; r< cantFiles; r++) {
    const startRow = r*cantRequest;  
    const endRow = (r+1)*cantRequest;
    const filtered = filteredNotNull.filter((row) => filteredNotNull.indexOf(row) >= startRow && filteredNotNull.indexOf(row) < endRow);
    let collectionHousesRecordsJson = {
      collection_annotation: filtered
    };
    fs.writeFile(`./files_to_import/annotations/__faltantes/collection_houses_loans_annotations_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log(`Collection houses loans ${r} JSON file saved`);
    })
  }
  
  
});
}

module.exports.generateAnnotationExcel = generateAnnotationExcel;

