// Imports
const users = require('./user-role-permission/gen-data-users');
const roles = require('./user-role-permission/gen-data-roles');
const permissions = require('./user-role-permission/gen-data-permisos');
const userRoles =  require('./user-role-permission/gen-data-user-role')
const deleteInternalUsersRecords = require('./user-role-permission/delete-data-internal-users');

// Limpio toda la tabla
//deleteInternalUsersRecords.deleteInternalUsersRecords();

// Genero data
users.generateUsers();
/*roles.generateRoles();
permissions.generatePermissions();
userRoles.generateUserRoles();*/

//aws dynamodb batch-write-item --request-items file://files_to_import/varias/users_dev_0.json