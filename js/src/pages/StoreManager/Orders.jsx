import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TablePagination,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/useStore';
import Layout from '@/components/StoreManager/Layout';
import { useQuery } from '@tanstack/react-query';
import { fetchUserAttributes } from 'aws-amplify/auth';
import graphqlService from '@/config/graphql/graphqlService';

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'info' },
  { value: 'PREPARING', label: 'Preparing', color: 'primary' },
  { value: 'READY', label: 'Ready', color: 'success' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
];

const GET_USER_PROFILE = `
  query GetUserProfile($userId: String!) {
    getUserProfile(userId: $userId) {
      id
      email
      type
      stores {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`;

const GET_ORDERS_BY_STORE = `
  query GetOrdersByStore($storeId: Int!) {
    getOrdersByStore(storeId: $storeId) {
      id
      addressId
      cancelledAt
      cancelledByUserId
      createdByUserId
      deliveryDate
      deliveryInstructions
      paymentId
      status
      storeId
      totalAmount
      orderItems {
        edges {
          node {
            id
            inventoryId
            orderAmount
            orderId
            productId
            quantity
            product {
              id
              name
              description
            }
          }
        }
      }
    }
  }
`;

const UPDATE_ORDER_STATUS = `
  mutation UpdateOrderStatus($orderId: Int!, $status: String!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      status
    }
  }
`;

const CANCEL_ORDER = `
  mutation CancelOrder($orderId: Int!, $cancelMessage: String!, $cancelledByUserId: Int!) {
    cancelOrderById(
      orderId: $orderId, 
      cancelMessage: $cancelMessage, 
      cancelledByUserId: $cancelledByUserId
    ) {
      id
      status
    }
  }
`;

const StoreOrders = () => {
  const { userProfile } = useAuthStore();
  const [cognitoId, setCognitoId] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cancelMessage, setCancelMessage] = useState('');

  // Fetch Cognito ID on component mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
        setCognitoId(userAttributes.sub);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    getUserInfo();
  }, []);

  // Fetch user profile using Cognito ID
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['getUserProfile', cognitoId],
    queryFn: async () => {
      return await graphqlService(GET_USER_PROFILE, { userId: cognitoId });
    },
    enabled: !!cognitoId,
  });

  const storeId = profileData?.getUserProfile?.stores?.edges?.[0]?.node?.id;

  // Fetch orders using store ID
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['storeOrders', storeId],
    queryFn: async () => {
      const result = await graphqlService(GET_ORDERS_BY_STORE, { storeId });
      return result.getOrdersByStore || [];
    },
    enabled: !!storeId,
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

  const handleStatusUpdate = async () => {
    try {
      await graphqlService(UPDATE_ORDER_STATUS, {
        orderId: selectedOrder.id,
        status: newStatus,
      });
      setEditDialogOpen(false);
      refetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = async () => {
    try {
      await graphqlService(CANCEL_ORDER, {
        orderId: selectedOrder.id,
        cancelMessage: cancelMessage,
        cancelledByUserId: userProfile.id,
      });
      setCancelDialogOpen(false);
      setCancelMessage('');
      refetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    return ORDER_STATUSES.find((s) => s.value === status)?.color || 'default';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredOrders = React.useMemo(() => {
    if (!ordersData) return [];

    let filtered = [...ordersData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(searchTerm) ||
          (order.deliveryInstructions || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'totalAmount') {
        comparison = a[sortField] - b[sortField];
      } else {
        comparison = String(a[sortField] || '').localeCompare(String(b[sortField] || ''));
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [ordersData, searchTerm, statusFilter, sortField, sortOrder]);

  const paginatedOrders = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [filteredOrders, page, rowsPerPage]);

  if (profileLoading || ordersLoading) {
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

  if (ordersError) {
    return (
      <Layout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {ordersError.message}
        </Alert>
      </Layout>
    );
  }

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

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                <TextField
                  select
                  fullWidth
                  label="Filter by Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterIcon />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  {ORDER_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Total Orders: {filteredOrders.length}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {filteredOrders.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No orders found.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleSort('id')}
                    >
                      Order ID
                      <SortIcon
                        sx={{
                          ml: 1,
                          transform:
                            sortField === 'id' && sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>Delivery Instructions</TableCell>
                  <TableCell>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleSort('totalAmount')}
                    >
                      Total
                      <SortIcon
                        sx={{
                          ml: 1,
                          transform:
                            sortField === 'totalAmount' && sortOrder === 'desc'
                              ? 'rotate(180deg)'
                              : 'none',
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <TableRow>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.deliveryInstructions || 'N/A'}</TableCell>
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
                        <Tooltip title="Edit Order">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(order)}
                            disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel Order">
                          <IconButton
                            size="small"
                            onClick={() => handleCancelClick(order)}
                            disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
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
                        <TableCell colSpan={6}>
                          <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Order Items:
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Product</TableCell>
                                  <TableCell>Quantity</TableCell>
                                  <TableCell>Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {order.orderItems.edges.map(({ node: item }) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.product.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>₹{item.orderAmount}</TableCell>
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
            <TablePagination
              component="div"
              count={filteredOrders.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
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
            <TextField
              fullWidth
              label="Cancellation Reason"
              value={cancelMessage}
              onChange={(e) => setCancelMessage(e.target.value)}
              multiline
              rows={3}
              sx={{ mt: 2 }}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>No</Button>
            <Button
              onClick={handleCancelOrder}
              variant="contained"
              color="error"
              disabled={!cancelMessage.trim()}
            >
              Yes, Cancel Order
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default StoreOrders;
