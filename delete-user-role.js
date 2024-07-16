// Imports
const users = require('./user-role-permission/gen-data-users');
const roles = require('./user-role-permission/gen-data-roles');
const permissions = require('./user-role-permission/gen-data-permisos');
const userRoles =  require('./user-role-permission/gen-data-user-role')
const deleteInternalUsersRecords = require('./user-role-permission/delete-data-internal-users');

// Limpio toda la tabla
const ambiente = ""; // _dev, _qa, vacio (para prod)
deleteInternalUsersRecords.deleteInternalUsersRecords(ambiente);








   


   



   



   