// Imports
const house = "avantte"
const init_files = 0
const files = 109;
const { exec } = require('child_process');

const execute = async () => {
   for (let i=init_files; i<files; i++) {
      const command = `aws dynamodb batch-write-item --request-items file://files_to_import/loans/${house}/collection_houses_loans_todas_${i}.json`;
      
      console.log("EXECUTING ASSIGN RECORD: "+ command);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing the command: ${error}`);
          return;
        }
      
        // Command executed successfully
        console.log(`Command output: ${stdout}`);
      });
  }

  for (let i=init_files; i<files; i++) {
      const command = `aws dynamodb batch-write-item --request-items file://files_to_import/annotations/${house}/collection_houses_loans_annotations_${i}.json`;
      
      console.log("EXECUTING ANNOTATION RECORD: "+ command);
      exec(command, (error, stdout, stderr) => {
      if (error) {
         console.error(`Error executing the command: ${error}`);
         return;
      }
      
      // Command executed successfully
      console.log(`Command output: ${stdout}`);
      });
   }

}

execute();

