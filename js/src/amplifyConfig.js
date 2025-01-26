import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: process.env.AWS_REGION,
    userPoolId: process.env.USER_POOL_ID,
    userPoolWebClientId: process.env.USER_POOL_CLIENT_ID,
    mandatorySignIn: false, // Optional: Enforce user login before accessing the app
  },
});

export default Amplify;
