// Imports
const { exec } = require('child_process');
const generateAnnotationExcel = require('./collection-houses-data/gen-annotation-excel.js');

//generateAnnotationExcel.generateAnnotationExcel();

for (let i=0; i<13; i++) {
    const command = `aws dynamodb batch-write-item --request-items file://./files_to_import/annotations/__faltantes/collection_houses_loans_annotations_${i}.json`;
    
    console.log("EXECUTING: "+ command);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing the command: ${error}`);
        return;
      }
    
      // Command executed successfully
      console.log(`Command output: ${stdout}`);
    });
  }