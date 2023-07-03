//User-Role-Permission generation
/*const permissions = require('./user-role-permission/gen-data-permisos');
const roles = require('./user-role-permission/gen-data-roles');
const users = require('./user-role-permission/gen-data-users');
const userRoles =  require('./user-role-permission/gen-data-user-role');*/
const collectionHouseRecords = require('./annotations-issue-promissory/gen-data-loans-collection-house');
const collectionHouseRecordsAnnotations = require('./collection-houses-data/gen-data-loans-collection-house-annotations');
const promissoryNoteAnnotations = require('./annotations-issue-promissory/gen-annotations-loan-promissory');

/*permissions.generatePermissions();
roles.generateRoles();
users.generateUsers();
userRoles.generateUserRoles();

//User-Role-Permission generation
const collection_annotation_types = require('./collection-annotation-types/gen-data-annotation-types');

collection_annotation_types.generateAnnotationTypes();*/


//Collection houses records
collectionHouseRecords.generateCollectionHouseRecords();


//Collection houses records annotations
//collectionHouseRecordsAnnotations.generateCollectionHouseRecordsAnnotations();


//Issue promissory
//promissoryNoteAnnotations.promissoryNoteAnnotations();


//Docu:

// Get data from cognito:: aws cognito-idp list-users --user-pool-id us-east-1_VOSHOY7Am > usersCognito.json
//Para importar: aws dynamodb batch-write-item --request-items file://users_dev_0.json

/*aws dynamodb batch-write-item --request-items file://collection_houses_loans_0.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_1.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_2.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_3.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_4.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_5.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_6.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_7.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_8.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_9.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_10.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_11.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_12.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_13.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_14.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_15.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_16.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_17.json
aws dynamodb batch-write-item --request-items file://collection_houses_loans_18.json*/