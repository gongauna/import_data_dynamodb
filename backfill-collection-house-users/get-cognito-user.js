const AWS = require("aws-sdk");

const findUserByEmail = async (email) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "us-east-1",
  });

  const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID, // Replace with your Cognito User Pool ID
    Filter: `email = "${email}"`,
    Limit: 1,
  };

  try {
    const result = await cognitoIdentityServiceProvider.listUsers(params).promise();
    if (result.Users && result.Users.length > 0) {
      const user = result.Users[0];
      const idCognito = user.Username; // Cognito ID is usually stored in the Username field
      return idCognito;
    } else {
      console.log(`No user found with email: ${email}`);
      return null;
    }
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

module.exports.findUserByEmail = findUserByEmail;