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

const getLoanAssignments = async (loanId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
      TableName: "collection_house_records",
      ExpressionAttributeNames: {
        "#pk": "pk"
      },
      ExpressionAttributeValues: {
        ":pk": `LOAN|`+loanId
      },
      KeyConditionExpression: "#pk = :pk",
  };
  

  //const command = new QueryCommand(findParams);
  let foundItems = await dynamodbClient.query(findParams).promise();
  
  return foundItems.Items;
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

/*const bucketsToId = {
  "91-180": "bucket_gt_1",
  "181-210": "bucket_gt_2",
  "211-360": "bucket_gt_3",
  "361+": "bucket_gt_4",
}

const bucketsNameToId = {
  "bucket_gt_1": "Bucket 91-180 días",
  "bucket_gt_2": "Bucket 181-210 días",
  "bucket_gt_3": "Bucket 211-360 días",
  "bucket_gt_4": "Bucket más de 361 días"
}*/

const country = "gt"

const bucketsToId = {
  "91-180": `bucket_${country}_1`,
  "181-210": `bucket_${country}_2`,
  "211-360": `bucket_${country}_3`,
  "361+": `bucket_${country}_4`,
}

const bucketsNameToId = {
  [`bucket_${country}_1`]: "91-180 días",
  [`bucket_${country}_2`]: "181-210 días",
  [`bucket_${country}_3`]: "211-360 días",
  [`bucket_${country}_4`]: "Más de 361 días"
}

const houses = [
  "lexcom","admicarter","claudiaaguilar",
  "avantte1","tecserfin","xdmasters",
  "admicarter","vlrservicios","recaguagt","recsa","contacto502",
  "aserta","corpocredit","sederegua"
]

readXlsxFile('./data-casas-de-cobranza.xlsx', { schema: schemaLoans, sheet: 'Hoja1'}).then(async (rows) => {
  houses.forEach(async (house) => {
    const arrayBuckets = rows.rows.filter((item) => item.house_id === `HOUSE|${house}`);
  
    const now = new Date();
    const loansActivesSameHouse = [];
    const jsonLoansArray = await Promise.all(arrayBuckets.map(async (row) => {
        const loanAssignment = await getLoanAssignments(row.loan_id);
        if (loanAssignment) {
          const loanFulfilled = loanAssignment.filter((item) => item["status"] === "fulfilled");
          if (loanFulfilled && loanFulfilled.length > 0) {
            return null;
          }
      
          const loanActive = loanAssignment.filter((item) => item["status"] === "active" && item?.["sk"].split("|")[1] !== house);
          const loanActiveSameHouse = loanAssignment.filter((item) => item["status"] === "active" && item?.["sk"].split("|")[1] === house);
          if (loanActiveSameHouse && loanActiveSameHouse.length > 0) {
            loansActivesSameHouse.push(loanActive);
            return null;
          }
        }

        const userId = await getUserLoan(row.loan_id);
        const assignedAt = new Date(row.assigned_at);
        const assignedEndAtString = row.assigned_end_at ? row.assigned_end_at : "2100-12-31T00:00:00.000Z";
        const assignedEndAt = new Date(assignedEndAtString);

        const bucketIdHandled = bucketsToId[row.bucket_id];
        const bucketNameHandled = bucketsNameToId[bucketIdHandled];
        const createdAt = "2023-08-04T12:00:00.395Z"
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
                      "S": `El crédito ${row.loan_id} ha sido asignado a la casa de cobranza ${house} al encontrarse en el bucket ${bucketNameHandled} el día ${assignedAt.toISOString()}. Sera gestionado por dicha casa de cobranza hasta ${assignedEndAt.toISOString()}.`
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
                  "S": userId
                }
              }
            }
        };
    }));

    const cantRequest = 24;
    const filteredNotNull = jsonLoansArray.filter((item) => item);
    const cantFiles = Math.ceil(filteredNotNull.length / cantRequest);

    for (let r=0; r< cantFiles; r++) {
      const startRow = r*cantRequest;  
      const endRow = (r+1)*cantRequest;
      const filtered = filteredNotNull.filter((row) => filteredNotNull.indexOf(row) >= startRow && filteredNotNull.indexOf(row) < endRow);
      let collectionHousesRecordsJson = {
        collection_annotation: filtered
      };
      fs.writeFile(`./files_to_import/annotations/${house}/collection_houses_loans_annotations_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
          if (err) {
            console.log("Error"+err);
          }
          console.log(`Collection houses loans ${r} JSON file saved`);
      })
    }
  });
  
});
}

module.exports.generateCollectionHouseRecordsAnnotations = generateCollectionHouseRecordsAnnotations;

