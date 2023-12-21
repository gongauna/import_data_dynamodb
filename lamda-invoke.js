const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');

const schemaLoans = {
  'user_id': {
    prop: 'user_id',
    type: String
  },
  'loan_request_id': {
    prop: 'loan_request_id',
    type: String
  }
}

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: 'us-east-1' 
});
const lambda = new AWS.Lambda({ region: 'us-east-1' }); // Replace 'your-region' with your AWS region

async function generateAnnotation(
) {
  readXlsxFile('./rd-duplicados.xlsx', { schema: schemaLoans, sheet: 'Hoja1'}).then(async (rows) => {
    const items = rows.rows.slice(1,rows.rows.length);
  
    const promises = items.map((item) => {
      return new Promise((resolve, reject) => {
        const lambdaParams = {
          FunctionName: 'collection-annotation-create',
          Payload: JSON.stringify({
            "data": {
              "userId": item.user_id,
              "user_id": item.user_id,
              "type": "review",
              "loan_request_id": item.loan_request_id,
              "data": {
                "review": true,
                "text": "Desembolso doble el 16/12/2023"
              }
            }
          })
        };
        
        lambda.invoke(lambdaParams, (err, data) => {
          if (err) {
            console.error('Error invoking Lambda function:', err);
            reject(err); // Reject the promise on error
          } else {
            console.log('Lambda function executed successfully:', data);
            resolve(data); // Resolve the promise on success
          }
        });
      });
    });
  
    console.log("PROMISESS"+JSON.stringify(promises));
    // Wait for all lambda.invoke promises to settle
    return await Promise.allSettled(promises);
  })
  .then((results) => {
    // Process the results here if needed
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Lambda ${index} succeeded:`, result.value);
      } else {
        console.error(`Lambda ${index} failed:`, result.reason);
      }
    });
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

console.log("Empezo");
generateAnnotation();
console.log("Fin");
