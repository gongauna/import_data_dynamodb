// Imports
const createUser = require('./collection-houses-data/create-collection-house-user.js');

const house = "venta1corpocredit"
const numUser = 1;
const firstName = "J"
const lastName = "Novales"
const email = "jnovales@novales.com.gt"

createUser.createUserUseCase(house, numUser, email, firstName, lastName);