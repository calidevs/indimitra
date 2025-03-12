import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_ALL_ORDERS } from '@/queries/operations';
import Modal from '@/components/Modal/Modal';

const AdminDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => fetchGraphQL(GET_ALL_ORDERS),
  });

  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusUpdates, setStatusUpdates] = useState({});
  const [deliveryAssignments, setDeliveryAssignments] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmationText, setConfirmationText] = useState('');

  const handleExpandClick = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Open confirmation modal
  const openConfirmationModal = (action, message) => {
    setConfirmAction(() => action);
    setConfirmationText(message);
    setModalOpen(true);
  };

  // Handle order status change
  const handleStatusChange = (orderId, newStatus) => {
    openConfirmationModal(
      () => updateOrderStatus(orderId, newStatus),
      `Are you sure you want to update order #${orderId} to "${newStatus}"?`
    );
  };

  // Handle delivery partner assignment
  const handleDeliveryPartnerChange = (orderId, partner) => {
    openConfirmationModal(
      () => assignDeliveryPartner(orderId, partner),
      `Are you sure you want to assign delivery partner "${partner}" to order #${orderId}?`
    );
  };

  // Fake API Call Handlers
  const updateOrderStatus = (orderId, newStatus) => {
    console.log(`Updating order ${orderId} to ${newStatus}`);
    setStatusUpdates((prev) => ({ ...prev, [orderId]: newStatus }));
    setModalOpen(false);
  };

  const assignDeliveryPartner = (orderId, partner) => {
    console.log(`Assigning delivery partner ${partner} to order ${orderId}`);
    setDeliveryAssignments((prev) => ({ ...prev, [orderId]: partner }));
    setModalOpen(false);
  };

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Typography color="error">Error fetching orders!</Typography>;

  const orders = data?.getAllOrders || [];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin - All Orders
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
                <TableCell>Assign Delivery Partner</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  {/* Main Order Row */}
                  <TableRow>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.address}</TableCell>

                    {/* Editable Order Status */}
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusUpdates[order.id] || order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <MenuItem value="PENDING">Pending</MenuItem>
                          <MenuItem value="ACCEPTED">Accepted</MenuItem>
                          <MenuItem value="READY_FOR_DELIVERY">Ready for Delivery</MenuItem>
                          <MenuItem value="DELIVERED">Delivered</MenuItem>
                          <MenuItem value="CANCELLED">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>

                    {/* Assign Delivery Partner */}
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Delivery Partner</InputLabel>
                        <Select
                          value={deliveryAssignments[order.id] || ''}
                          onChange={(e) => handleDeliveryPartnerChange(order.id, e.target.value)}
                          disabled={statusUpdates[order.id] !== 'READY_FOR_DELIVERY'}
                        >
                          <MenuItem value="">Select Partner</MenuItem>
                          <MenuItem value="DP_1">John Doe</MenuItem>
                          <MenuItem value="DP_2">Jane Smith</MenuItem>
                          <MenuItem value="DP_3">Mike Johnson</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>

                    {/* Expand Icon */}
                    <TableCell>
                      <IconButton onClick={() => handleExpandClick(order.id)} size="small">
                        {expandedOrder === order.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Row for Order Items */}
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
      )}

      {/* Confirmation Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box p={4} sx={{ background: 'white', borderRadius: 2, mx: 'auto' }}>
          <Typography>{confirmationText}</Typography>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button onClick={() => setModalOpen(false)} color="secondary">
              Cancel
            </Button>
            <Button onClick={confirmAction} color="primary">
              Confirm
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
