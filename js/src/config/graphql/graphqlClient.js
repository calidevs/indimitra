import { GraphQLClient } from 'graphql-request';
import { fetchAuthSession } from 'aws-amplify/auth';

// Use current origin so GraphQL works on all domains (indimitra.com, famoushalalmeats.com, etc.)
// Nginx proxies /graphql to the backend for each domain
const isLocalhost = typeof window !== 'undefined' && window.location.href?.includes('http://localhost');
const API_URL = isLocalhost
  ? 'http://127.0.0.1:8000/graphql'
  : `${window.location.origin}/graphql`;

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
