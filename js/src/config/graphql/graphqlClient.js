import { GraphQLClient } from 'graphql-request';

const API_URL = 'http://localhost:8000/graphql';

const graphQLClient = new GraphQLClient(API_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

export default graphQLClient;
