const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const arrayLoanRequestToUpdate = [
  {
    "id": "-NfWfB3ee8MgbuaB2_xh",
    "email": "julian.sandoval@vana.gt"
  },
  {
    "id": "-Nfq2eMxAEWfTRGq9gWc",
    "email": "ingrid.castillo@vana.gt"
  },
  {
    "id": "-Ng0ycMUqSRaoajRDFsx",
    "email": "maria.jo@vana.gt"
  },
  {
    "id": "-Ng14fZg8h_e4RdTder8",
    "email": "pablo.valencia@vana.gt"
  },
  {
    "id": "-Ng4eBcv2XTKlVanXzzC",
    "email": "julian.sandoval@vana.gt"
  },
  {
    "id": "-Ng27PbjF11f3KYfEM3W",
    "email": "julian.sandoval@vana.gt"
  },
  {
    "id": "-Ng-ibAQm0DpTShLhfVy",
    "email": "marielos.garcia@vana.gt"
  },
  {
    "id": "-NgKCb9RJMtce7bXFT-t",
    "email": "marielos.garcia@vana.gt"
  },
  {
    "id": "-NgKSyJwHtIw2swyL4TG",
    "email": "sebastian.marroquin@vana.gt"
  },
  {
    "id": "-NgGbJI5TkEI6HoA4bPj",
    "email": "maria.jo@vana.gt"
  },
  {
    "id": "-NgKun9vzqLmVirxiQeK",
    "email": "marielos.garcia@vana.gt"
  },
  {
    "id": "-NgI-DmUuQckeHE9cvjt",
    "email": "sebastian.marroquin@vana.gt"
  },
  {
    "id": "-NgKM3QmFwMaHg70Qw11",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgPjYWGQj1XpFKhXd_4",
    "email": "sebastian.marroquin@vana.gt"
  },
  {
    "id": "-NgPitjbFX13B2UXSGJl",
    "email": "sebastian.marroquin@vana.gt"
  },
  {
    "id": "-NgPMVUD2cTj414NQSB_",
    "email": "sebastian.marroquin@vana.gt"
  },
  {
    "id": "-NgPgEPFcmsqViHLig7T",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgPjxmLBy0TGwAZ6cNU",
    "email": "sebastian.marroquin@vana.gt"
  },
  {
    "id": "-NgJmJ_zHuSNUDOuLIWG",
    "email": "sebastian.marroquin@vana.gt"
  },
  {
    "id": "-NgKyffreqh9G_2wIG8o",
    "email": "ingrid.castillo@vana.gt"
  },
  {
    "id": "-NgQFvjCMbsNIx4Jxmpd",
    "email": "pablo.valencia@vana.gt"
  },
  {
    "id": "-NgLmPYmJXQ0Gb_t-uTP",
    "email": "pablo.valencia@vana.gt"
  },
  {
    "id": "-NgQkQrYosAMhly_f4PI",
    "email": "pablo.valencia@vana.gt"
  },
  {
    "id": "-NgH26VcypE392o9jwsH",
    "email": "pablo.valencia@vana.gt"
  },
  {
    "id": "-NgQX1oYMz5AC41v91WO",
    "email": "pablo.valencia@vana.gt"
  },
  {
    "id": "-NgL9DYpL_MaxFPTuBM1",
    "email": "pablo.valencia@vana.gt"
  },
  {
    "id": "-NgUOOgCEh4P6S5xZrxK",
    "email": "maria.jo@vana.gt"
  },
  {
    "id": "-NgZH-pczABILLz9Lqjx",
    "email": "julian.sandoval@vana.gt"
  },
  {
    "id": "-NgnkGX6hHtBuNfCSF77",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgkeyBmLfoppMnPFkcK",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-Ngf8yCrfaKwWJdSFvMd",
    "email": "pablo.valencia@vana.gt"
  },
  {
    "id": "-NgsYF00hd-Y7WDzr-xS",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgmD3PZnljdqELEt0Kb",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-NgoLaE-Q7twXZtx31qa",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgsusM6io1ZVfSMIgQ3",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgseIOnEnwPy-rJPF2j",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-NgZu8bUWJiqfAkLgmy6",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgtQpbB1KRiR3FuIuo6",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgtROWH5DJIL6C1FqNu",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ngsc0Ovo5W63UsiaSZB",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-Ngnw3RgeqODMZOm2Mv7",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ngr-cS2uKWilETrpr7c",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-NgtOdsjAmj8OoZzYOjv",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgpND6GAbP05bhu1Z8T",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ngo4hLu_ewgY3mGSDMm",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgsgX8dwly_xmAdAZZU",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-NgkaJ5i03y2Bve_PPVm",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgtRDfPpD8Xw6zhPKE-",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ngta12hmwzSJiy8s9J7",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgsnGEalqwmXVRoXpSm",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-NgtQ9VLKK4QRuRQAA9E",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ngspns80Yxe35rvbKup",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-NgqCHFGfbFwhY44tCq0",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-NgtVclq9cYJ_8D4bchO",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ngr-sjh1jX_Lfe0DnpJ",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgthbQR8IgFxGXlfYAs",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgtaBWZPtUbu6Y1COHQ",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgsflEo1iuNLEBAgtpt",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-Ngt_Bmeq_xpvK0r0Wfm",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-NgtUJFgToJzYnr_Ibwu",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgtVe1mpzU2515AD8Q5",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgZlsQ-g8RNQo-0BCa-",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-Ngtcvz6kgErQOfpKH32",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ng_e6dGjtwvFpXaUrkI",
    "email": "ana.garrido@vana.gt"
  },
  {
    "id": "-NgLg-D7mpVITPN_YYGN",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgelIl__hFeh4qMp7_s",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgUP36NeeX9cT9nKv3r",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ngnr8ske0oL_HBfZs-P",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgtJFeRKJf4wZy70v1T",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgtIMMSw4MXoD9Vskzu",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgstQkTRD3GTXZokVtP",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgPC3au8H2eBRgeIIfj",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgtF3ZQISnmLkBGGOqs",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ngno461oCU1HfQNnfiq",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-Ngtm_W_AcUwo-peelar",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgkQTXKCdVu8l20ITtX",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgpkfwVBppgUU1XgnJZ",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-Ngq7yUtJvP9dHJy9HW1",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-NgtVyx6KUk8f-KIHVwt",
    "email": "jeus.escobar@vana.gt"
  },
  {
    "id": "-Ngssw4Vvm0q1QxSZ-CJ",
    "email": "daniel.godinez@vana.gt"
  },
  {
    "id": "-NgoUPBXCxjxFmGK7dNG",
    "email": "jeus.escobar@vana.gt"
  }
];


