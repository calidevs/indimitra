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
  Collapse,
  Box,
  TextField,
} from '@mui/material';
import { Edit, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_ALL_ORDERS, GET_ALL_USERS, UPDATE_ORDER_STATUS } from '@/queries/operations';

// Define getNextSaturday before it's used
const getNextSaturday = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const daysUntilNextSaturday = (6 - dayOfWeek + 7) % 7 || 7; // Ensure it's always next Saturday
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + daysUntilNextSaturday);
  nextSaturday.setHours(10, 0, 0, 0); // Default time: 10 AM
  return nextSaturday;
};

const AdminDashboard = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => fetchGraphQL(GET_ALL_ORDERS),
  });

  const { data: driversData, isLoading: loadingDrivers } = useQuery({
    queryKey: ['allDeliveryDrivers'],
    queryFn: () => fetchGraphQL(GET_ALL_USERS),
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [deliveryPartner, setDeliveryPartner] = useState('');
  const [scheduleDate, setScheduleDate] = useState(getNextSaturday());
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Filter only drivers from users
  useEffect(() => {
    if (driversData?.getAllUsers) {
      const filteredDrivers = driversData.getAllUsers.filter(
        (user) => user.type === 'DRIVER' || user.type === 'DELIVERY'
      );
      setAvailableDrivers(filteredDrivers);
    }
  }, [driversData]);

  const mutation = useMutation({
    mutationFn: ({ orderId, status, driverId, scheduleTime }) => {
      // Create mutation variables object with only necessary fields
      const variables = {
        orderId,
        status,
        driverId,
        scheduleTime,
      };

      console.log('Sending mutation with variables:', variables);
      return fetchGraphQL(UPDATE_ORDER_STATUS, variables);
    },
    onSuccess: (response) => {
      console.log('Update response:', response);
      refetch();
      setModalOpen(false);
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      setErrorMessage(`Error updating order: ${error.message}`);
    },
  });

  const handleEditClick = (order) => {
    if (!order) return;
    setSelectedOrder(order);
    setOrderStatus(order.status || '');
    setDeliveryPartner(order.deliveryPartner?.id || '');

    // Set initial schedule date either from order or default to next Saturday
    if (order.deliveryDate) {
      setScheduleDate(new Date(order.deliveryDate));
    } else {
      setScheduleDate(getNextSaturday());
    }

    setModalOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedOrder) return;

    // Validate required fields for READY_FOR_DELIVERY status
    if (orderStatus === 'READY_FOR_DELIVERY') {
      if (!deliveryPartner) {
        setErrorMessage('A delivery partner is required for READY_FOR_DELIVERY status.');
        return;
      }
      if (!scheduleDate || !(scheduleDate instanceof Date) || isNaN(scheduleDate)) {
        setErrorMessage(
          'A valid delivery schedule date is required for READY_FOR_DELIVERY status.'
        );
        return;
      }
    }

    setErrorMessage(''); // Clear error when conditions are met

    // Use the Date object directly - no need to convert to ISO string
    // The GraphQL client will handle serialization automatically
    console.log('Sending update with schedule time:', scheduleDate);

    // Create mutation variables - use the Date object directly
    const mutationVariables = {
      orderId: selectedOrder.id,
      status: orderStatus,
      driverId: orderStatus === 'READY_FOR_DELIVERY' ? Number(deliveryPartner) : null,
      scheduleTime: orderStatus === 'READY_FOR_DELIVERY' ? scheduleDate : null,
    };

    console.log('Mutation variables:', mutationVariables);
    mutation.mutate(mutationVariables);
  };

  const handleExpandClick = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Typography color="error">Error fetching orders!</Typography>;

  const orders = data?.getAllOrders ? [...data.getAllOrders].sort((a, b) => a.id - b.id) : [];

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
                  <TableCell>{order.address.address}</TableCell>
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
                              <TableCell>Item Name</TableCell>
                              <TableCell>Quantity</TableCell>
                              <TableCell>Price</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {order.orderItems?.edges?.length ? (
                              order.orderItems.edges.map(({ node }) => (
                                <TableRow key={node.product.name}>
                                  <TableCell>{node.product.name}</TableCell>
                                  <TableCell>{node.quantity}</TableCell>
                                  <TableCell>${node.product.price.toFixed(2)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} align="center">
                                  No items found
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
            <>
              <FormControl fullWidth sx={{ mt: 2 }} error={!!errorMessage && !deliveryPartner}>
                <InputLabel>Assign Delivery Partner</InputLabel>
                <Select
                  value={deliveryPartner}
                  onChange={(e) => setDeliveryPartner(e.target.value)}
                >
                  {loadingDrivers ? (
                    <MenuItem disabled>Loading drivers...</MenuItem>
                  ) : availableDrivers.length > 0 ? (
                    availableDrivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.email} - {driver.type}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No drivers available</MenuItem>
                  )}
                </Select>
              </FormControl>

              <Box sx={{ mt: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Schedule Delivery Date & Time"
                    value={scheduleDate}
                    onChange={(newValue) => setScheduleDate(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errorMessage && !scheduleDate,
                      },
                    }}
                    minDateTime={new Date()}
                  />
                </LocalizationProvider>
              </Box>
            </>
          )}

          {errorMessage && (
            <Typography color="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={
              mutation.isLoading ||
              (orderStatus === 'READY_FOR_DELIVERY' && (!deliveryPartner || !scheduleDate))
            }
            variant="contained"
            color="primary"
          >
            {mutation.isLoading ? <CircularProgress size={24} /> : 'Update Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
