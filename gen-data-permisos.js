const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');


function generatePermissions() {
  //PERMISOS
const schemaPermissions = {
  'description': {
    prop: 'description',
    type: String
  },
  'name': {
    prop: 'name',
    type: String
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

  let internalUserJson = {
    internal_users_dev: jsonPermissionArray
  };

  fs.writeFile("./files_to_import/permissions_dev.json",JSON.stringify(internalUserJson),"utf8", function (err) {
      if (err) {
        console.log("Error"+err);
      }
      console.log("Permission JSON file saved");
  })
});
}

module.exports.generatePermissions = generatePermissions;