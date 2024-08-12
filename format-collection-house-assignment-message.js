const collectionHouseRecords = require('./collection-houses-data/format-assignment-message');

const execute = async () => {
   console.log("Inicio formateo de mensaje");
   await collectionHouseRecords.formatAssignmentMessage();
   console.log("Fin formateo de mensaje");
}

execute();

