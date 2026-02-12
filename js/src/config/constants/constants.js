export const TAX_RATE = 0.08;
export const DELIVERY_FEE = 5.99;

// Shared order status definitions for consistent color and label usage across the app
export const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'ORDER_PLACED', label: 'Order Placed', color: 'info' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'primary' },
  { value: 'READY_FOR_DELIVERY', label: 'Ready for Delivery', color: 'success' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'info' },
  { value: 'PICKED_UP', label: 'Picked Up', color: 'info' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
];

// Square Payment Configuration
// NOTE: Requires user setup - see .planning/phases/02-frontend-payment-form/02-01-PLAN.md user_setup section
// REACT_APP_ prefix required for Create React App / Webpack to expose env vars
export const SQUARE_APPLICATION_ID = process.env.REACT_APP_SQUARE_APPLICATION_ID || 'sandbox-preview-mode';
export const SQUARE_LOCATION_ID = process.env.REACT_APP_SQUARE_LOCATION_ID || 'preview-location';

// Determine sandbox vs production from application ID prefix
// Sandbox IDs start with "sandbox-", production start with "sq0idp-"
export const SQUARE_ENVIRONMENT = SQUARE_APPLICATION_ID?.startsWith('sandbox-') ? 'sandbox' : 'production';

// Check if Square is properly configured (not in preview mode)
export const SQUARE_CONFIGURED =
  process.env.REACT_APP_SQUARE_APPLICATION_ID &&
  process.env.REACT_APP_SQUARE_LOCATION_ID &&
  process.env.REACT_APP_SQUARE_APPLICATION_ID !== 'sandbox-preview-mode';
