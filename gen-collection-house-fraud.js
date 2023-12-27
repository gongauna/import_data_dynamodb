// Imports
const country = "gt";
const houses = ["vana_fraud"];
const collectionHouseRecords = require('./collection-houses-data/gen-data-loans-fraud');

const execute = async () => {
   console.log("Inicio generacion de archivos fraudes");
   await collectionHouseRecords.generateCollectionHouseRecords(houses, country);
   console.log("Fin generacion de archivos fraudes");
}

execute();

