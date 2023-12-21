const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');

function generatePermissions(ambiente) {
  //PERMISOS
const schemaPermissions = {
  'description': {
    prop: 'description',
    type: String
  },
  'name': {
    prop: 'name',
    type: (value) => {
      const splitPipe = value.split('|');
      return splitPipe[1].trim()
    }
  }
}


readXlsxFile('./data-user.xlsx', {schema: schemaPermissions, sheet: 'permissions'}).then((rows) => {
  const jsonPermissionArray = rows.rows.map((row) => {
      dateISO = new Date().toISOString();
      return {
          PutRequest: {
            Item: {
              pk: {S:`PERM|${row.name}`},
              sk: {S:`PERM|${row.name}`},
              props: {
                  M: {
                    created_at: {
                      S: dateISO
                    },
                    updated_at: {
                      S: dateISO
                    },
                    id: {
                      S: row.name
                    },
                    description: {
                      S: row.description
                    },
                    status: {
                      S: "enabled"
                    },
                  }
              },
              shown_id: {
                S: row.name
              },
              type: {
                S: "PERM"
              }
            }
          }
      }
  });

  const cantRequest = 24;
  const cantFiles = Math.ceil(jsonPermissionArray.length / cantRequest);

  for (let r=0; r< cantFiles; r++) {
    const startRow = r*cantRequest;  
    const endRow = (r+1)*cantRequest;
    const filtered = jsonPermissionArray.filter((row) => jsonPermissionArray.indexOf(row) >= startRow && jsonPermissionArray.indexOf(row) < endRow);
    //const ambiente = "_dev";
    let internalUserJson = {
      [`internal_users${ambiente}`]: filtered
    };
    fs.writeFile(`./files_to_import/varias/permissions_dev_${r}.json`,JSON.stringify(internalUserJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log(`Users-roles ${r} JSON file saved`);
    })
  }


  /*let internalUserJson = {
    [`internal_users${ambiente}`]: jsonPermissionArray
  };

  fs.writeFile("./files_to_import/varias/permissions_dev.json",JSON.stringify(internalUserJson),"utf8", function (err) {
      if (err) {
        console.log("Error"+err);
      }
      console.log("Permission JSON file saved");
  })*/
});
}

module.exports.generatePermissions = generatePermissions;