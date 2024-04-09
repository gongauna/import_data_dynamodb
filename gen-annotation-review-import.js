// Imports
const init_files = 600
const files = 662;
const { exec } = require('child_process');

const execute = async () => {
   for (let i=init_files; i<files; i++) {
      const command = `aws dynamodb batch-write-item --request-items file://files_to_import/issue_sold_corpo/issue_sold_corpo_${i}.json`;
      
      console.log("EXECUTING REVIEW ANNOTATION: "+ command);
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

