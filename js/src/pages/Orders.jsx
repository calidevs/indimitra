import React, { useState, useEffect, useReducer } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
  Collapse,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { fetchAuthSession } from 'aws-amplify/auth';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_USER_ORDERS, CANCEL_ORDER, GET_USER_PROFILE } from '@/queries/operations';
import useStore, { useAuthStore } from '@/store/useStore';

const Orders = () => {
  // Force re-render function
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [cognitoId, setCognitoId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelMessage, setCancelMessage] = useState('');

  // Get zustand state and functions
  const { userProfile, setUserProfile } = useAuthStore();
  const getLatestProfile = () => useAuthStore.getState().userProfile;

  // Fetch Cognito ID from session
  useEffect(() => {
    const getUserId = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          const id = session.tokens.idToken.payload.sub;
          console.log('Fetched Cognito ID:', id);
          setCognitoId(id);
        } else {
          console.warn('No valid session tokens found.');
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    getUserId();
  }, []);

  // Fetch user profile with Cognito ID and store in Zustand
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['getUserProfile', cognitoId],
    queryFn: async () => {
      console.log('Fetching user profile with cognitoId:', cognitoId);
      const response = await fetchGraphQL(GET_USER_PROFILE, { userId: cognitoId });
      console.log('User profile API response:', response);

      // Set profile data immediately when we get it
      if (response?.getUserProfile) {
        console.log('Setting profile in store:', response.getUserProfile);
        setUserProfile(response.getUserProfile);

        // Force refresh after a small delay
        setTimeout(() => {
          console.log('Current profile in store:', getLatestProfile());
          forceUpdate();
        }, 200);
      }

      return response;
    },
    enabled: !!cognitoId,
    onError: (error) => {
      console.error('Error fetching user profile:', error);
    },
  });

  // Get the effective profile from any available source
  const directStoreProfile = getLatestProfile();
  const effectiveProfile = directStoreProfile || userProfile || profileData?.getUserProfile;

  console.log('Orders Page State:', {
    directStoreProfile,
    zustandHookProfile: userProfile,
    apiProfile: profileData?.getUserProfile,
    using: effectiveProfile,
  });

  // Fetch orders using the user's numeric ID
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch,
  } = useQuery({
    queryKey: ['userOrders', effectiveProfile?.id],
    queryFn: () => fetchGraphQL(GET_USER_ORDERS, { userId: effectiveProfile.id }),
    enabled: !!effectiveProfile?.id,
  });

  const mutation = useMutation({
    mutationFn: (variables) =>
      fetchGraphQL(CANCEL_ORDER, {
        orderId: variables.orderId,
        cancelMessage: variables.cancelMessage,
        cancelledByUserId: effectiveProfile.id,
      }),
    onSuccess: () => {
      refetch();
      handleCloseModal();
      setCancelMessage('');
    },
  });

  const handleOpenModal = (orderId) => {
    setSelectedOrderId(orderId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOrderId(null);
  };

  const handleConfirmCancel = () => {
    if (selectedOrderId && cancelMessage.trim()) {
      mutation.mutate({
        orderId: selectedOrderId,
        cancelMessage: cancelMessage.trim(),
      });
    }
  };

  const handleExpandClick = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Show loading while fetching profile or orders
  if (profileLoading || (ordersLoading && effectiveProfile?.id))
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (profileError) return <Typography color="error">Error fetching user profile!</Typography>;

  if (ordersError && effectiveProfile?.id)
    return <Typography color="error">Error fetching orders!</Typography>;

  const orders = ordersData?.getOrdersByUser || [];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>

      {orders.length === 0 ? (
        <Typography>No orders found!</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow onClick={() => handleExpandClick(order.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.address.address}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={
                          order.status === 'COMPLETE'
                            ? 'success'
                            : order.status === 'PENDING' || order.status === 'ORDER_PLACED'
                              ? 'warning'
                              : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(order.id);
                        }}
                        disabled={!['PENDING', 'ORDER_PLACED'].includes(order.status)}
                      >
                        Cancel
                      </Button>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExpandClick(order.id);
                        }}
                        size="small"
                      >
                        {expandedOrder === order.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Row for Order Items */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={expandedOrder === order.id} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            Order Items
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Unit Price</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {order.orderItems?.edges?.length > 0 ? (
                                order.orderItems.edges.map(({ node }) => {
                                  const inventoryItem = node.product.inventoryItems?.edges[0]?.node;
                                  return (
                                    <TableRow key={node.product.id}>
                                      <TableCell>{node.product.name}</TableCell>
                                      <TableCell>{node.product.category.name}</TableCell>
                                      <TableCell>
                                        ${inventoryItem?.price.toFixed(2)}
                                        {inventoryItem && (
                                          <Typography
                                            variant="caption"
                                            display="block"
                                            color="textSecondary"
                                          >
                                            ({inventoryItem.measurement} {inventoryItem.unit})
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell>{node.quantity}</TableCell>
                                      <TableCell>${node.orderAmount.toFixed(2)}</TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} align="center">
                                    No items found for this order.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Updated Confirmation Modal */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="cancelMessage"
            label="Reason for Cancellation"
            type="text"
            fullWidth
            variant="outlined"
            value={cancelMessage}
            onChange={(e) => setCancelMessage(e.target.value)}
            error={openModal && !cancelMessage.trim()}
            helperText={
              openModal && !cancelMessage.trim() ? 'Please provide a reason for cancellation' : ''
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            No, Keep Order
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={!cancelMessage.trim()}
          >
            Yes, Cancel Order
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Orders;
