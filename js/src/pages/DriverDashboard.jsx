import React, { useState, useEffect, useReducer } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Modal,
  Box,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  Divider,
  Paper,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { fetchAuthSession } from 'aws-amplify/auth';
import fetchGraphQL from '@/config/graphql/graphqlService';
import {
  GET_DELIVERIES_BY_DRIVER,
  UPDATE_ORDER_STATUS,
  GET_USER_PROFILE,
  CANCEL_ORDER,
} from '@/queries/operations';
import useStore, { useAuthStore } from '@/store/useStore';

const DriverDashboard = () => {
  // Force re-render function
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cognitoId, setCognitoId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { userProfile, setUserProfile } = useAuthStore();
  const getLatestProfile = () => useAuthStore.getState().userProfile;

  // Fetch user ID from Cognito
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

  console.log('Delivery Partner Dashboard State:', {
    directStoreProfile,
    zustandHookProfile: userProfile,
    apiProfile: profileData?.getUserProfile,
    using: effectiveProfile,
  });

  // Fetch deliveries assigned to this driver
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['driverDeliveries', effectiveProfile?.id],
    queryFn: () =>
      effectiveProfile?.id
        ? fetchGraphQL(GET_DELIVERIES_BY_DRIVER, { driverId: effectiveProfile.id })
        : null,
    enabled: !!effectiveProfile?.id,
  });

  // Mutation to update order status
  const updateStatusMutation = useMutation({
    mutationFn: (variables) => fetchGraphQL(UPDATE_ORDER_STATUS, variables),
    onSuccess: () => {
      refetch(); // Refresh the deliveries after updating status
      setModalOpen(false);
      setCancelReason('');
      setShowCancelReason(false);
    },
    onError: (error) => {
      console.error('Failed to update order status:', error);
    },
  });

  // Mutation to cancel order
  const cancelOrderMutation = useMutation({
    mutationFn: (variables) =>
      fetchGraphQL(CANCEL_ORDER, {
        orderId: variables.orderId,
        cancelMessage: variables.cancelMessage,
        cancelledByUserId: effectiveProfile?.id,
      }),
    onSuccess: () => {
      refetch(); // Refresh the deliveries after cancelling
      setModalOpen(false);
      setCancelReason('');
      setShowCancelReason(false);
    },
    onError: (error) => {
      console.error('Failed to cancel order:', error);
    },
  });

  const handleOpenModal = (delivery) => {
    setSelectedDelivery(delivery);
    setSelectedStatus(delivery.orderStatus || delivery.status);
    setModalOpen(true);
    setShowCancelReason(false);
    setCancelReason('');
  };

  const handleStatusChange = (event) => {
    const newStatus = event.target.value;
    setSelectedStatus(newStatus);

    // Show cancel reason field if status is changed to CANCELLED
    if (newStatus === 'CANCELLED') {
      setShowCancelReason(true);
    } else {
      setShowCancelReason(false);
    }
  };

  const handleUpdateStatus = () => {
    if (!selectedDelivery || !selectedStatus) return;

    // Get scheduleTime from the order's deliveryDate
    const orderScheduleTime = selectedDelivery.schedule;

    if (selectedStatus === 'CANCELLED') {
      // Use cancel order mutation for cancellations
      cancelOrderMutation.mutate({
        orderId: selectedDelivery.orderId,
        cancelMessage: cancelReason,
      });
    } else {
      // Use update status mutation for other status changes
      updateStatusMutation.mutate({
        orderId: selectedDelivery.orderId,
        status: selectedStatus,
        driverId: effectiveProfile?.id,
        scheduleTime: orderScheduleTime,
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 0) {
      setStatusFilter('ALL');
    } else if (newValue === 1) {
      setStatusFilter('READY_FOR_DELIVERY');
    } else if (newValue === 2) {
      setStatusFilter('PICKED_UP');
    } else if (newValue === 3) {
      setStatusFilter('DELIVERED');
    }
  };

  // Filter deliveries based on search term and status filter
  const filteredDeliveries = React.useMemo(() => {
    if (!data?.getDeliveriesByDriver) return [];

    return data.getDeliveriesByDriver.filter((delivery) => {
      // Filter by status
      if (statusFilter !== 'ALL' && delivery.status !== statusFilter) {
        return false;
      }

      // Filter by search term (order ID or address)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const orderIdMatch = delivery.orderId.toString().includes(searchLower);
        const addressMatch = delivery.address?.toLowerCase().includes(searchLower);
        return orderIdMatch || addressMatch;
      }

      return true;
    });
  }, [data?.getDeliveriesByDriver, statusFilter, searchTerm]);

  // Show loading while fetching profile or deliveries
  if (profileLoading || (isLoading && effectiveProfile?.id))
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (profileError) return <Typography color="error">Error fetching user profile!</Typography>;

  if (error && effectiveProfile?.id)
    return <Typography color="error">Error fetching deliveries!</Typography>;

  const deliveries = data?.getDeliveriesByDriver || [];

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'READY_FOR_DELIVERY':
        return 'primary';
      case 'PICKED_UP':
        return 'info';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'READY_FOR_DELIVERY':
        return <PendingIcon />;
      case 'PICKED_UP':
        return <ShippingIcon />;
      case 'DELIVERED':
        return <CheckCircleIcon />;
      case 'CANCELLED':
        return <CancelIcon />;
      default:
        return null;
    }
  };

  // Count deliveries by status
  const getStatusCount = (status) => {
    if (!data?.getDeliveriesByDriver) return 0;
    return data.getDeliveriesByDriver.filter((d) => d.status === status).length;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography variant="h4" fontWeight="500" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Delivery Partner Dashboard
        </Typography>
        <TextField
          size="small"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 250 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => {
            setActiveTab(newValue);
            if (newValue === 0) {
              setStatusFilter('ALL');
            } else if (newValue === 1) {
              setStatusFilter('READY_FOR_DELIVERY');
            } else if (newValue === 2) {
              setStatusFilter('PICKED_UP');
            } else if (newValue === 3) {
              setStatusFilter('DELIVERED');
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 120,
              textTransform: 'none',
              fontSize: '0.875rem',
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                All Orders
                <Badge badgeContent={deliveries.length} color="primary" sx={{ ml: 2 }} />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Ready
                <Badge
                  badgeContent={getStatusCount('READY_FOR_DELIVERY')}
                  color="primary"
                  sx={{ ml: 2 }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                In Transit
                <Badge badgeContent={getStatusCount('PICKED_UP')} color="info" sx={{ ml: 2 }} />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Delivered
                <Badge badgeContent={getStatusCount('DELIVERED')} color="success" sx={{ ml: 2 }} />
              </Box>
            }
          />
        </Tabs>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery) => (
            <Grid item xs={12} sm={6} md={4} key={delivery.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handleOpenModal(delivery)}
              >
                <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 2.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 500 }}
                    >
                      Order #{delivery.orderId}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(delivery.status)}
                      label={delivery.status.replace(/_/g, ' ')}
                      color={getStatusColor(delivery.status)}
                      size="small"
                      sx={{
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        height: { xs: 24, sm: 28 },
                        borderRadius: 1.5,
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {new Date(delivery.schedule).toLocaleString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <LocationIcon
                      fontSize="small"
                      sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ flexGrow: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {delivery?.order?.address?.address || 'No address provided'}
                    </Typography>
                  </Box>

                  {delivery.pickedUpTime && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, mb: 1 }}
                    >
                      Picked up: {new Date(delivery.pickedUpTime).toLocaleString()}
                    </Typography>
                  )}

                  {delivery.deliveredTime && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      Delivered: {new Date(delivery.deliveredTime).toLocaleString()}
                    </Typography>
                  )}

                  {delivery.status === 'CANCELLED' && delivery.order?.cancelMessage && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          fontStyle: 'italic',
                          bgcolor: 'error.lightest',
                          p: 1,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <CancelIcon fontSize="small" sx={{ mr: 0.5, flexShrink: 0 }} />
                        <span style={{ lineHeight: 1 }}>
                          Cancellation Reason: "{delivery.order.cancelMessage}"
                        </span>
                      </Typography>
                    </Box>
                  )}

                  {delivery.comments && delivery.status !== 'CANCELLED' && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          fontStyle: 'italic',
                          display: 'flex',
                          alignItems: 'flex-start',
                        }}
                      >
                        <span>"{delivery.comments}"</span>
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Deliveries Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No deliveries match your search criteria.'
                  : 'You have no deliveries assigned at this time.'}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Delivery Details Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="delivery-details-modal"
      >
        <Box
          sx={{
            width: { xs: '95%', sm: '90%', md: 500 },
            bgcolor: 'background.paper',
            p: { xs: 2, sm: 3 },
            mx: 'auto',
            mt: { xs: 2, sm: 5 },
            borderRadius: 2,
            boxShadow: 3,
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          {selectedDelivery && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight="500"
                  sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Order #{selectedDelivery.orderId}
                </Typography>
                <IconButton
                  edge="end"
                  aria-label="close"
                  onClick={() => setModalOpen(false)}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Chip
                  icon={getStatusIcon(selectedDelivery.status)}
                  label={selectedDelivery.status.replace(/_/g, ' ')}
                  color={getStatusColor(selectedDelivery.status)}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  DELIVERY ADDRESS
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {selectedDelivery.order?.address?.address ||
                      selectedDelivery.address ||
                      'No address provided'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  SCHEDULED DELIVERY
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {new Date(selectedDelivery.schedule).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {selectedDelivery.pickedUpTime && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    PICKED UP
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ShippingIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {new Date(selectedDelivery.pickedUpTime).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}

              {selectedDelivery.deliveredTime && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    DELIVERED
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {new Date(selectedDelivery.deliveredTime).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}

              {selectedDelivery.status === 'CANCELLED' && selectedDelivery.order?.cancelMessage && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    CANCELLATION REASON
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'error.lightest',
                      borderRadius: 1,
                      borderLeft: '3px solid',
                      borderColor: 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <CancelIcon color="error" sx={{ flexShrink: 0 }} />
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        color: 'error.main',
                        lineHeight: 1.2,
                      }}
                    >
                      {selectedDelivery.order.cancelMessage}
                    </Typography>
                  </Box>
                </Box>
              )}

              {selectedDelivery.comments && selectedDelivery.status !== 'CANCELLED' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    COMMENTS
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(0, 0, 0, 0.03)',
                      borderRadius: 1,
                      borderLeft: '3px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      {selectedDelivery.comments}
                    </Typography>
                  </Box>
                </Box>
              )}

              {selectedDelivery.photo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    DELIVERY PROOF
                  </Typography>
                  <img
                    src={selectedDelivery.photo}
                    alt="Delivery Proof"
                    style={{ width: '100%', borderRadius: 4 }}
                  />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                UPDATE STATUS
              </Typography>

              {/* Update Order Status Dropdown */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Select value={selectedStatus} onChange={handleStatusChange} size="small">
                  <MenuItem value="READY_FOR_DELIVERY">Ready for Delivery</MenuItem>
                  <MenuItem value="PICKED_UP">Picked Up</MenuItem>
                  <MenuItem value="DELIVERED">Delivered</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>

              {showCancelReason && (
                <TextField
                  fullWidth
                  label="Cancellation Reason"
                  multiline
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                  size="small"
                />
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  onClick={handleUpdateStatus}
                  variant="contained"
                  color="primary"
                  disabled={
                    (selectedStatus === 'CANCELLED'
                      ? cancelOrderMutation.isLoading
                      : updateStatusMutation.isLoading) ||
                    selectedStatus === selectedDelivery.orderStatus ||
                    (selectedStatus === 'CANCELLED' && !cancelReason)
                  }
                  sx={{ minWidth: 120 }}
                >
                  {(
                    selectedStatus === 'CANCELLED'
                      ? cancelOrderMutation.isLoading
                      : updateStatusMutation.isLoading
                  )
                    ? 'Updating...'
                    : 'Update'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Container>
  );
};

export default DriverDashboard;
