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
