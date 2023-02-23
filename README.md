# import_data_dynamodb
* Developer must paste data-user.xlsx file in project root.
* Developer must generate cognito users file information with next command:
    aws cognito-idp list-users --user-pool-id us-east-1_VOSHOY7Am > usersCognito.json

* Execute index.js and developer must import files_to_import directory with next command:
    For each file:
    aws dynamodb batch-write-item --request-items file://users_dev_0.json