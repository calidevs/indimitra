import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';

// Define GraphQL query
const GET_ALL_ORDERS = `
  query GetAllOrders {
    getAllOrders {
      id
      creator {
        email
        mobile
      }
      status
      storeId
      totalAmount
      deliveryDate
      deliveryInstructions
    }
  }
`;

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [error, setError] = useState(null);

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
      order.creator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.creator.mobile.includes(searchTerm) ||
      order.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === '' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
              placeholder="Search by email, phone or order ID"
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
                <MenuItem value="READY_FOR_DELIVERY">Ready for Delivery</MenuItem>
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
            <CardActions sx={{ justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleFetchOrders}
              >
                Fetch Orders
              </Button>
            </CardActions>
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
                  <TableCell>Customer</TableCell>
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
                      <Typography variant="body2">{order.creator.email}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.creator.mobile}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={order.status.replace(/_/g, ' ')}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(order)}>
                        <VisibilityIcon />
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
                  label={selectedOrder.status.replace(/_/g, ' ')}
                  color={getStatusColor(selectedOrder.status)}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Customer Information
                </Typography>
                <Typography variant="body2">Email: {selectedOrder.creator.email}</Typography>
                <Typography variant="body2">Phone: {selectedOrder.creator.mobile}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Order Information
                </Typography>
                <Typography variant="body2">Store ID: {selectedOrder.storeId}</Typography>
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
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
