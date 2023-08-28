const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
var json = require('./../usersCognito.json');

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
      const createdAt = getDateFormatted(row.created_at).toISOString();
      const deletedAt = row.deleted_at ? getDateFormatted(row.deleted_at).toISOString() : null;
      const userId = row.deleted_at ? (`${row.first_name}-${row.last_name}`).replace(new RegExp(' ', 'g'), '').toLowerCase() : (cognitoUserMap.get(row.email) ?? row.email);
      if (userId) {
          const rowResponse = {
            PutRequest: {
              Item: {
                pk: {S:`USER|${userId}`},
                sk: {S:`USER|${userId}`},
                props: {
                    M: {
                      created_at: {
                        S: createdAt
                      },
                      updated_at: {
                        S: createdAt
                      },
                      id: {
                        S: userId
                      },
                      email: {
                        S: row.email && row.email.length > 0 ? row.email : "deleted@vana.gt"
                      },
                      first_name: {
                        S: row.first_name
                      },
                      last_name: {
                        S: row.last_name
                      },
                      roles: {
                        L: row.rol?.length > 0 ? row.rol : [{
                          S: "deleted"
                        }]
                      },
                      status: {
                        S: row.deleted_at ? "disabled" : "enabled"
                      },
                      department: {
                        S: row.department
                      }
                    }
                },
                email: {
                  S: row.email && row.email.length > 0 ? row.email : "deleted@vana.gt"
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

          if (deletedAt) {
            rowResponse.PutRequest.Item.props.M["deleted_at"] = {
              S: deletedAt
            }
          }

          if (row.position) {
            rowResponse.PutRequest.Item.props.M["deleted_at"] = {
              S: row.position
            }
          }

          return rowResponse;
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
      const filtered = jsonUsersArray.filter((item) => item).filter((row) => jsonUsersArray.indexOf(row) >= startRow && jsonUsersArray.indexOf(row) < endRow);
      let internalUserJson = {
        internal_users_dev: filtered
      };
      fs.writeFile(`./files_to_import/varias/users_dev_${r}.json`,JSON.stringify(internalUserJson),"utf8", function (err) {
          if (err) {
            console.log("Error"+err);
          }
          console.log(`Users_${r} JSON file saved`);
      })
    }
})
}

function getDateFormatted(dateString) {
  if (dateString) {
    const inputDate = dateString;
    const [day, month, year] = inputDate.split('/');
    const formattedDate = new Date(`20${year}-${month}-${day}`);
    
    return formattedDate;
  } else {
    return new Date();
  }
}

module.exports.generateUsers = generateUsers;