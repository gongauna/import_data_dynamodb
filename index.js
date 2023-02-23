//WIP EXECUTE EACH FUNCTION
const permissions = require('./gen-data-permisos');
const roles = require('./gen-data-roles');
const users = require('./gen-data-users');
const userRoles =  require('./gen-data-user-role');

permissions.generatePermissions();
roles.generateRoles();
users.generateUsers();
userRoles.generateUserRoles();


//Docu:

// Get data from cognito:: aws cognito-idp list-users --user-pool-id us-east-1_VOSHOY7Am > usersCognito.json
//Para importar: aws dynamodb batch-write-item --request-items file://users_dev_0.json