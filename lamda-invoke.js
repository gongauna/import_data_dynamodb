const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');

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

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: 'us-east-1' 
});
const lambda = new AWS.Lambda({ region: 'us-east-1' }); // Replace 'your-region' with your AWS region

async function generateAnnotation(
) {
  readXlsxFile('./loanvanamas.xlsx', { schema: schemaLoans}).then(async (rows) => {
    const items = rows.rows;//.slice(0,1);
    
    console.log("ITEMS"+items.length);
    const promises = items.map((item) => {
      return new Promise((resolve, reject) => {
        const lambdaParams = {
          FunctionName: 'collection-annotation-create',
          Payload: JSON.stringify({
            "data": {
              "userId": item.user_id,
              "user_id": item.user_id,
              "type": "review",
              "loan_id": item.loan_id,
              "data": {
                "review": false,
                "text": `Error asignacion casa de cobranza bucket VanaMas.`
              }
            }
          })
        };
        
        lambda.invoke(lambdaParams, (err, data) => {
          if (err) {
            console.error('Error invoking Lambda function:', err);
            reject(err); // Reject the promise on error
          } else {
            //console.log('Lambda function executed successfully:', data);
            resolve(data); // Resolve the promise on success
          }
        });
      });
    });
  
    //console.log("PROMISESS"+JSON.stringify(promises));
    // Wait for all lambda.invoke promises to settle
    return await Promise.allSettled(promises);
  })
  .then((results) => {
    // Process the results here if needed
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        //console.log(`Lambda ${index} succeeded:`, result.value);
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
