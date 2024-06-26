const readXlsxFile = require('read-excel-file/node')
const AWS = require('aws-sdk');
const fs = require('fs');
const { exec } = require('child_process');
const { v4: uuidv4 } = require("uuid");

const getUserLoan = async (loanId) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
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
  return Item?.["user_id"] ?? "to_be_defined";
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
  
  let foundItems = await dynamodbClient.query(findParams).promise();
  return foundItems.Items;
}

const updateLoanAssignments = async (assignment) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const currentDateTime = new Date().toISOString();
  const updateParams = {
    TableName: "collection_house_records",
    Key: {
      pk: `${assignment["pk"]}`,
      sk: `${assignment["sk"]}`,
    },
    ExpressionAttributeNames: {
      "#updated_at": "updated_at",
      "#status": "status",
      "#props": "props",
    },
    ExpressionAttributeValues: {
      ":updated_at": currentDateTime,
      ":status": "inactive",
      ":props": assignment["props"],
    },
    UpdateExpression: "set #updated_at = :updated_at, #status = :status, #props = :props"
  };

  if (!assignment["props"]) {
    console.log("Este no tiene props:"+JSON.stringify(assignment));
  }

  await dynamodbClient.update(updateParams).promise();//new UpdateCommand(updateParams);
  return true;
}

const updateLoanAssignmentsAssignendEndAt = async (assignment) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const currentDateTime = new Date().toISOString();
  const updateParams = {
    TableName: "collection_house_records",
    Key: {
      pk: `${assignment["pk"]}`,
      sk: `${assignment["sk"]}`,
    },
    ExpressionAttributeNames: {
      "#updated_at": "updated_at",
      "#props": "props",
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":updated_at": currentDateTime,
      ":props": assignment["props"],
      ":status": assignment["status"],
    },
    UpdateExpression: "set #updated_at = :updated_at, #props = :props, #status = :status"
  };

  if (!assignment["props"]) {
    console.log("Este no tiene props:"+JSON.stringify(assignment));
  }

  await dynamodbClient.update(updateParams).promise();//new UpdateCommand(updateParams);
  return true;
}

