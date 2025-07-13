// Error message configuration
export const ERROR_MESSAGES = {
  // Authentication errors
  UNAUTHENTICATED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',

  // Order related errors
  ORDER_NOT_FOUND: 'Order not found.',
  ORDER_ALREADY_CANCELLED: 'This order has already been cancelled.',
  ORDER_CANNOT_BE_UPDATED: 'This order cannot be updated at this time.',
  INSUFFICIENT_INVENTORY: 'Some items are out of stock.',
  ADDRESS_NOT_FOUND: 'Delivery address not found.',
  PICKUP_ADDRESS_NOT_FOUND: 'Pickup address not found.',
  DELIVERY_PINCODE_NOT_SERVICED: 'Delivery is not available for this location.',

  // User related errors
  USER_NOT_FOUND: 'User not found.',
  USER_ALREADY_EXISTS: 'User already exists.',
  INVALID_USER_TYPE: 'Invalid user type specified.',

  // Store related errors
  STORE_NOT_FOUND: 'Store not found.',
  STORE_NOT_AVAILABLE: 'Store is currently unavailable.',

  // Product related errors
  PRODUCT_NOT_FOUND: 'Product not found.',
  PRODUCT_NOT_AVAILABLE: 'Product is currently unavailable.',

  // Network errors
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',

  // Generic errors
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_INPUT: 'The information you provided is invalid.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Simple error parser function
export const parseError = (error) => {
  // Handle GraphQL errors
  if (error.response?.errors) {
    const graphQLErrors = error.response.errors;
    const errorMessages = graphQLErrors.map((err) => {
      // Check for specific error codes
      if (err.extensions?.code) {
        const code = err.extensions.code;
        if (ERROR_MESSAGES[code]) {
          return ERROR_MESSAGES[code];
        }
      }

      // Check for specific error messages
      if (err.message?.includes('Pickup address ID is required for pickup orders')) {
        return 'Please select a valid address to deliver.';
      }

      if (err.message?.includes('validation')) {
        return ERROR_MESSAGES.VALIDATION_ERROR;
      }

      if (err.message?.includes('not found')) {
        return 'The requested item was not found.';
      }

      if (err.message?.includes('permission')) {
        return ERROR_MESSAGES.FORBIDDEN;
      }

      if (err.message?.includes('already exists')) {
        return 'This item already exists.';
      }

      // Return the original message if no specific mapping
      return err.message || ERROR_MESSAGES.GENERIC_ERROR;
    });

    return errorMessages.join('. ');
  }

  // Handle network errors
  if (error.message?.includes('Network request failed')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // Handle HTTP errors
  if (error.response?.status) {
    switch (error.response.status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHENTICATED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
      case 503:
        return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
      default:
        return `Server error (${error.response.status}). Please try again.`;
    }
  }

  // Default error message
  return error.message || ERROR_MESSAGES.GENERIC_ERROR;
};
