import React, { useState } from 'react';
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
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Card,
  CardContent,
  CardActions,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  LocalShipping as LocalShippingIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  ShoppingBag as ShoppingBagIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import {
  UPDATE_ORDER_STATUS,
  GET_STORE_DRIVERS,
  GET_ALL_ORDERS,
  GET_STORES,
} from '@/queries/operations';
import graphqlService from '@/config/graphql/graphqlService';
import { ORDER_STATUSES } from '@/config/constants/constants';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [driverId, setDriverId] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Fetch orders with filters
  const {
    data: ordersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['orders', statusFilter, searchTerm],
    queryFn: () => fetchGraphQL(GET_ALL_ORDERS),
    enabled: shouldFetch, // Only fetch when shouldFetch is true
  });

  // Add this query to fetch store drivers
  const { data: driversData } = useQuery({
    queryKey: ['storeDrivers', selectedOrder?.storeId],
    queryFn: async () => {
      if (!selectedOrder?.storeId) return null;
      return await graphqlService(GET_STORE_DRIVERS, { storeId: selectedOrder.storeId });
    },
    enabled: !!selectedOrder?.storeId,
  });

  const { data: storesData = { stores: [] }, isLoading: isLoadingStores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => fetchGraphQL(GET_STORES),
    enabled: shouldFetch,
  });
  const storeMap = React.useMemo(() => {
    const map = {};
    (storesData.stores || []).forEach((store) => {
      map[store.id] = store;
    });
    return map;
  }, [storesData]);

  // Add the update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async (variables) => {
      return await graphqlService(UPDATE_ORDER_STATUS, {
        input: {
          orderId: variables.orderId,
          status: variables.status,
          deliveryInstructions: variables.deliveryInstructions || '',
          driverId: variables.driverId || null,
          scheduleTime: variables.scheduleTime || null,
        },
      });
    },
    onMutate: () => {
      setIsUpdating(true);
    },
    onSuccess: (data, variables) => {
      setIsUpdating(false);
      // Update the order in-place in the orders list
      if (ordersData && ordersData.getAllOrders) {
        ordersData.getAllOrders.forEach((order) => {
          if (order.id === variables.orderId) {
            Object.assign(order, variables);
          }
        });
      }
      setEditDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
      setDeliveryInstructions('');
      setDriverId('');
      setScheduleTime('');
      setSnackbar({
        open: true,
        message: 'Order status updated successfully!',
        severity: 'success',
      });
    },
    onError: (error) => {
      setIsUpdating(false);
      setError(error.message);
      setSnackbar({
        open: true,
        message: `Failed to update order status: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const handleFetchOrders = () => {
    setShouldFetch(true);
    refetch();
  };

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'searchTerm') {
      setSearchTerm(value);
    } else if (name === 'statusFilter') {
      setStatusFilter(value);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'READY_FOR_DELIVERY':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'READY_FOR_DELIVERY':
        return <CheckCircleIcon />;
      case 'CANCELLED':
        return <CancelIcon />;
      case 'PENDING':
        return <PendingIcon />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter orders based on search term and status filter
  const filteredOrders = ordersData?.getAllOrders?.filter((order) => {
    const matchesSearch =
      searchTerm === '' ||
      order.address?.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === '' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Add these handler functions
  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setDeliveryInstructions(order.deliveryInstructions || '');
    setEditDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    const input = {
      orderId: selectedOrder.id,
      status: newStatus,
      deliveryInstructions: deliveryInstructions,
    };

    // Add driver and schedule time for READY or READY_FOR_DELIVERY status
    if (newStatus === 'READY' || newStatus === 'READY_FOR_DELIVERY') {
      if (!driverId) {
        setSnackbar({
          open: true,
          message: 'Driver ID is required for this status',
          severity: 'error',
        });
        return;
      }
      if (!scheduleTime) {
        setSnackbar({
          open: true,
          message: 'Schedule time is required for this status',
          severity: 'error',
        });
        return;
      }
      input.driverId = parseInt(driverId);
      input.scheduleTime = scheduleTime;
    }

    updateOrderStatusMutation.mutate(input);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ShoppingBagIcon sx={{ mr: 1 }} />
          <Typography variant="h5">Orders Management</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by address or order ID"
              name="searchTerm"
              value={searchTerm}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="statusFilter"
                value={statusFilter}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="ACCEPTED">Accepted</MenuItem>
                <MenuItem value="READY_FOR_DELIVERY">Ready for Delivery</MenuItem>
                <MenuItem value="PICKED_UP">Picked Up</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleFetchOrders}
              fullWidth
              sx={{ height: '56px' }}
            >
              Fetch Orders
            </Button>
          </Grid>
        </Grid>

        {/* Orders Table */}
        {!shouldFetch ? (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" align="center" gutterBottom>
                Click "Fetch Orders" to load order data
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                This helps save resources by only loading data when needed
              </Typography>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredOrders?.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No orders found matching your criteria
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Delivery Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.address?.address || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>{storeMap[order.storeId]?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={
                          ORDER_STATUSES.find((s) => s.value === order.status)?.label ||
                          order.status.replace(/_/g, ' ')
                        }
                        color={
                          ORDER_STATUSES.find((s) => s.value === order.status)?.color || 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(order)}>
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(order)}
                        disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Order Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Order #{selectedOrder.id}
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedOrder.status)}
                  label={
                    ORDER_STATUSES.find((s) => s.value === selectedOrder.status)?.label ||
                    selectedOrder.status.replace(/_/g, ' ')
                  }
                  color={
                    ORDER_STATUSES.find((s) => s.value === selectedOrder.status)?.color || 'default'
                  }
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Order Information
                </Typography>
                <Typography variant="body2">
                  Address: {selectedOrder.address?.address || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Store: {storeMap[selectedOrder.storeId]?.name || 'N/A'} (
                  {storeMap[selectedOrder.storeId]?.address || ''})
                </Typography>
                <Typography variant="body2">
                  Total Amount: {formatCurrency(selectedOrder.totalAmount)}
                </Typography>
                <Typography variant="body2">
                  Delivery Date: {formatDate(selectedOrder.deliveryDate)}
                </Typography>
                {selectedOrder.deliveryInstructions && (
                  <Typography variant="body2">
                    Delivery Instructions: {selectedOrder.deliveryInstructions}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Order Items
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.orderItems?.edges?.map(({ node: item }) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product?.name || 'N/A'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.orderAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {ORDER_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Instructions"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
            {(newStatus === 'READY' || newStatus === 'READY_FOR_DELIVERY') && (
              <>
                {driversData?.getStoreDrivers?.length === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      No delivery agents are assigned to this store. Please assign delivery agents before updating the order status.
                    </Alert>
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Delivery Agent</InputLabel>
                    <Select
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      label="Delivery Agent"
                    >
                      {driversData?.getStoreDrivers?.length > 0 ? (
                        driversData.getStoreDrivers.map((storeDriver) => (
                          <MenuItem key={storeDriver.userId} value={storeDriver.userId}>
                            {storeDriver.driver.email} ({storeDriver.driver.mobile})
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          No delivery agents available for this store
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Schedule Time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    type="datetime-local"
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            color="primary"
            disabled={isUpdating || (newStatus === 'READY' || newStatus === 'READY_FOR_DELIVERY') && (!driverId || driversData?.getStoreDrivers?.length === 0)}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Orders;
