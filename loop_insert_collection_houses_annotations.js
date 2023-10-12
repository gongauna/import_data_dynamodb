const { exec } = require('child_process');

const house = "optima";

for (let i=0; i<11; i++) {
    const command = `aws dynamodb batch-write-item --request-items file://files_to_import/annotations/${house}/collection_houses_loans_annotations_${i}.json`;
    
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