// Imports
const country = "gt";
const houses = ["corpocredit"
    //"lexcom","admicarter","claudiaaguilar",
    //"avantte","tecserfin","xdmasters",
    //"vlrservicios","recaguagt","recsa","contacto502",
    //"aserta","corpocredit1","sederegua",
    //"serviciosestrategicos","activagroup",
    //"coreval","vertia1","optima1","recaguado1", "avanttedo", "aserta_sold_accounts"
];
const collectionHouseRecords = require('./collection-houses-data/gen-data-loans-collection-house');

const execute = async () => {
   console.log("Inicio generacion de archivos");
   await collectionHouseRecords.generateCollectionHouseRecords(houses, country);
   console.log("Fin generacion de archivos");
}

execute();

