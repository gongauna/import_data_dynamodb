// Imports
const createUser = require('./collection-houses-data/create-collection-house-user.js');

const house = "venta1corpocredit"
const numUser = 1;
const firstName = "J"
const lastName = "Novales"
const email = "jnovales@novales.com.gt"

createUser.createUserUseCase(house, numUser, email, firstName, lastName);

// To Create user cognito

//aws cognito-idp admin-create-user \
//  --user-pool-id YOUR_USER_POOL_ID \
//  --username USERNAME \
//  --user-attributes Name=email,Value=user@example.com Name=phone_number,Value=+1234567890