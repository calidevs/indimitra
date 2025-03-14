import React, { useState } from 'react';
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
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Box,
  Collapse,
} from '@mui/material';
import { Edit, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_ALL_ORDERS } from '@/queries/operations';

const AdminDashboard = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => fetchGraphQL(GET_ALL_ORDERS),
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [deliveryPartner, setDeliveryPartner] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const mutation = useMutation({
    mutationFn: ({ orderId, status, driver }) =>
      fetchGraphQL(UPDATE_ORDER_STATUS, { orderId, status, driver }),
    onSuccess: () => {
      refetch();
      setModalOpen(false);
    },
  });

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setOrderStatus(order.status);
    setDeliveryPartner(order.deliveryPartner || '');
    setModalOpen(true);
  };

  const handleConfirm = () => {
    mutation.mutate({
      orderId: selectedOrder.id,
      status: orderStatus,
      driver: orderStatus === 'READY_FOR_DELIVERY' ? deliveryPartner : null,
    });
  };

  const handleExpandClick = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Typography color="error">Error fetching orders!</Typography>;

  const orders = data?.getAllOrders || [];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin - All Orders
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
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
                <TableRow>
                  <TableCell>
                    <IconButton onClick={() => handleExpandClick(order.id)} size="small">
                      {expandedOrder === order.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.address}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditClick(order)}>
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit Order #{selectedOrder?.id}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
              <MenuItem value="ORDER_PLACED">Order Placed</MenuItem>
              <MenuItem value="ACCEPTED">Accepted</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
              <MenuItem value="READY_FOR_DELIVERY">Ready for Delivery</MenuItem>
              <MenuItem value="COMPLETE">Complete</MenuItem>
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              <MenuItem value="PICKED_UP">Picked Up</MenuItem>
              <MenuItem value="DELIVERED">Delivered</MenuItem>
            </Select>
          </FormControl>
          {orderStatus === 'READY_FOR_DELIVERY' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Assign Delivery Partner</InputLabel>
              <Select value={deliveryPartner} onChange={(e) => setDeliveryPartner(e.target.value)}>
                <MenuItem value="">Select Partner</MenuItem>
                <MenuItem value="DP_1">John Doe</MenuItem>
                <MenuItem value="DP_2">Jane Smith</MenuItem>
                <MenuItem value="DP_3">Mike Johnson</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
