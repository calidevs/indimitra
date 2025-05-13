const url = window.location.href?.includes('http://localhost');
let userPoolId = 'us-east-1_6NtAulnkj';
let userPoolClientId = '1361ghg1fpt2grmchv7ttf8bbj';
if (url) {
  userPoolId = 'us-east-1_ehhI7OmUk';
  userPoolClientId = '1okaltgd288h6sjgc5cedlth45'
}

const amplifyConfig = {
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: userPoolId,
      userPoolClientId: userPoolClientId,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: true,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

export default amplifyConfig;
