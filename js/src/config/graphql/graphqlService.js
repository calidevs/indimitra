import graphQLClient from './graphqlClient';
import { parseError } from '../errors/errorMessages';

// Simple GraphQL service with error handling
const fetchGraphQL = async (query, variables = {}) => {
  try {
    const response = await graphQLClient.request(query, variables);

    // Check for GraphQL errors in the response
    if (response.errors) {
      const errorMessage = parseError({ response });
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    // Parse and throw user-friendly error
    const userFriendlyMessage = parseError(error);
    const enhancedError = new Error(userFriendlyMessage);
    enhancedError.originalError = error;
    enhancedError.isGraphQLError = true;
    throw enhancedError;
  }
};

export default fetchGraphQL;
