import graphQLClient, { authenticatedRequest } from './graphqlClient';
import { parseError } from '../errors/errorMessages';

// Simple GraphQL service with error handling and automatic authentication
const fetchGraphQL = async (query, variables = {}) => {
  try {
    // Use authenticated request to automatically include JWT token
    const response = await authenticatedRequest(query, variables);

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
