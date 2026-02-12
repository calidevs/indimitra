import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  LocalAtm as MoneyIcon,
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { useAuthStore } from '@/store/useStore';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { GET_USER_PROFILE, GET_STORE_INFO } from '@/queries/operations';
import Layout from '@/components/StoreManager/Layout';

// GraphQL queries and mutations
const STORE_SQUARE_STATUS = `
  query StoreSquareStatus($storeId: Int!) {
    storeSquareStatus(storeId: $storeId) {
      storeId
      storeName
      isConnected
      merchantId
    }
  }
`;

const CONNECT_SQUARE = `
  mutation ConnectSquare($storeId: Int!) {
    connectSquare(storeId: $storeId) {
      authorizationUrl
      message
    }
  }
`;

const DISCONNECT_SQUARE = `
  mutation DisconnectSquare($storeId: Int!) {
    disconnectSquare(storeId: $storeId) {
      success
      message
    }
  }
`;

const TOGGLE_COD_MUTATION = `
  mutation ToggleCod($storeId: Int!, $enabled: Boolean!) {
    toggleCod(storeId: $storeId, enabled: $enabled) {
      id
      codEnabled
    }
  }
`;

const PaymentSettings = () => {
  const [cognitoId, setCognitoId] = useState('');
  const { userProfile, setUserProfile } = useAuthStore();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [codDialogOpen, setCodDialogOpen] = useState(false);
  const [pendingCodValue, setPendingCodValue] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertSeverity, setAlertSeverity] = useState('info');

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
      if (!cognitoId) return null;
      const response = await fetchGraphQL(GET_USER_PROFILE, { userId: cognitoId });
      if (response?.getUserProfile) {
        setUserProfile(response.getUserProfile);
      }
      return response;
    },
    enabled: !!cognitoId,
  });

  // Fetch store data
  const {
    data: storeData,
    isLoading: storeLoading,
    error: storeError,
    refetch: refetchStore,
  } = useQuery({
    queryKey: ['storeInfo', userProfile?.id],
    queryFn: () => fetchGraphQL(GET_STORE_INFO, { managerId: userProfile.id }),
    enabled: !!userProfile?.id,
  });

  const store = storeData?.storesByManager?.[0];

  // Fetch Square connection status
  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['storeSquareStatus', store?.id],
    queryFn: () => fetchGraphQL(STORE_SQUARE_STATUS, { storeId: store?.id }),
    enabled: !!store?.id,
  });

  const squareStatus = statusData?.storeSquareStatus;

  // Connect Square mutation
  const connectMutation = useMutation({
    mutationFn: (storeId) => fetchGraphQL(CONNECT_SQUARE, { storeId }),
    onSuccess: (data) => {
      const authUrl = data.connectSquare?.authorizationUrl;
      if (authUrl) {
        // Redirect to Square OAuth
        window.location.href = authUrl;
      } else {
        setAlertSeverity('error');
        setAlertMessage(data.connectSquare?.message || 'Failed to generate authorization URL');
      }
    },
    onError: (error) => {
      setAlertSeverity('error');
      setAlertMessage(error.message || 'Failed to initiate Square connection');
    },
  });

  // Disconnect Square mutation
  const disconnectMutation = useMutation({
    mutationFn: (storeId) => fetchGraphQL(DISCONNECT_SQUARE, { storeId }),
    onSuccess: (data) => {
      setDisconnectDialogOpen(false);

      if (data.disconnectSquare?.success) {
        setAlertSeverity('success');
        setAlertMessage('Square account disconnected successfully');
        refetchStatus();
      } else {
        setAlertSeverity('error');
        setAlertMessage(data.disconnectSquare?.message || 'Failed to disconnect Square');
      }
    },
    onError: (error) => {
      setDisconnectDialogOpen(false);
      setAlertSeverity('error');
      setAlertMessage(error.message || 'Failed to disconnect Square account');
    },
  });

  // Toggle COD mutation
  const toggleCodMutation = useMutation({
    mutationFn: (variables) => fetchGraphQL(TOGGLE_COD_MUTATION, variables),
    onSuccess: (data) => {
      if (data.toggleCod) {
        setAlertSeverity('success');
        setAlertMessage(
          data.toggleCod.codEnabled
            ? 'Cash on Delivery enabled successfully'
            : 'Cash on Delivery disabled successfully'
        );
        refetchStatus();
        refetchStore();
      } else {
        setAlertSeverity('error');
        setAlertMessage('Failed to update COD settings');
      }
    },
    onError: (error) => {
      setAlertSeverity('error');
      setAlertMessage(error.message || 'Failed to update COD settings');
    },
  });

  // Handle OAuth callback on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get('oauth_success');
    const oauthError = params.get('oauth_error');

    if (oauthSuccess === 'true') {
      setAlertSeverity('success');
      setAlertMessage('Square account connected successfully');
      refetchStatus();

      // Clean URL
      window.history.replaceState({}, '', '/store_manager/payment-settings');
    } else if (oauthError) {
      setAlertSeverity('error');
      setAlertMessage(`OAuth error: ${decodeURIComponent(oauthError)}`);

      // Clean URL
      window.history.replaceState({}, '', '/store_manager/payment-settings');
    }
  }, [refetchStatus]);

  // Auto-hide success alerts after 5 seconds
  useEffect(() => {
    if (alertMessage && alertSeverity === 'success') {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage, alertSeverity]);

  const handleConnectClick = () => {
    if (store?.id) {
      connectMutation.mutate(store.id);
    }
  };

  const handleDisconnectClick = () => {
    setDisconnectDialogOpen(true);
  };

  const handleDisconnectConfirm = () => {
    if (store?.id) {
      disconnectMutation.mutate(store.id);
    }
  };

  const handleDisconnectCancel = () => {
    setDisconnectDialogOpen(false);
  };

  const handleCodToggle = (event) => {
    setPendingCodValue(event.target.checked);
    setCodDialogOpen(true);
  };

  const handleCodConfirm = () => {
    if (store?.id) {
      toggleCodMutation.mutate({
        storeId: store.id,
        enabled: pendingCodValue,
      });
    }
    setCodDialogOpen(false);
  };

  const handleCodCancel = () => {
    setCodDialogOpen(false);
  };

  // Loading state
  if (profileLoading || storeLoading || statusLoading) {
    return (
      <Layout>
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  // Error state
  if (storeError || statusError) {
    return (
      <Layout>
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">
            Error loading data: {storeError?.message || statusError?.message}
          </Alert>
        </Container>
      </Layout>
    );
  }

  // No store found
  if (!store) {
    return (
      <Layout>
        <Container sx={{ mt: 4 }}>
          <Alert severity="warning">
            No store found. You are not assigned as a manager to any store.
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Typography variant="h4" gutterBottom>
          Payment Settings
        </Typography>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PaymentIcon sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h5">Square Payment Connection</Typography>
          </Box>

          {alertMessage && (
            <Alert severity={alertSeverity} sx={{ mb: 3 }} onClose={() => setAlertMessage(null)}>
              {alertMessage}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Connect your store to Square to enable online card payments for your customers.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              <strong>Store:</strong> {store.name}
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              <strong>Connection Status:</strong>{' '}
              {squareStatus?.isConnected ? (
                <Chip
                  label="Connected"
                  color="success"
                  size="small"
                  icon={<LinkIcon />}
                />
              ) : (
                <Chip
                  label="Not Connected"
                  color="default"
                  size="small"
                  icon={<LinkOffIcon />}
                />
              )}
            </Typography>
            {squareStatus?.isConnected && squareStatus?.merchantId && (
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                <strong>Merchant ID:</strong> {squareStatus.merchantId}
              </Typography>
            )}
          </Box>

          <Box>
            {squareStatus?.isConnected ? (
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnectClick}
                disabled={disconnectMutation.isPending}
                startIcon={disconnectMutation.isPending && <CircularProgress size={16} />}
              >
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect Square'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnectClick}
                disabled={connectMutation.isPending}
                startIcon={connectMutation.isPending && <CircularProgress size={16} />}
              >
                {connectMutation.isPending ? 'Connecting...' : 'Connect Square Account'}
              </Button>
            )}
          </Box>
        </Paper>

        {/* Cash on Delivery Card */}
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <MoneyIcon sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h5">Cash on Delivery</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Accept cash payments when orders are delivered
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={store?.codEnabled || false}
                onChange={handleCodToggle}
                disabled={toggleCodMutation.isPending}
                color="primary"
              />
            }
            label={store?.codEnabled ? 'Enabled' : 'Disabled'}
          />
        </Paper>

        {/* Disconnect Confirmation Dialog */}
        <Dialog open={disconnectDialogOpen} onClose={handleDisconnectCancel}>
          <DialogTitle>Disconnect Square?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to disconnect Square for <strong>{store.name}</strong>?
              <br />
              <br />
              Customers will not be able to make card payments until you reconnect.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDisconnectCancel} disabled={disconnectMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleDisconnectConfirm}
              color="error"
              variant="contained"
              disabled={disconnectMutation.isPending}
              startIcon={disconnectMutation.isPending && <CircularProgress size={16} />}
            >
              {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* COD Confirmation Dialog */}
        <Dialog open={codDialogOpen} onClose={handleCodCancel}>
          <DialogTitle>
            {pendingCodValue ? 'Enable' : 'Disable'} Cash on Delivery?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {pendingCodValue
                ? `Customers will be able to pay with cash when their orders from ${store?.name} are delivered.`
                : `Customers will no longer see Cash on Delivery as a payment option for ${store?.name}. Orders already in progress will not be affected.`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCodCancel} disabled={toggleCodMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleCodConfirm}
              variant="contained"
              color={pendingCodValue ? 'primary' : 'error'}
              disabled={toggleCodMutation.isPending}
              startIcon={toggleCodMutation.isPending && <CircularProgress size={16} />}
            >
              {toggleCodMutation.isPending ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default PaymentSettings;
