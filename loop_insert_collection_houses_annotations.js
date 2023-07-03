const { exec } = require('child_process');

// Replace `ls` with your desired terminal command
for (let i=151; i<276; i++) {
    const command = `aws dynamodb batch-write-item --request-items file://files_to_import/annotations/avantte/collection_houses_loans_annotations_${i}.json`;
    
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