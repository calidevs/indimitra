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
} from '@mui/material';
import { fetchAuthSession } from 'aws-amplify/auth';
import fetchGraphQL from '@/config/graphql/graphqlService';
import {
  GET_DELIVERIES_BY_DRIVER,
  UPDATE_ORDER_STATUS,
  GET_USER_PROFILE,
} from '@/queries/operations';
import useStore, { useAuthStore } from '@/store/useStore';

const DriverDashboard = () => {
  // Force re-render function
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cognitoId, setCognitoId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

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

  console.log('Driver Dashboard State:', {
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
  const mutation = useMutation({
    mutationFn: (variables) => fetchGraphQL(UPDATE_ORDER_STATUS, variables),
    onSuccess: () => {
      refetch(); // Refresh the deliveries after updating status
      setModalOpen(false);
    },
    onError: (error) => {
      console.error('Failed to update order status:', error);
    },
  });

  const handleOpenModal = (delivery) => {
    setSelectedDelivery(delivery);
    setSelectedStatus(delivery.orderStatus || delivery.status);
    setModalOpen(true);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleUpdateStatus = () => {
    if (!selectedDelivery || !selectedStatus) return;

    mutation.mutate({
      orderId: selectedDelivery.orderId,
      status: selectedStatus,
      driverId: effectiveProfile?.id,
      scheduleTime: selectedDelivery.schedule,
    });
  };

  // Show loading while fetching profile or deliveries
  if (profileLoading || (isLoading && effectiveProfile?.id))
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (profileError) return <Typography color="error">Error fetching user profile!</Typography>;

  if (error && effectiveProfile?.id)
    return <Typography color="error">Error fetching deliveries!</Typography>;

  const deliveries = data?.getDeliveriesByDriver || [];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Driver - Assigned Deliveries
      </Typography>

      <Grid container spacing={3}>
        {deliveries.length > 0 ? (
          deliveries.map((delivery) => (
            <Grid item xs={12} sm={6} md={4} key={delivery.id}>
              <Card
                sx={{ cursor: 'pointer' }}
                onClick={() => handleOpenModal(delivery)} // ✅ Whole card clickable
              >
                <CardContent>
                  <Typography variant="h6">Order #{delivery.orderId}</Typography>
                  <Typography>Status: {delivery.orderStatus}</Typography>
                  <Typography>Scheduled: {new Date(delivery.schedule).toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography sx={{ mx: 'auto', mt: 2 }}>No deliveries assigned.</Typography>
        )}
      </Grid>

      {/* Delivery Details Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{ width: 400, bgcolor: 'white', p: 4, mx: 'auto', mt: 5 }}>
          {selectedDelivery && (
            <>
              <Typography variant="h6">Order #{selectedDelivery.orderId}</Typography>
              <Typography>
                Scheduled: {new Date(selectedDelivery.schedule).toLocaleString()}
              </Typography>
              <Typography>
                Picked Up:{' '}
                {selectedDelivery.pickedUpTime
                  ? new Date(selectedDelivery.pickedUpTime).toLocaleString()
                  : 'Not Picked Up'}
              </Typography>
              <Typography>
                Delivered:{' '}
                {selectedDelivery.deliveredTime
                  ? new Date(selectedDelivery.deliveredTime).toLocaleString()
                  : 'Not Delivered'}
              </Typography>
              {selectedDelivery.comments && (
                <Typography>Comments: {selectedDelivery.comments}</Typography>
              )}
              {selectedDelivery.photo && (
                <img
                  src={selectedDelivery.photo}
                  alt="Delivery Proof"
                  style={{ width: '100%', marginTop: '10px' }}
                />
              )}

              {/* Update Order Status Dropdown */}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Update Status</InputLabel>
                <Select value={selectedStatus} onChange={handleStatusChange}>
                  <MenuItem value="READY_FOR_DELIVERY">Ready for Delivery</MenuItem>
                  <MenuItem value="PICKED_UP">Picked Up</MenuItem>
                  <MenuItem value="DELIVERED">Delivered</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <Button
                onClick={handleUpdateStatus}
                sx={{ mt: 2 }}
                variant="contained"
                color="primary"
                disabled={mutation.isLoading || selectedStatus === selectedDelivery.orderStatus} // ✅ Button enabled only if status is changed
              >
                {mutation.isLoading ? 'Updating...' : 'Update Status'}
              </Button>
            </>
          )}
          <Button onClick={() => setModalOpen(false)} sx={{ mt: 2 }}>
            Close
          </Button>
        </Box>
      </Modal>
    </Container>
  );
};

export default DriverDashboard;
