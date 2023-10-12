// Imports
const users = require('./user-role-permission/gen-data-users');
const roles = require('./user-role-permission/gen-data-roles');
const permissions = require('./user-role-permission/gen-data-permisos');
const userRoles =  require('./user-role-permission/gen-data-user-role')
const deleteInternalUsersRecords = require('./user-role-permission/delete-data-internal-users');

const collectionHouseRecords = require('./collection-houses-data/gen-data-loans-collection-house');
const deleteCollectionHouseRecords = require('./collection-houses-data/delete-loans-collection-house');
const deleteDuplicated = require('./collection-houses-data/delete-duplicados');
const deleteAnnotations = require('./collection-houses-data/delete-annotations');
const deleteAnnotationsBadAssignment = require('./collection-houses-data/delete-annotations-bad-assignment');
const updateCollectionHouseRecordsAssignedEndAt = require('./collection-houses-data/update-assigned-end-date');
//const updateCollectionHouseRecords = require('./collection-houses-data-update-status/update-status-to-partial');
//const updateCollectionHouseRecords = require('./collection-houses-data-update-status/update-status-to-partial');
const updateFulfilledCollectionHouseRecords = require('./collection-houses-data-update-status/update-status-to-fulfilled');
const updateCollectionHouseRecordsBucketName = require('./collection-houses-data-update-status/update-bucket-name');

collectionHouseRecords.generateCollectionHouseRecords();