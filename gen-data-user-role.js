const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
var json = require('./usersCognito.json');

// Get data from cognito:: aws cognito-idp list-users --user-pool-id us-east-1_VOSHOY7Am > usersCognito.json

//Users
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
    'rol': {
      prop: 'rol',
      type: (value) => {
        const arrayRoles = value.split(',');
        if (!arrayRoles) {
          return null;
        }

        const arrayObjectRoles = arrayRoles.map((rol) => {
          return {
            S: rol.trim()
          }
        })
        return arrayObjectRoles;
      }
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
      const rowsToInsert = row.rol.forEach((rol) => {

        const [permissionsFiltered] = arraysRolesPermissions.filter((rpe) => rpe.role === rol.S);

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
                  S: row.email
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
      fs.writeFile(`./files_to_import/users_roles_dev_${r}.json`,JSON.stringify(internalUserJson),"utf8", function (err) {
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

