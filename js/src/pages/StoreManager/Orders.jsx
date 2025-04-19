import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/useStore';
import { UPDATE_ORDER_STATUS, CANCEL_ORDER } from '@/queries/operations';
import Layout from '@/components/StoreManager/Layout';
import fetchGraphQL from '@/config/graphql/graphqlService';

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'READY_FOR_DELIVERY', label: 'Ready for Delivery' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// Define the GraphQL query for getting store orders
const GET_STORE_ORDERS = `
  query GetOrdersByStore($storeId: Int!) {
    getOrdersByStore(storeId: $storeId) {
      id
      address { 
        id
        address
        isPrimary
      }
      status
      totalAmount
      deliveryDate
      createdAt
      user {
        id
        name
      }
      orderItems {
        id
        quantity
        price
        product {
          id
          name
        }
      }
    }
  }
`;

const StoreOrders = () => {
  const { userProfile } = useAuthStore();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [storeId, setStoreId] = useState(null);

  // Fetch store ID when profile is available
  useEffect(() => {
    const fetchStoreId = async () => {
      if (userProfile?.id) {
        try {
          const response = await fetchGraphQL(
            `
            query GetStoreInfo($managerId: Int!) {
              storesByManager(managerUserId: $managerId) {
                id
                name
              }
            }
          `,
            { managerId: userProfile.id }
          );

          if (response?.storesByManager && response.storesByManager.length > 0) {
            setStoreId(response.storesByManager[0].id);
          } else {
            setError('No store found for this manager');
          }
        } catch (error) {
          console.error('Error fetching store ID:', error);
          setError('Failed to fetch store information');
        }
      }
    };

    fetchStoreId();
  }, [userProfile]);

  // Fetch orders for the store
  const {
    data: ordersData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['storeOrders', storeId],
    queryFn: () => fetchGraphQL(GET_STORE_ORDERS, { storeId }),
    enabled: !!storeId,
  });

  // Mutation for updating order status
  const updateStatusMutation = useMutation({
    mutationFn: (variables) =>
      fetchGraphQL(UPDATE_ORDER_STATUS, {
        orderId: variables.orderId,
        status: variables.status,
      }),
    onSuccess: () => {
      refetch();
      setEditDialogOpen(false);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Mutation for canceling order
  const cancelMutation = useMutation({
    mutationFn: (variables) =>
      fetchGraphQL(CANCEL_ORDER, {
        orderId: variables.orderId,
        cancelMessage: 'Cancelled by store manager',
        cancelledByUserId: userProfile?.id,
      }),
    onSuccess: () => {
      refetch();
      setCancelDialogOpen(false);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setEditDialogOpen(true);
  };

  const handleCancelClick = (order) => {
    setSelectedOrder(order);
    setCancelDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: newStatus,
    });
  };

  const handleCancelOrder = () => {
    cancelMutation.mutate({
      orderId: selectedOrder.id,
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      PROCESSING: 'info',
      READY_FOR_DELIVERY: 'primary',
      OUT_FOR_DELIVERY: 'secondary',
      DELIVERED: 'success',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  if (isLoading) {
    return (
      <Layout>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (queryError) {
    return (
      <Layout>
        <Alert severity="error">{queryError.message}</Alert>
      </Layout>
    );
  }

  const orders = ordersData?.getOrdersByStore || [];

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Store Orders
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {orders.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No orders found for this store.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <TableRow>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{order.user?.name}</TableCell>
                      <TableCell>₹{order.totalAmount}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            ORDER_STATUSES.find((s) => s.value === order.status)?.label ||
                            order.status
                          }
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(order)}
                          disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleCancelClick(order)}
                          disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                        >
                          <CancelIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setExpandedOrder(expandedOrder === order.id ? null : order.id)
                          }
                        >
                          {expandedOrder === order.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {expandedOrder === order.id && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Order Items:
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Product</TableCell>
                                  <TableCell>Quantity</TableCell>
                                  <TableCell>Price</TableCell>
                                  <TableCell>Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {order.orderItems.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.product.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>₹{item.price}</TableCell>
                                    <TableCell>₹{item.quantity * item.price}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Edit Status Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogContent>
            <TextField
              select
              fullWidth
              label="Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              sx={{ mt: 2 }}
            >
              {ORDER_STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} variant="contained" color="primary">
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel this order? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>No</Button>
            <Button onClick={handleCancelOrder} variant="contained" color="error">
              Yes, Cancel Order
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default StoreOrders;
