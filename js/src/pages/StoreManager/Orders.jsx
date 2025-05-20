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
  Divider,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/useStore';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { generateClient } from 'aws-amplify/api';
import {
  GET_USER_PROFILE,
  GET_ORDERS_BY_STORE,
  GET_STORE_DRIVERS,
  UPDATE_ORDER_STATUS,
  CANCEL_ORDER,
} from '@/queries/operations';
import Layout from '@/components/StoreManager/Layout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchUserAttributes } from 'aws-amplify/auth';
import graphqlService from '@/config/graphql/graphqlService';

const client = generateClient();

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'ORDER_PLACED', label: 'Order Placed', color: 'info' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'primary' },
  { value: 'READY_FOR_DELIVERY', label: 'Ready for Delivery', color: 'success' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'info' },
  { value: 'PICKED_UP', label: 'Picked Up', color: 'info' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
];

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
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [driverId, setDriverId] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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
  const userId = profileData?.getUserProfile?.id;

  // Fetch drivers for the store
  const {
    data: driversData,
    isLoading: driversLoading,
    error: driversError,
    refetch: refetchDrivers,
  } = useQuery({
    queryKey: ['storeDrivers', storeId],
    queryFn: async () => {
      return await graphqlService(GET_STORE_DRIVERS, { storeId });
    },
    enabled: !!storeId,
  });

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

  // Update order status mutation
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
    onSuccess: () => {
      refetchOrders();
      setEditDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
      setDeliveryInstructions('');
      setDriverId('');
      setScheduleTime('');
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setDeliveryInstructions(order.deliveryInstructions || '');
    setEditDialogOpen(true);
  };

  const handleCancelClick = (order) => {
    setSelectedOrder(order);
    setCancelDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    try {
      const input = {
        orderId: selectedOrder.id,
        status: newStatus,
        deliveryInstructions: deliveryInstructions,
      };

      // Add driver and schedule time for READY or READY_FOR_DELIVERY status
      if (newStatus === 'READY' || newStatus === 'READY_FOR_DELIVERY') {
        if (!driverId) {
          setError('Driver ID is required for this status');
          return;
        }
        if (!scheduleTime) {
          setError('Schedule time is required for this status');
          return;
        }
        input.driverId = parseInt(driverId);
        input.scheduleTime = scheduleTime;
      }

      await updateOrderStatusMutation.mutateAsync(input);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = async () => {
    try {
      if (!userId) {
        setError('User profile not found. Please try again.');
        return;
      }

      await graphqlService(CANCEL_ORDER, {
        orderId: selectedOrder.id,
        cancelMessage: cancelMessage,
        cancelledByUserId: userId,
      });
      setCancelDialogOpen(false);
      setCancelMessage('');
      refetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = async (order) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*'; // Accept any file type
    input.onchange = async () => {
      try {
        const file = input.files[0];
        if (!file) return;

        // Get upload URL for PUT operation
        const baseUrl = window.location.href?.includes('http://localhost')
          ? 'http://127.0.0.1:8000'
          : 'https://indimitra.com';

        // Log the original filename for debugging
        console.log('Original filename:', file.name);

        const res = await fetch(
          `${baseUrl}/s3/generate-upload-url?file_name=${encodeURIComponent(file.name)}&order_id=${order.id}`
        );
        if (!res.ok) {
          throw new Error('Failed to get upload URL');
        }
        const { upload_url, content_type, file_name, key } = await res.json();

        // Log the generated filename for debugging
        console.log('Generated filename:', file_name);

        // Upload file to S3 using PUT with exact same Content-Type
        const uploadRes = await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': content_type,
          },
          body: file,
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          console.error('Upload failed:', errorText);
          throw new Error('Failed to upload file');
        }

        // Store the bill URL in the order
        const billUrlRes = await fetch(
          `${baseUrl}/orders/${order.id}/set-bill-url?file_name=${encodeURIComponent(file_name)}`,
          {
            method: 'POST',
          }
        );

        if (!billUrlRes.ok) {
          throw new Error('Failed to update bill URL');
        }

        // After successful upload and bill URL update, try to get the view URL
        const viewRes = await fetch(
          `${baseUrl}/s3/generate-view-url?bill_key=${encodeURIComponent(key)}`
        );

        if (viewRes.ok) {
          setSnackbar({
            open: true,
            message: 'File uploaded and verified successfully!',
            severity: 'success',
          });
        } else {
          setSnackbar({
            open: true,
            message: 'File uploaded but verification failed. Please try viewing the file.',
            severity: 'warning',
          });
        }
      } catch (err) {
        console.error('Upload error:', err);
        setSnackbar({
          open: true,
          message: 'Failed to upload file. Please try again.',
          severity: 'error',
        });
      }
    };
    input.click();
  };

  const handleView = async (order) => {
    try {
      // Get view URL for GET operation
      const baseUrl = window.location.href?.includes('http://localhost')
        ? 'http://127.0.0.1:8000'
        : 'https://indimitra.com';

      let viewUrl = null;
      let fileName = null;

      // If order has a bill_url, use it directly
      if (order.bill_url) {
        console.log('Using stored bill URL:', order.bill_url);
        const res = await fetch(
          `${baseUrl}/s3/generate-view-url?bill_key=${encodeURIComponent(order.bill_url)}`
        );
        if (res.ok) {
          const data = await res.json();
          viewUrl = data.view_url;
          fileName = data.file_name;
        }
      }

      // If no bill_url or file not found, try the old method
      if (!viewUrl) {
        console.log('No stored bill URL found, trying common extensions');
        const commonExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
        for (const ext of commonExtensions) {
          const res = await fetch(
            `${baseUrl}/s3/generate-view-url?order_id=${order.id}&file_name=receipt${ext}`
          );
          if (res.ok) {
            const data = await res.json();
            viewUrl = data.view_url;
            fileName = data.file_name;
            break;
          }
        }
      }

      if (!viewUrl) {
        setSnackbar({
          open: true,
          message: 'No file found for this order.',
          severity: 'warning',
        });
        return;
      }

      // Create a temporary link element to handle the download with the correct filename
      const link = document.createElement('a');
      link.href = viewUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to view file. Please try again.',
        severity: 'error',
      });
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

  if (profileLoading || ordersLoading || driversLoading) {
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

  if (ordersError || driversError) {
    return (
      <Layout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {ordersError?.message || driversError?.message || 'An error occurred'}
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
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
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
                        <Tooltip title="Upload File">
                          <IconButton
                            size="small"
                            onClick={() => handleUpload(order)}
                            disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                          >
                            <UploadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View File">
                          <IconButton size="small" onClick={() => handleView(order)}>
                            <VisibilityIcon />
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
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={6}>
                                <Typography> Email: {order?.creator?.email}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography>Phone: {order?.creator?.mobile}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography>Delivery Address: {order?.address?.address}</Typography>
                              </Grid>
                              <Grid item xs={12} sx={{ marginTop: 2 }}>
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
                                        <TableCell>${item.orderAmount}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Grid>
                            </Grid>
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
              {newStatus === 'READY_FOR_DELIVERY' && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Delivery Agent</InputLabel>
                      <Select
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        label="Delivery Agent"
                      >
                        {driversData?.getStoreDrivers?.map((storeDriver) => (
                          <MenuItem key={storeDriver.userId} value={storeDriver.userId}>
                            {storeDriver.driver.email} ({storeDriver.driver.mobile})
                          </MenuItem>
                        ))}
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
              disabled={updateOrderStatusMutation.isLoading}
            >
              {updateOrderStatusMutation.isLoading ? 'Updating...' : 'Update'}
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

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default StoreOrders;
