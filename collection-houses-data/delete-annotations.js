const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const getAnnotationToDelete = async (user_id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'collection_annotation',
    IndexName: 'user_type_index',
    ExpressionAttributeNames: {
      "#type": "type",
      "#user_id": "user_id",
      "#created_at": "created_at"
    },
    ExpressionAttributeValues: {
      ":user_id": user_id,
      ":type": "collection_house_assignment",
      ":created_at": "2023-09-17T05:00:15.024Z"
    },
    KeyConditionExpression: "#type = :type AND #user_id = :user_id",
    FilterExpression: "#created_at >= :created_at"
  };

  let result = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
    if ((foundItems) && (foundItems.Items)) {
      result = result.concat(foundItems.Items);
    }
    if (typeof foundItems.LastEvaluatedKey != "undefined") {
      moreItems = true;
      findParams["ExclusiveStartKey"] = foundItems.LastEvaluatedKey;
    }
  }
  return result;
}

const getLoansTypeIndex = async () => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'collection_house_records',
    IndexName: 'type_index',
    ExpressionAttributeNames: {
      "#type": "type",
      "#sk": "sk",
      "#created_at": "created_at"
    },
    ExpressionAttributeValues: {
      ":sk": `HOUSE|recsa`,
      ":type": "LOAN|HOUSE",
      ":created_at": "2023-09-24T15:00:15.024Z"
    },
    KeyConditionExpression: "#type = :type AND begins_with(#sk, :sk)",
    FilterExpression: "#created_at >= :created_at"
  };

  let result = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
    if ((foundItems) && (foundItems.Items)) {
      result = result.concat(foundItems.Items);
    }
    if (typeof foundItems.LastEvaluatedKey != "undefined") {
      moreItems = true;
      findParams["ExclusiveStartKey"] = foundItems.LastEvaluatedKey;
    }
  }
  return result;
}

const deleteAnnotation = async (idParam) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const response = await dynamodbClient.delete({
    TableName: 'collection_annotation',
    Key: {
      id: idParam,
    },
  }).promise();
  return response;
}


async function deleteAnnotations() {
  console.log("Empezo444");
  const items = await getLoansTypeIndex();

  console.log("Cantidad: "+items.length)
  const arrayAnnotationsToDelete = await Promise.all(items.map((item) => getAnnotationToDelete(item.props.user_id)));
  const annotationsToDelete = [];
  arrayAnnotationsToDelete 
  arrayAnnotationsToDelete.map((item) => {
      item.forEach((i) => {
          annotationsToDelete.push(i);
      });
  })
  console.log("Cantidad Annotations: "+annotationsToDelete.length)

  /*await Promise.all(annotationsToDelete.map((item) => {
    deleteAnnotation(item["id"]);
  }));*/
  console.log("Fin")
}

async function createAnnotation() {
  console.log("Empezo22");
  const items = await getLoansTypeIndex();

  console.log("Cantidad: "+items.length)
  const annotationsToCreate = items.map((row) => {
    if (row) {
      const createdAt = "2023-09-11T10:30:33.400Z"
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
                    "S": `El crédito ${row.props.loan_id} ha sido asignado a la casa de cobranza ${row.props.house_id} al encontrarse en el bucket ${row.props.bucket_name} el día ${row.props.assigned_at}. Sera gestionado por dicha casa de cobranza hasta ${row.props.assigned_end_at}.`
                  }
                }
              },
              "loan_id": {
                "S": row.props.loan_id
              },
              "order_by": {
                "S": createdAt
              },
              "type": {
                "S": "collection_house_assignment"
              },
              "user_id": {
                "S": row.props.user_id
              }
            }
          }
      };
    } else {
      return null
    }
  })

  const filteredNotNull = annotationsToCreate.filter((i) => i);
  console.log("Cantidad Annotations: "+filteredNotNull.length)

  const cantRequest = 24;
  const cantFiles = Math.ceil(filteredNotNull.length / cantRequest);

  for (let r=0; r< cantFiles; r++) {
    const startRow = r*cantRequest;  
    const endRow = (r+1)*cantRequest;
    const filtered = filteredNotNull.filter((row) => filteredNotNull.indexOf(row) >= startRow && filteredNotNull.indexOf(row) < endRow);
    let collectionHousesRecordsJson = {
      collection_annotation: filtered
    };
    fs.writeFile(`./files_to_import/varias/fix_annotations_admicarter_${r}.json`,JSON.stringify(collectionHousesRecordsJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log(`Collection houses loans ${r} JSON file saved`);
    })
  }
  console.log("Fin")
}


module.exports.deleteAnnotations = deleteAnnotations;
module.exports.createAnnotation = createAnnotation;