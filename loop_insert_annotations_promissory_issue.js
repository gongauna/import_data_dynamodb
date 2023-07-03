const { exec } = require('child_process');

// Replace `ls` with your desired terminal command
for (let i=1; i<50; i++) {
    const command = `aws dynamodb batch-write-item --request-items file://annotations-issue-promissory/files_to_import/issue_promissory_note_${i}.json`;
    
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