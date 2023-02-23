const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
var json = require('./usersCognito.json');

// Get data from cognito:: aws cognito-idp list-users --user-pool-id us-east-1_VOSHOY7Am > usersCognito.json

function generateUsers() {
//Users
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

    const jsonUsersArray = arrayUsers.map((row) => {
      const userId = cognitoUserMap.get(row.email) ?? row.email;
      if (userId) {
          return {
            PutRequest: {
              Item: {
                pk: {S:`USER|${userId}`},
                sk: {S:`USER|${userId}`},
                props: {
                    M: {
                      created_at: {
                        S: new Date().toISOString()
                      },
                      updated_at: {
                        S: new Date().toISOString()
                      },
                      id: {
                        S: userId
                      },
                      email: {
                        S: row.email
                      },
                      first_name: {
                        S: row.first_name
                      },
                      last_name: {
                        S: row.last_name
                      },
                      roles: {
                        L: row.rol
                      },
                      status: {
                        S: "enabled"
                      }
                    }
                },
                email: {
                  S: row.email
                },
                shown_id: {
                  S: userId
                },
                type: {
                  S: "USER"
                }
              }
            }
        }
      } else {
        return row.email;
      }
      
    });

    let internalUserJson = {
      internal_users_dev: jsonUsersArray
    };

    const cantRequest = 24;
    const cantFiles = Math.ceil(jsonUsersArray.length / cantRequest);

    for (let r=0; r< cantFiles; r++) {
      const startRow = r*cantRequest;  
      const endRow = (r+1)*cantRequest;
      const filtered = jsonUsersArray.filter((row) => jsonUsersArray.indexOf(row) >= startRow && jsonUsersArray.indexOf(row) < endRow);
      let internalUserJson = {
        internal_users_dev: filtered
      };
      fs.writeFile(`./files_to_import/users_dev_${r}.json`,JSON.stringify(internalUserJson),"utf8", function (err) {
          if (err) {
            console.log("Error"+err);
          }
          console.log(`Users_${r} JSON file saved`);
      })
    }
})
}
//Para importar: aws dynamodb batch-write-item --request-items file://users_dev_0.json
module.exports.generateUsers = generateUsers;