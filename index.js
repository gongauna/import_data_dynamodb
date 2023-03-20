//User-Role-Permission generation
const permissions = require('./user-role-permission/gen-data-permisos');
const roles = require('./user-role-permission/gen-data-roles');
const users = require('./user-role-permission/gen-data-users');
const userRoles =  require('./user-role-permission/gen-data-user-role');

permissions.generatePermissions();
roles.generateRoles();
users.generateUsers();
userRoles.generateUserRoles();

//User-Role-Permission generation
const collection_annotation_types = require('./collection-annotation-types/gen-data-annotation-types');

collection_annotation_types.generateAnnotationTypes();

//Docu:

// Get data from cognito:: aws cognito-idp list-users --user-pool-id us-east-1_VOSHOY7Am > usersCognito.json
//Para importar: aws dynamodb batch-write-item --request-items file://users_dev_0.json