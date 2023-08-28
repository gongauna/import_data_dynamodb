// Imports
const users = require('./user-role-permission/gen-data-users');
const roles = require('./user-role-permission/gen-data-roles');
const permissions = require('./user-role-permission/gen-data-permisos');
const userRoles =  require('./user-role-permission/gen-data-user-role')
const deleteInternalUsersRecords = require('./user-role-permission/delete-data-internal-users');

const collectionHouseRecords = require('./collection-houses-data/gen-data-loans-collection-house');
const deleteCollectionHouseRecords = require('./collection-houses-data/delete-loans-collection-house');
const updateCollectionHouseRecords = require('./collection-houses-data-update-status/update-status-to-partial');
const updateFulfilledCollectionHouseRecords = require('./collection-houses-data-update-status/update-status-to-fulfilled');
const updateCollectionHouseRecordsBucketName = require('./collection-houses-data-update-status/update-bucket-name');

//Collection houses records
collectionHouseRecords.generateCollectionHouseRecords();
