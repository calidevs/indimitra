import { GraphQLClient } from 'graphql-request';
import { fetchAuthSession } from 'aws-amplify/auth';

// prod
// const API_URL = 'https://indimitra.com/graphql';
// dev
let API_URL = `https://indimitra.com/graphql`;

const url = window.location.href?.includes('http://localhost');
if (url) {
  API_URL = `http://127.0.0.1:8000/graphql`;
}

// Create GraphQL client with dynamic auth headers
const graphQLClient = new GraphQLClient(API_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get auth token
export const getAuthHeaders = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();

    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  } catch (error) {
    return {};
  }
};

// Create authenticated request method
export const authenticatedRequest = async (query, variables = {}) => {
  const authHeaders = await getAuthHeaders();
  return graphQLClient.request(query, variables, {
    ...graphQLClient.requestConfig.headers,
    ...authHeaders,
  });
};

export default graphQLClient;
