const fs = require('fs');
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: 'us-east-1' 
});

const lambda = new AWS.Lambda({ region: 'us-east-1' }); // Reemplaza con la región correcta

// Función para invocar la Lambda con el payload
function invokeLambda(lambdaParams) {
  return new Promise((resolve, reject) => {
    lambda.invoke(lambdaParams, (err, data) => {
      if (err) {
        console.error('Error invoking Lambda function:', err);
        reject(err); // Reject the promise on error
      } else {
        // console.log('Lambda function executed successfully:', data);
        resolve(data); // Resolve the promise on success
      }
    });
  });
}

// Función para procesar el JSON y enviar cada elemento a Lambda
async function processJsonData() {
  try {
    // Leer el archivo JSON de entrada
    const data = JSON.parse(fs.readFileSync('invoke-lambda-input-2.json')); // Asumiendo que input.json está en el mismo directorio

    // Recorrer cada objeto en el array de JSON
    for (const record of data) {
      const payload = record.msg; // Aquí puedes personalizar el payload si lo necesitas
      payload.detail = { data: record.msg.detail };
      // Definir los parámetros de la Lambda
      const lambdaParams = {
        FunctionName: 'user-consume-events', // Nombre de la Lambda
        Payload: JSON.stringify(payload) // Convertir el payload a una cadena JSON
      };

      // Invocar la Lambda y esperar a que se complete
      await invokeLambda(lambdaParams);
      console.log('Lambda invoked with payload:', payload);
    }

    console.log('Todos los registros fueron procesados');
  } catch (error) {
    console.error('Error procesando el JSON:', error);
  }
}

// Iniciar el procesamiento
console.log("Empezando a procesar JSON...");
processJsonData();
console.log("Fin del proceso.");
