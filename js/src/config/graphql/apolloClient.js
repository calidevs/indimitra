import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// prod
// const API_URL = 'https://indimitra.com/graphql';
// dev
let API_URL = `https://indimitra.com/graphql`;

const url = window.location.href?.includes('http://localhost');
if (url) {
  API_URL = `http://127.0.0.1:8000/graphql`;
}

const httpLink = createHttpLink({
  uri: API_URL,
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
  },
});
