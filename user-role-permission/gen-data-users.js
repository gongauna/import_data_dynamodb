const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
var json = require('./../usersCognito.json');

function generateUsers(ambiente) {
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
      type: (value) => {
        if (typeof value === "string") {
          const [day, month, year] = value.split('/');
          return `${day}/${month}/${year.length > 2 ? year.substring(2,4) : year}`
        } else {
          const [year, month, day] = value.toISOString().substring(0,10).split('-');

          return `${day}/${month}/${year.substring(2,4)}`
        }
      }
    },
    'deleted_at': {
      prop: 'deleted_at',
      type: (value) => {
        if (typeof value === "string") {
          const [day, month, year] = value.split('/');
          return `${day}/${month}/${year.length > 2 ? year.substring(2,4) : year}`
        } else {
          const day = value.getUTCDate();
          const month = value.getMonth()+1;
          const year = value.getUTCFullYear();

          return `${day}/${month}/${year.toString().substring(2,4)}`
        }
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
      //console.log(`${row.last_name}-${row.created_at}`);
      const createdAt = getDateFormatted(row.created_at).toISOString();
      const deletedAt = row.deleted_at ? getDateFormatted(row.deleted_at).toISOString() : null;
      const userId = row.deleted_at ? (`${row.first_name}-${row.last_name}`).replace(new RegExp(' ', 'g'), '').toLowerCase() : (cognitoUserMap.get(row.email) ?? row.email);
      if (!row.email) {
        return null;
      }
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
                        S: row.email && row.email.length > 0 ? row.email : `deleted-${userId}@vana.gt`
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
                },
                status: {
                  S: row.deleted_at ? "disabled" : "enabled"
                },
                department: {
                  S: row.department
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
            rowResponse.PutRequest.Item.props.M["position"] = {
              S: row.position
            }
          }

          return rowResponse;
      } else {
        return `${row.first_name}-${row.last_name}-${row.deleted_at}`;//row.email;
      }
      
    });

    let internalUserJson = {
      internal_users_qa: jsonUsersArray
    };

    const cantRequest = 24;
    const cantFiles = Math.ceil(jsonUsersArray.length / cantRequest);

    for (let r=0; r< cantFiles; r++) {
      const startRow = r*cantRequest;  
      const endRow = (r+1)*cantRequest;
      const filtered = jsonUsersArray.filter((item) => item).filter((row) => jsonUsersArray.indexOf(row) >= startRow && jsonUsersArray.indexOf(row) < endRow);
      //const ambiente = "_dev";
      let internalUserJson = {
        [`internal_users${ambiente}`]: filtered
      };
      fs.writeFile(`./files_to_import/varias/users_prod_${r}.json`,JSON.stringify(internalUserJson),"utf8", function (err) {
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
    if (typeof dateString === "string") {
      const inputDate = dateString;
      const [day, month, year] = inputDate.split('/');
      const formattedDate = new Date(`20${year}-${month}-${day}`);

      return formattedDate;
    } else {
      /*const date2 = new Date(dateString)
      const day = date2.getUTCDate();
      const month = date2.getUTCMonth();
      const year = date2.getUTCFullYear();
      console.log(`${year}-${month}-${day}`);
      const formattedDate = new Date(`${year}-${month}-${day}`);*/

      return dateString;
    }
  } else {
    return new Date();
  }
}

module.exports.generateUsers = generateUsers;