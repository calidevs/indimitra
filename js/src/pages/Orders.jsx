import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { fetchAuthSession } from 'aws-amplify/auth';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_USER_ORDERS, CANCEL_ORDER } from '@/queries/operations';

const Orders = () => {
  const [userId, setUserId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          setUserId(session.tokens.idToken.payload.sub);
        } else {
          console.warn('No valid session tokens found.');
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    getUserId();
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userOrders', userId],
    queryFn: () => fetchGraphQL(GET_USER_ORDERS, { userId }),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (orderId) => fetchGraphQL(CANCEL_ORDER, { orderId }),
    onSuccess: () => {
      refetch(); // Refresh orders after cancellation
      handleCloseModal(); // Close modal after successful cancellation
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
    if (selectedOrderId) {
      mutation.mutate(selectedOrderId);
    }
  };

  const [expandedOrder, setExpandedOrder] = useState(null);

  const handleExpandClick = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Typography color="error">Error fetching orders!</Typography>;

  const orders = data?.getOrdersByUser || [];

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
                    <TableCell>{order.address}</TableCell>
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
                                <TableCell>Price</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {order.orderItems?.edges?.length > 0 ? (
                                order.orderItems.edges.map(({ node }) => (
                                  <TableRow key={node.product.name}>
                                    <TableCell>{node.product.name}</TableCell>
                                    <TableCell>${node.product.price.toFixed(2)}</TableCell>
                                    <TableCell>{node.quantity}</TableCell>
                                    <TableCell>${node.orderAmount.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} align="center">
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

      {/* Confirmation Modal */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            No, Keep Order
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained">
            Yes, Cancel Order
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Orders;
