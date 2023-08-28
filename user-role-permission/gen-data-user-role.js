const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
var json = require('../usersCognito.json');

function generateUserRoles() {
const schemaUsers = {
  'first_name': {
    prop: 'first_name',
    type: String
  },
  'last_name': {
    prop: 'last_name',
    type: String
  },
  'email': {
    prop: 'email',
    type: String
  },
  'position': {
    prop: 'position',
    type: String
  },
  'department': {
    prop: 'department',
    type: String
  },
  'rol': {
    prop: 'rol',
    type: (value) => {
      const arrayRoles = value.split(',');
      if (!arrayRoles) {
        return null;
      }

      const arrayObjectRoles = arrayRoles.map((rol) => {
        const splitPipe = rol.split('|');
        return {
          S: splitPipe[1].trim()
        }
      })
      return arrayObjectRoles;
    }
  },
  'created_at': {
    prop: 'created_at',
    type: String
  },
  'deleted_at': {
    prop: 'deleted_at',
    type: String
  }
}

const arraysRolesPermissions = [];
readXlsxFile('./data-user.xlsx', { sheet: 'permissions by rol'}).then((rows) => {
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

  readXlsxFile('./data-user.xlsx', { schema: schemaUsers, sheet: 'users'}).then((rows) => {
    const arrayUsers = rows.rows;
    
    const cognitoUserMap = new Map();
    json.Users.forEach((element) => {
      const [email] = element.Attributes.filter((att) => att.Name === 'email');
      const id = element.Username
      if (email.Value) {
        cognitoUserMap.set(email.Value, id);

      }
    });

    const jsonUsersArray = []
    arrayUsers.forEach((row) => {
      const userId = cognitoUserMap.get(row.email) ?? row.email;
      const rowsToInsert = row.rol?.forEach((rol) => {

        const [permissionsFiltered] = arraysRolesPermissions.filter((rpe) => rpe.role === rol.S);

        if (!permissionsFiltered) {
          console.log("ERROR:"+JSON.stringify(rol))
        }
        const permissionsRol = permissionsFiltered.permissions;

          jsonUsersArray.push({
            PutRequest: {
              Item: {
                pk: {S:`USER|${userId}|ROLE|${rol.S}`},
                sk: {S:`ROLE|${rol.S}`},
                props: {
                    M: {
                      permissions: {
                        L: permissionsRol
                    }
                },
                },
                email: {
                  S: row.email && row.email.length > 0 ? row.email : "deleted@vana.gt"
                },
                shown_id: {
                  S: rol.S
                },
                type: {
                  S: "USER|ROLE"
                }
              }
            }
          }
        );
      });
    });

    const cantRequest = 24;
    const cantFiles = Math.ceil(jsonUsersArray.length / cantRequest);

    for (let r=0; r< cantFiles; r++) {
      const startRow = r*cantRequest;  
      const endRow = (r+1)*cantRequest;
      const filtered = jsonUsersArray.filter((row) => jsonUsersArray.indexOf(row) >= startRow && jsonUsersArray.indexOf(row) < endRow);
      let internalUserJson = {
        internal_users_dev: filtered
      };
      fs.writeFile(`./files_to_import/varias/users_roles_dev_${r}.json`,JSON.stringify(internalUserJson),"utf8", function (err) {
          if (err) {
            console.log("Error"+err);
          }
          console.log(`Users-roles ${r} JSON file saved`);
      })
    }
})
});
}

module.exports.generateUserRoles = generateUserRoles;

