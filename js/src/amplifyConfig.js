import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      region: import.meta.REACT_APP_AWS_REGION,
      userPoolId: import.meta.REACT_APP_USER_POOL_ID,
      userPoolWebClientId: import.meta.REACT_APP_USER_POOL_CLIENT_ID,
      mandatorySignIn: false, // Optional: Enforce user login before accessing the app
    },
  },
});

export default Amplify;
