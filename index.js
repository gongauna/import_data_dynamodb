//User-Role-Permission generation
/*const permissions = require('./user-role-permission/gen-data-permisos');
const roles = require('./user-role-permission/gen-data-roles');
const users = require('./user-role-permission/gen-data-users');
const userRoles =  require('./user-role-permission/gen-data-user-role');*/
const collectionHouseRecords = require('./collection-houses-data/gen-data-loans-collection-house');
const collectionHouseRecordsDO = require('./collection-houses-data/gen-data-loans-collection-house-do');
const deleteCollectionHouseRecords = require('./collection-houses-data/delete-loans-collection-house');
const updateCollectionHouseRecords = require('./collection-houses-data-update-status/update-status-to-partial');
const updateFulfilledCollectionHouseRecords = require('./collection-houses-data-update-status/update-status-to-fulfilled');
const updateCollectionHouseRecordsBucketName = require('./collection-houses-data-update-status/update-bucket-name');
const collectionHouseRecordsAnnotations = require('./collection-houses-data/gen-data-loans-collection-house-annotations');
const promissoryNoteAnnotations = require('./annotations-issue-promissory/gen-annotations-loan-promissory');

//Collection houses records
//collectionHouseRecords.generateCollectionHouseRecords();

//Annotations
collectionHouseRecordsAnnotations.generateCollectionHouseRecordsAnnotations();

//Docu:

// Get data from cognito:: aws cognito-idp list-users --user-pool-id us-east-1_VOSHOY7Am > usersCognito.json
//Para importar: aws dynamodb batch-write-item --request-items file://users_dev_0.json

//aws dynamodb batch-write-item --request-items file://collection_houses_loans_0.json