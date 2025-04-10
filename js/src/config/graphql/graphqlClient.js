import { GraphQLClient } from 'graphql-request';

const API_URL = 'https://indimitra.com/graphql';

const graphQLClient = new GraphQLClient(API_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

export default graphQLClient;
