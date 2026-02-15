import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import fetchGraphQL from '../../config/graphql/graphqlService';

// GraphQL queries and mutations
const ALL_STORES_SQUARE_STATUS = `
  query AllStoresSquareStatus {
    allStoresSquareStatus {
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

const ALL_STORES_QUERY = `
  query AllStores {
    stores {
      id
      name
      codEnabled
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
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [codDialogOpen, setCodDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedCodStore, setSelectedCodStore] = useState(null);
  const [pendingCodValue, setPendingCodValue] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertSeverity, setAlertSeverity] = useState('info');

  // Fetch all stores' Square connection status
  const {
    data: statusData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['allStoresSquareStatus'],
    queryFn: () => fetchGraphQL(ALL_STORES_SQUARE_STATUS),
  });

  // Fetch all stores for COD status
  const { data: storesData, refetch: refetchStores } = useQuery({
    queryKey: ['allStoresCod'],
    queryFn: () => fetchGraphQL(ALL_STORES_QUERY),
  });

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
      setSelectedStore(null);

      if (data.disconnectSquare?.success) {
        setAlertSeverity('success');
        setAlertMessage('Square account disconnected successfully');
        refetch();
      } else {
        setAlertSeverity('error');
        setAlertMessage(data.disconnectSquare?.message || 'Failed to disconnect Square');
      }
    },
    onError: (error) => {
      setDisconnectDialogOpen(false);
      setSelectedStore(null);
      setAlertSeverity('error');
      setAlertMessage(error.message || 'Failed to disconnect Square account');
    },
  });

  // Toggle COD mutation
  const toggleCodMutation = useMutation({
    mutationFn: (variables) => fetchGraphQL(TOGGLE_COD_MUTATION, variables),
    onSuccess: (data) => {
      setCodDialogOpen(false);
      setSelectedCodStore(null);
      if (data.toggleCod) {
        setAlertSeverity('success');
        setAlertMessage(
          data.toggleCod.codEnabled
            ? 'Cash on Delivery enabled'
            : 'Cash on Delivery disabled'
        );
        refetchStores();
      }
    },
    onError: (error) => {
      setCodDialogOpen(false);
      setSelectedCodStore(null);
      setAlertSeverity('error');
      setAlertMessage(error.message || 'Failed to update COD settings');
    },
  });

  // Handle OAuth callback on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get('oauth_success');
    const oauthError = params.get('oauth_error');
    const storeId = params.get('store_id');

    if (oauthSuccess === 'true') {
      setAlertSeverity('success');
      setAlertMessage(`Square account connected successfully${storeId ? ` for store ID ${storeId}` : ''}`);
      refetch();

      // Clean URL
      window.history.replaceState({}, '', '/admin/payment-settings');
    } else if (oauthError) {
      setAlertSeverity('error');
      setAlertMessage(`OAuth error: ${decodeURIComponent(oauthError)}`);

      // Clean URL
      window.history.replaceState({}, '', '/admin/payment-settings');
    }
  }, [refetch]);

  // Auto-hide alerts after 5 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const handleConnectClick = (storeId) => {
    connectMutation.mutate(storeId);
  };

  const handleDisconnectClick = (store) => {
    setSelectedStore(store);
    setDisconnectDialogOpen(true);
  };

  const handleDisconnectConfirm = () => {
    if (selectedStore) {
      disconnectMutation.mutate(selectedStore.storeId);
    }
  };

  const handleDisconnectCancel = () => {
    setDisconnectDialogOpen(false);
    setSelectedStore(null);
  };

  const stores = statusData?.allStoresSquareStatus || [];
  const codStatusMap = Object.fromEntries(
    (storesData?.stores || []).map((s) => [s.id, s.codEnabled])
  );

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PaymentIcon sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h5">Square Payment Settings</Typography>
        </Box>

        {alertMessage && (
          <Alert severity={alertSeverity} sx={{ mb: 3 }} onClose={() => setAlertMessage(null)}>
            {alertMessage}
          </Alert>
        )}

        {queryError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading stores: {queryError.message}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage Square payment connections for all stores. Connect a store to enable online card payments.
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Store Name</TableCell>
                  <TableCell>Connection Status</TableCell>
                  <TableCell>Merchant ID</TableCell>
                  <TableCell>COD</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No stores found
                    </TableCell>
                  </TableRow>
                ) : (
                  stores.map((store) => (
                    <TableRow key={store.storeId}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {store.storeName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {store.isConnected ? (
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
                      </TableCell>
                      <TableCell>
                        {store.merchantId || <Typography variant="body2" color="text.secondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={codStatusMap[store.storeId] || false}
                          onChange={(e) => {
                            setSelectedCodStore(store);
                            setPendingCodValue(e.target.checked);
                            setCodDialogOpen(true);
                          }}
                          size="small"
                          disabled={toggleCodMutation.isPending}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {store.isConnected ? (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDisconnectClick(store)}
                            disabled={disconnectMutation.isLoading}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleConnectClick(store.storeId)}
                            disabled={connectMutation.isLoading}
                            startIcon={connectMutation.isLoading && <CircularProgress size={16} />}
                          >
                            Connect Square
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialogOpen} onClose={handleDisconnectCancel}>
        <DialogTitle>Disconnect Square?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disconnect Square for <strong>{selectedStore?.storeName}</strong>?
            <br />
            <br />
            Customers will not be able to make card payments until you reconnect.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisconnectCancel} disabled={disconnectMutation.isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDisconnectConfirm}
            color="error"
            variant="contained"
            disabled={disconnectMutation.isLoading}
            startIcon={disconnectMutation.isLoading && <CircularProgress size={16} />}
          >
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>

      {/* COD Confirmation Dialog */}
      <Dialog
        open={codDialogOpen}
        onClose={() => {
          setCodDialogOpen(false);
          setSelectedCodStore(null);
        }}
      >
        <DialogTitle>
          {pendingCodValue ? 'Enable' : 'Disable'} Cash on Delivery?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingCodValue
              ? `Customers will be able to pay with cash when orders from ${selectedCodStore?.storeName} are delivered.`
              : `Cash on Delivery will be disabled for ${selectedCodStore?.storeName}. Orders already in progress will not be affected.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCodDialogOpen(false);
              setSelectedCodStore(null);
            }}
            disabled={toggleCodMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedCodStore) {
                toggleCodMutation.mutate({
                  storeId: selectedCodStore.storeId,
                  enabled: pendingCodValue,
                });
              }
            }}
            variant="contained"
            color={pendingCodValue ? 'primary' : 'error'}
            disabled={toggleCodMutation.isPending}
            startIcon={toggleCodMutation.isPending && <CircularProgress size={16} />}
          >
            {toggleCodMutation.isPending ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentSettings;