const getLoanRequestJournalsIndex = async (id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const findParams = {
    TableName: 'loan_request_journal',
    IndexName: 'request_index',
    ExpressionAttributeNames: {
      "#loan_request_id": "loan_request_id"
    },
    ExpressionAttributeValues: {
      ":loan_request_id": id
    },
    KeyConditionExpression: "#loan_request_id = :loan_request_id"
  };

  let result = [];
  let moreItems = true;
  while (moreItems) {
    moreItems = false;
    let foundItems = await dynamodbClient.query(findParams).promise();
    if ((foundItems) && (foundItems.Items)) {
      result = result.concat(foundItems.Items);
    }
    if (typeof foundItems.LastEvaluatedKey != "undefined") {
      moreItems = true;
      findParams["ExclusiveStartKey"] = foundItems.LastEvaluatedKey;
    }
  }
  return result;
}

const getLoanRequestJournals = async (id) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' // Replace with your desired AWS region
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'loan_request_journal',
    Key: {
      transaction_id: id
    }
  };
  
  const { Item } = await dynamodbClient.get(params).promise();
  return Item;
}

const updateJournal = async (journalData) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: 'us-east-1' 
  });

  const dynamodbClient = new AWS.DynamoDB.DocumentClient();
  const currentDateTime = new Date().toISOString();
  const updateParams = {
    TableName: "loan_request_journal",
    Key: {
      transaction_id: `${journalData["transaction_id"]}`,
    },
    ExpressionAttributeNames: {
      "#created_by": "created_by",
    },
    ExpressionAttributeValues: {
      ":created_by": journalData["created_by"],
    },
    UpdateExpression: "set #created_by = :created_by"
  };

  await dynamodbClient.update(updateParams).promise();//new UpdateCommand(updateParams);
  return true;
}

async function backfillLoanRequestJournal() {
  console.log("Empezo backfill");
  arrayLoanRequestToUpdate.map(async (item) => {
    const journalsIndex = await getLoanRequestJournalsIndex(item.id);
    //console.log("journalsIndex: "+journalsIndex.length)
  
    const journalsAll = await Promise.all(journalsIndex.map((i) => getLoanRequestJournals(i["transaction_id"])));
    //console.log("journalsAll: "+journalsAll.length)
  
    const journalsFiltered = journalsAll.filter((journal) => ["document_approved","document_reject","rejected"].includes(journal["status"]) && !journal["created_by"] );
    //console.log("journalsFiltered: "+journalsFiltered.length)
  
    await Promise.all(
      journalsFiltered.map(async (jour) => {
          const updated = {
            ...jour
          };
          updated["created_by"] = item.email;
          console.log("updated: "+JSON.stringify(updated));
          return updateJournal(updated);
      })
    );
  })
  console.log("Fin")
}

module.exports.backfillLoanRequestJournal = backfillLoanRequestJournal;