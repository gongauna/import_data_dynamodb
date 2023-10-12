const { exec } = require('child_process');

// Replace `ls` with your desired terminal command
for (let i=0; i<6; i++) {
    const command = `aws dynamodb batch-write-item --request-items file://files_to_import/varias/users_prod_${i}.json`;
    
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

for (let i=0; i<6; i++) {
  const command = `aws dynamodb batch-write-item --request-items file://files_to_import/varias/users_roles_dev_${i}.json`;
  
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

const command = `aws dynamodb batch-write-item --request-items file://files_to_import/varias/roles_dev.json`;
console.log("EXECUTING: "+ command);
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing the command: ${error}`);
    return;
  }

  // Command executed successfully
  console.log(`Command output: ${stdout}`);
});

for (let i=0; i<2; i++) {
  const command2 = `aws dynamodb batch-write-item --request-items file://files_to_import/varias/permissions_dev_${i}.json`;
  console.log("EXECUTING: "+ command2);
  exec(command2, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing the command: ${error}`);
      return;
    }

    // Command executed successfully
    console.log(`Command output: ${stdout}`);
  });
}