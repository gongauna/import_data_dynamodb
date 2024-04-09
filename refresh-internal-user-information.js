// Imports
const users = require('./user-role-permission/gen-data-users');
const roles = require('./user-role-permission/gen-data-roles');
const permissions = require('./user-role-permission/gen-data-permisos');
const userRoles =  require('./user-role-permission/gen-data-user-role')
const deleteInternalUsersRecords = require('./user-role-permission/delete-data-internal-users');

// Limpio toda la tabla
//deleteInternalUsersRecords.deleteInternalUsersRecords();
const ambiente = ""; // _dev, _qa, vacio (para prod)
// Genero data
users.generateUsers(ambiente);
roles.generateRoles(ambiente);
permissions.generatePermissions(ambiente);
userRoles.generateUserRoles(ambiente);

//aws dynamodb batch-write-item --request-items file://files_to_import/varias/users_dev_0.json








   


   



   



   