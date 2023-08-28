const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');

function generateRoles() {
//ROLES
readXlsxFile('./data-user.xlsx', { sheet: 'permissions by rol'}).then((rows) => {
    const arraysRolesPermissions = [];
    let i = 0;
    rows[0].forEach((row) => {
      arraysRolesPermissions[i] = {role: row, permissions:[]}
      i++;
    })

    rows.shift();
    rows.forEach((row) => {
      i = 0;
      row.forEach((perm) => {
        if (perm) {
          arraysRolesPermissions[i].permissions.push({S:perm});
          i++;
        }
      })
    });

    const jsonRolesArray = arraysRolesPermissions.map((row) => {
      return {
          PutRequest: {
            Item: {
              pk: {S:`ROLE|${row.role}`},
              sk: {S:`ROLE|${row.role}`},
              props: {
                  M: {
                    created_at: {
                      S: new Date().toISOString()
                    },
                    updated_at: {
                      S: new Date().toISOString()
                    },
                    id: {
                      S: row.role
                    },
                    status: {
                      S: "enabled"
                    },
                    permissions: {
                      L: row.permissions
                    }
                  }
              },
              shown_id: {
                S: row.role
              },
              type: {
                S: "ROLE"
              }
            }
          }
      }
    });

    let internalUserJson = {
      internal_users_dev: jsonRolesArray
    };

    fs.writeFile("./files_to_import/varias/roles_dev.json",JSON.stringify(internalUserJson),"utf8", function (err) {
        if (err) {
          console.log("Error"+err);
        }
        console.log("Roles JSON file saved");
    })
})

}
module.exports.generateRoles = generateRoles;