async function generateCollectionHouseRecords(houses, country) {
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
        type: (value) => {
          const arrayHouse = value.split('|');
          if (!arrayHouse) {
            return null;
          } else {
            return arrayHouse[1].toLowerCase()
          }
        }
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

  // PARAMETROS
  const bucketsToId = {
    "61-90": `bucket_${country}_6`,
    "31-60": `bucket_${country}_5`,
    "91-180": `bucket_${country}_1`,
    "91-210": `bucket_${country}_1`,
    "181-210": `bucket_${country}_2`,
    "211-360": `bucket_${country}_3`,
    "210-360": `bucket_${country}_3`,
    "361-510": `bucket_${country}_4`,
    "511-600": `bucket_${country}_7`,
    "601+": `bucket_${country}_8`,
  }

  const bucketsNameToId = {
    [`bucket_${country}_5`]: "31-60 días",
    [`bucket_${country}_6`]: "61-90 días",
    [`bucket_${country}_1`]: "91-180 días",
    [`bucket_${country}_2`]: "181-210 días",
    [`bucket_${country}_3`]: "211-360 días",
    [`bucket_${country}_4`]: "361-510 días",
    [`bucket_${country}_7`]: "511-600 días",
    [`bucket_${country}_8`]: "Más de 601 días",
  }

  const getLoanState = async (loanId) => {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
      region: 'us-east-1' // Replace with your desired AWS region
    });

    const dynamodbClient = new AWS.DynamoDB.DocumentClient();
    const foundItem = await dynamodbClient.get({
      TableName: 'loan_state',
      Key: {
        loan_id: loanId
      }
    }).promise();
    return foundItem.Item;
  }

  readXlsxFile('./data-casas-de-cobranza.xlsx', { schema: schemaLoans }).then(async (rows) => {
    houses.forEach(async (house) => {
    const annotationsArray = [];
    const arrayBucketsWithDuplicates = rows.rows.filter((item) => item.house_id === house);
    const arrayBuckets = arrayBucketsWithDuplicates.filter((obj, index, self) => {
      return (
        index ===
        self.findIndex((o) => o.loan_id === obj.loan_id)
      );
    });

    houses.forEach(async (house) => {
      exec(`rm ./files_to_import/loans/${house}/*.json`, (error, stdout, stderr) => {
        if (error) {
          return;
        }
        if (stderr) {
          return;
        }
      });
      exec(`rm ./files_to_import/annotations/${house}/*.json`, (error, stdout, stderr) => {
        if (error) {
          return;
        }
        if (stderr) {
          return;
        }
      });
    });

    const now = new Date();
    const loansActivesDifferentHouse = [];
    const loansActivesSameHouse = [];
    const jsonLoansArray = await Promise.all(arrayBuckets.map(async (row) => {
      if (!row.loan_id) {
        return;
      }

      const userId = await getUserLoan(row.loan_id);
      const assignedAt = new Date(row.assigned_at );
      const assignedEndAtString = row.assigned_end_at ? row.assigned_end_at : "2100-12-31T00:00:00.000Z";
      let status = "active";
      
      const loanState = await getLoanState(row.loan_id);
      if (!loanState) {
        console.log("NOT EXISTS"+row.loan_id);
        return;
      }
      if (loanState["settled"] > 0 && loanState["status"] === "released" ) {
        status = "partial";
      }
      const bucketIdHandled = bucketsToId[row.bucket_id];
      const bucketNameHandled = bucketsNameToId[bucketIdHandled];

      const loanAssignment = await getLoanAssignments(row.loan_id);
      if (loanAssignment) {
        const loanFulfilled = loanAssignment.filter((item) => item["status"] === "fulfilled");
        if (loanFulfilled && loanFulfilled.length > 0) {
          return null;
        }
        
        const ARRAY_STATUS_ACTIVE = ["active", "partial"];

        const loanActive = loanAssignment.filter((item) => ARRAY_STATUS_ACTIVE.includes(item["status"]) && item?.["sk"].split("|")[1] !== house);
        const loanActiveSameHouse = loanAssignment.filter((item) => (ARRAY_STATUS_ACTIVE.includes(item["status"]) || !item["status"]) && item?.["sk"].split("|")[1] === house && item?.["sk"].split("|")[3] === bucketIdHandled);

        if (loanActiveSameHouse && loanActiveSameHouse.length > 0) {
          loansActivesSameHouse.push(loanActiveSameHouse);
          const assignedEndAt = new Date(row.assigned_end_at).toISOString();

          //if (loanActiveSameHouse[0]["props"]["assigned_end_at"] !== assignedEndAt) {
            await Promise.all(
              loanActiveSameHouse.map((item) => {
                  // Cambiar assigned end at
                  const updated = {
                    ...item
                  };
                  updated["props"]["assigned_end_at"] = assignedEndAt;
                  updated["props"]["status"] = "inactive";
                  updated["status"] = "inactive";
                  return updateLoanAssignmentsAssignendEndAt(updated);
              })
            );
          //}
        } else {
          if (loanActive && loanActive.length > 0) {
            loansActivesDifferentHouse.push(loanActive);
            await Promise.all(
              loanActive.map((item) => {
                  // Desasignar loan actual
                  const updated = {
                    ...item
                  };
                  updated["props"]["status"] = "inactive";
                  updated["status"] = "inactive";
                  return 1;//updateLoanAssignments(updated);
              })
            );
          }
        }
      }

      const assignedEndAt =new Date(assignedEndAtString);

      //Annotation
      const createdAt = now.toISOString();
      annotationsArray.push({
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
                    "S": "Venta 1 No dar información de saldos comunicarse al No. 59221033 Firma de Abogados Novales Tel 2215-5345 "//`El crédito ${row.loan_id} ha sido asignado a la casa de cobranza ${house} al encontrarse en el bucket ${bucketNameHandled} el día ${assignedAt.toISOString()}. Sera gestionado por dicha casa de cobranza hasta ${assignedEndAt.toISOString()}.`
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
      });

      return {
          PutRequest: {
            Item: {
              pk: {S:`LOAN|${row.loan_id}`},
              sk: {S:`HOUSE|${row.house_id}|BUCKET|${bucketIdHandled}`},
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
                S: status
              }
            }
          }
      };
    }));

    console.log("Empresa: "+house+"; Cant Misma Casa:"+loansActivesSameHouse.length+"; Cant Diferente:"+loansActivesDifferentHouse.length);
    console.log("Cant Misma Casa:"+JSON.stringify(loansActivesSameHouse[0]));
    const cantRequest = 24;
    const filteredNotNull = jsonLoansArray.filter((item) => item);
    const cantFiles = Math.ceil(filteredNotNull.length / cantRequest);

    for (let r=0; r< cantFiles; r++) {
      const startRow = r*cantRequest;  
      const endRow = (r+1)*cantRequest;
      const filtered = filteredNotNull.filter((row) => filteredNotNull.indexOf(row) >= startRow && filteredNotNull.indexOf(row) < endRow);
      let collectionHousesRecordsJson = {
        collection_house_records: filtered
      };
      fs.writeFile(`./files_to_import/loans/${house}/collection_houses_loans_todas_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
          if (err) {
            console.log("Error"+err);
          }
      })
    }

    
    const cantFilesAnnotations = Math.ceil(annotationsArray.length / cantRequest);
    for (let r=0; r< cantFilesAnnotations; r++) {
      const startRow = r*cantRequest;  
      const endRow = (r+1)*cantRequest;
      const filtered = annotationsArray.filter((row) => annotationsArray.indexOf(row) >= startRow && annotationsArray.indexOf(row) < endRow);
      let collectionAnnotationJson = {
        collection_annotation: filtered
      };
      fs.writeFile(`./files_to_import/annotations/${house}/collection_houses_loans_annotations_${r}.json`,JSON.stringify(collectionAnnotationJson),"utf8", function (err) {
          if (err) {
            console.log("Error"+err);
          }
          //console.log(`Collection houses annotations ${r} JSON file saved`);
      })
    }
    })
  })
}

module.exports.generateCollectionHouseRecords = generateCollectionHouseRecords;