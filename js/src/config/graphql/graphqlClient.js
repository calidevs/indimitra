import { GraphQLClient } from 'graphql-request';
// import {}
// prod
// const API_URL = 'https://indimitra.com/graphql';
// dev
let API_URL = `https://indimitra.com/graphql`;

const url = window.location.href?.includes('http://localhost');
if (url) {
  API_URL = `http://127.0.0.1:8000/graphql`;
}

// const  API_URL= `http://127.0.0.1:8000/graphql`;

const graphQLClient = new GraphQLClient(API_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

export default graphQLClient;
