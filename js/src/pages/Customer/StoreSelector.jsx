import React, { useState, useEffect } from 'react';
import {
  Typography,
  Radio,
  Button,
  Box,
  Alert,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Chip,
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOn from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import LoginIcon from '@mui/icons-material/Login';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import { CircularProgress } from '@mui/material';

import Dialog from '@/components/Dialog/Dialog';
import useStore, { useAuthStore, useAddressStore } from '@/store/useStore';
import StoresList from './StoresList';
import StoreSelectorTitle from './StoreSelectorTitle';
import NoStoresMessage from './NoStoresMessage';
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';
import { useQueryClient } from '@tanstack/react-query';
import { fetchAuthSession } from '@aws-amplify/auth';

// Replace LoadingSpinner with CircularProgress
const LoadingSpinner = ({ size = 24, sx }) => (
  <CircularProgress size={size} sx={{ color: 'inherit', ...sx }} />
);

const StoreSelector = ({ open, onClose, forceStep, initialStore }) => {
  const {
    selectedStore,
    setSelectedStore,
    availableStores,
    setPickupAddress,
    deliveryType,
    setDeliveryType,
  } = useStore();

  const { user, userProfile, fetchUserProfile, isProfileLoading, setModalOpen, setCurrentForm } =
    useAuthStore();
  const queryClient = useQueryClient();

  // Use the address store for logged-in users
  const {
    addresses: dbAddresses,
    selectedAddressId,
    setSelectedAddressId,
    fetchAddresses,
    isLoading: isLoadingAddresses,
    createAddress: createAddressMutation,
  } = useAddressStore();

  const [step, setStep] = useState('store');
  const [tempStore, setTempStore] = useState(null);
  const [selectedPickupId, setSelectedPickupId] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Address input states
  const [newAddress, setNewAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);
  // Track the confirmed delivery address text (from input or saved address selection)
  const [confirmedDeliveryAddress, setConfirmedDeliveryAddress] = useState('');

  // Tab state for pickup/delivery toggle
  const [activeTab, setActiveTab] = useState(0);

  // Temporary address store for non-logged-in users
  const [tempAddresses, setTempAddresses] = useState([]);
  const [selectedTempAddressId, setSelectedTempAddressId] = useState('');

  // Track previous login state to detect changes
  const [previousLoginState, setPreviousLoginState] = useState(null);

  // Determine which addresses to use based on login status
  const addresses = userProfile ? dbAddresses : tempAddresses;
  const currentSelectedAddressId = userProfile ? selectedAddressId : selectedTempAddressId;
  const isLoggedIn = !!userProfile;

  // Handle user login state changes
  useEffect(() => {
    const currentLoginState = !!userProfile;

    // If user just logged in (was null/false, now true)
    if (previousLoginState === false && currentLoginState === true) {
      // Clear temporary data
      setTempAddresses([]);
      setSelectedTempAddressId('');

      // Fetch user addresses
      if (userProfile?.id && step === 'pickup' && tempStore) {
        fetchAddresses(userProfile.id);
      }

      // Reset delivery status to re-validate with new addresses
      setDeliveryStatus(null);
      setDeliveryMessage('');
    }

    // If user logged out (was true, now false)
    if (previousLoginState === true && currentLoginState === false) {
      // Clear DB-related states
      setSelectedAddressId(null);
    }

    setPreviousLoginState(currentLoginState);
  }, [userProfile, step, tempStore, fetchAddresses, setSelectedAddressId, previousLoginState]);

  // Initial fetch addresses when step changes to pickup and user profile is available
  useEffect(() => {
    if (step === 'pickup' && tempStore && userProfile?.id) {
      fetchAddresses(userProfile.id);
    }
  }, [step, tempStore, userProfile?.id, fetchAddresses]);

  // Auto-check auth when delivery tab is shown, or when user logs in (user changes)
  useEffect(() => {
    const isDeliveryTab = step === 'pickup' && (activeTab === 1 || !tempStore?.pickupAddresses?.edges?.length);
    if (!isDeliveryTab || userProfile) return;

    let cancelled = false;
    const checkAuth = async () => {
      try {
        const session = await fetchAuthSession();
        const cognitoId = session?.tokens?.idToken?.payload?.sub;
        if (cognitoId && !cancelled) {
          await fetchUserProfile(cognitoId);
        }
      } catch {
        // Not logged in, ignore
      }
    };
    checkAuth();
    return () => { cancelled = true; };
  }, [step, activeTab, userProfile, user, fetchUserProfile, tempStore]);

  useEffect(() => {
    if (open && forceStep) {
      setStep(forceStep);
      if (initialStore) {
        setTempStore(initialStore);
      }
    }
    if (!open) {
      setStep('store');
      setTempStore(null);
      resetAddressStates();
    }
  }, [open, forceStep, initialStore]);

  const resetAddressStates = () => {
    if (userProfile) {
      setSelectedAddressId(null);
    } else {
      setSelectedTempAddressId('');
    }
    setNewAddress('');
    setIsPrimary(false);
    setIsAddingAddress(false);
    setIsValidAddress(false);
    setDeliveryStatus(null);
    setDeliveryMessage('');
    setSelectedPickupId(null);
    setActiveTab(0);
    setConfirmedDeliveryAddress('');
  };

  // Enhanced refresh function that checks auth status
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Check current authentication status
      const session = await fetchAuthSession();
      const cognitoId = session?.tokens?.idToken?.payload?.sub;

      if (cognitoId) {
        // User is signed in - fetch user profile if not already loaded
        if (!userProfile) {
          await fetchUserProfile(cognitoId);
        }

        // Fetch user addresses if profile is available
        if (userProfile?.id || cognitoId) {
          const userId = userProfile?.id;
          if (userId) {
            await fetchAddresses(userId);
            // Clear temporary data since user is signed in
            setTempAddresses([]);
            setSelectedTempAddressId('');
          }
        }
      } else {
        // User is not signed in - clear any DB-related data
        setSelectedAddressId(null);
      }

      // Reset delivery status for re-validation
      setDeliveryStatus(null);
      setDeliveryMessage('');
    } catch (error) {
      console.error('Error refreshing auth/addresses:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle login button click
  const handleLoginClick = () => {
    setModalOpen(true);
    setCurrentForm('login');
  };

  // Handle selecting a saved address card
  const handleSavedAddressSelect = (addr) => {
    if (userProfile) {
      setSelectedAddressId(addr.id);
    } else {
      setSelectedTempAddressId(addr.id);
    }
    setConfirmedDeliveryAddress(addr.address);
    setNewAddress('');
    setIsValidAddress(false);
    validateDeliveryAddress(addr.address);
    setDeliveryType('delivery');
    setSelectedPickupId(null);
  };

  // Handle validating and using a new address from the input
  const handleUseNewAddress = async () => {
    if (!newAddress.trim() || !isValidAddress) return;

    // Validate first
    validateDeliveryAddress(newAddress);
    setConfirmedDeliveryAddress(newAddress);
    setDeliveryType('delivery');
    setSelectedPickupId(null);

    // Clear saved address selection
    if (userProfile) {
      setSelectedAddressId(null);
    } else {
      setSelectedTempAddressId('');
    }

    // Save address if logged in
    if (userProfile?.id) {
      const isDuplicate = dbAddresses.some(
        (addr) => addr.address.toLowerCase().trim() === newAddress.toLowerCase().trim()
      );
      if (!isDuplicate) {
        setIsAddingAddress(true);
        try {
          await createAddressMutation(newAddress, userProfile.id, isPrimary);
          const updatedAddresses = await fetchAddresses(userProfile.id);
          const saved = updatedAddresses.find(
            (addr) => addr.address.toLowerCase().trim() === newAddress.toLowerCase().trim()
          );
          if (saved) setSelectedAddressId(saved.id);
          queryClient.invalidateQueries(['userAddresses', userProfile.id]);
        } catch (error) {
          console.error('Error saving address:', error);
        } finally {
          setIsAddingAddress(false);
        }
      }
    } else {
      // Save as temp address for non-logged users
      const isDuplicate = tempAddresses.some(
        (addr) => addr.address.toLowerCase().trim() === newAddress.toLowerCase().trim()
      );
      if (!isDuplicate) {
        const newTempAddress = {
          id: `temp_${Date.now()}`,
          address: newAddress,
          isPrimary: tempAddresses.length === 0,
        };
        setTempAddresses((prev) => [...prev, newTempAddress]);
        setSelectedTempAddressId(newTempAddress.id);
      }
    }
  };

  // Validate delivery address function
  const validateDeliveryAddress = (address) => {
    if (!address || !tempStore) {
      setDeliveryStatus(null);
      setDeliveryMessage('');
      return;
    }

    const matches = address.match(/\b(\d{5})(?:-\d{4})?\b/g);
    const pincode = matches ? matches[matches.length - 1] : null;
    const pincodes = (tempStore?.pincodes || []).map((p) => String(p).trim());
    const pincodeStr = pincode ? String(pincode).trim() : '';

    if (pincodeStr && pincodes.includes(pincodeStr)) {
      setDeliveryStatus('success');
      setDeliveryMessage('Store delivers here');
    } else {
      setDeliveryStatus('error');
      setDeliveryMessage('Store does not deliver here.');
    }
  };

  const handleStoreSelect = (store) => {
    localStorage.setItem('selectedStoreId', String(store.id));
    setTempStore(store);
    setStep('pickup');
  };

  const handlePickupConfirm = () => {
    if (!tempStore || !selectedPickupId) return;
    const pickupAddresses = tempStore.pickupAddresses?.edges?.map((e) => e.node) || [];
    const selectedAddress = pickupAddresses.find(
      (addr) => String(addr.id) === String(selectedPickupId)
    );
    setSelectedStore(tempStore);
    setPickupAddress(selectedAddress);
    setDeliveryType('pickup');
    setStep('store');
    setTempStore(null);
    setSelectedPickupId(null);
    resetAddressStates();
    onClose();
  };

  const handleDeliveryConfirm = () => {
    if (deliveryStatus === 'success' && confirmedDeliveryAddress) {
      setSelectedStore(tempStore);
      setPickupAddress(null);
      setDeliveryType('delivery');

      setTimeout(() => {
        setStep('store');
        setTempStore(null);
        resetAddressStates();
        onClose();
      }, 1200);
    }
  };

  const handleBack = () => {
    setStep('store');
    setTempStore(null);
    resetAddressStates();
  };

  const handlePickupRadioChange = (e) => {
    setSelectedPickupId(e.target.value);
    setDeliveryType('pickup');
    if (userProfile) {
      setSelectedAddressId(null);
    } else {
      setSelectedTempAddressId('');
    }
    setDeliveryStatus(null);
    setDeliveryMessage('');
  };

  // Step 1: Store selection
  if (step === 'store') {
    return (
      <Dialog open={open} onClose={onClose} title={<StoreSelectorTitle />}>
        {availableStores.length === 0 ? (
          <NoStoresMessage />
        ) : (
          <>
            <Typography
              paragraph
              sx={{
                textAlign: 'center',
                fontWeight: 500,
                color: 'text.secondary',
                mb: 3,
              }}
            >
              Please select a store to browse products from
            </Typography>
            <StoresList
              availableStores={availableStores}
              selectedStore={selectedStore}
              handleStoreSelect={handleStoreSelect}
            />
          </>
        )}
      </Dialog>
    );
  }

  // Step 2: Pickup address and home delivery selection
  if (step === 'pickup') {
    const pickupAddresses = tempStore?.pickupAddresses?.edges?.map((e) => e.node) || [];
    const hasPickupAddresses = pickupAddresses.length > 0;

    const backButton = (
      <Button
        onClick={handleBack}
        variant="text"
        color="inherit"
        size="small"
        startIcon={<ArrowBackIcon />}
        sx={{ fontWeight: 500 }}
      >
        Back to stores
      </Button>
    );

    return (
      <Dialog open={open} onClose={onClose} title={<StoreSelectorTitle />} footer={backButton}>
        <Typography
          variant="body2"
          sx={{ textAlign: 'center', color: 'text.secondary', mb: 2 }}
        >
          Choose how you'd like to receive your order from <b>{tempStore?.name}</b>
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              minHeight: 42,
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              icon={<StoreIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Pickup"
              sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.9rem', minHeight: 42, py: 0 }}
            />
            <Tab
              icon={<HomeIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Delivery"
              sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.9rem', minHeight: 42, py: 0 }}
            />
          </Tabs>
        </Box>

        {/* Pickup Tab Content */}
        {activeTab === 0 && (
          <Stack spacing={2}>
            {hasPickupAddresses ? (
              <>
                {pickupAddresses.map((addr) => (
                  <Paper
                    key={addr.id}
                    elevation={0}
                    onClick={() => handlePickupRadioChange({ target: { value: String(addr.id) } })}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: String(selectedPickupId) === String(addr.id) ? 'primary.main' : 'grey.200',
                      borderRadius: 2,
                      bgcolor: String(selectedPickupId) === String(addr.id) ? 'primary.50' : 'transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: 'primary.light',
                        bgcolor: 'grey.50',
                      },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Radio
                      checked={String(selectedPickupId) === String(addr.id)}
                      value={String(addr.id)}
                      color="primary"
                      size="small"
                      sx={{ p: 0 }}
                    />
                    <Typography variant="body2">{addr.address}</Typography>
                  </Paper>
                ))}
                <Button
                  onClick={handlePickupConfirm}
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<LocalShippingIcon />}
                  disabled={!selectedPickupId}
                  sx={{ mt: 1, fontWeight: 600, py: 1.2, fontSize: '0.95rem', borderRadius: 2 }}
                >
                  Confirm Pickup
                </Button>
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  No pickup points available for this store.
                </Typography>
              </Alert>
            )}
          </Stack>
        )}

        {/* Delivery Tab Content */}
        {activeTab === 1 && (
          <Stack spacing={2}>
            {/* Address Input */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: -1 }}>
              Enter your delivery address to check availability
            </Typography>
            <AddressAutocomplete
              value={newAddress}
              onChange={(val) => {
                setNewAddress(val);
                // Clear previous validation when typing
                if (confirmedDeliveryAddress) {
                  setDeliveryStatus(null);
                  setDeliveryMessage('');
                  setConfirmedDeliveryAddress('');
                }
              }}
              onValidAddress={setIsValidAddress}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleUseNewAddress}
              disabled={!newAddress.trim() || !isValidAddress || isAddingAddress}
              startIcon={isAddingAddress ? <LoadingSpinner size={18} /> : <LocationOn />}
              sx={{ borderRadius: 1.5 }}
            >
              {isAddingAddress ? 'Validating...' : 'Validate & Use This Address'}
            </Button>

            {/* Validation Result */}
            {deliveryStatus && (
              <Alert
                severity={deliveryStatus}
                sx={{ borderRadius: 1.5 }}
                icon={deliveryStatus === 'success' ? <CheckCircleOutline /> : undefined}
              >
                {deliveryMessage}
              </Alert>
            )}

            {/* Saved Addresses Section */}
            {userProfile ? (
              <>
                {addresses.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }}>
                      <Chip label="Your Saved Addresses" size="small" variant="outlined" />
                    </Divider>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Refresh addresses">
                        <IconButton
                          size="small"
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            width: 28,
                            height: 28,
                          }}
                        >
                          {isRefreshing ? <LoadingSpinner size={14} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {(isLoadingAddresses || isRefreshing) ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <LoadingSpinner size={24} />
                      </Box>
                    ) : (
                      <Stack spacing={1.5}>
                        {addresses.map((addr) => (
                          <Paper
                            key={addr.id}
                            elevation={0}
                            onClick={() => handleSavedAddressSelect(addr)}
                            sx={{
                              p: 1.5,
                              cursor: 'pointer',
                              border: '1.5px solid',
                              borderColor: currentSelectedAddressId === addr.id ? 'secondary.main' : 'grey.200',
                              borderRadius: 2,
                              bgcolor: currentSelectedAddressId === addr.id ? 'secondary.50' : 'transparent',
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                borderColor: 'secondary.light',
                                bgcolor: 'grey.50',
                              },
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                            }}
                          >
                            <Radio
                              checked={currentSelectedAddressId === addr.id}
                              color="secondary"
                              size="small"
                              sx={{ p: 0 }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" noWrap>
                                {addr.address}
                              </Typography>
                              {addr.isPrimary && (
                                <Chip label="Primary" size="small" color="secondary" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </>
                )}
              </>
            ) : (
              /* Non-logged user: login prompt */
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1.5px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: 'grey.50',
                }}
              >
                <LoginIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Sign in to use your saved addresses
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<LoginIcon />}
                  onClick={handleLoginClick}
                  sx={{ borderRadius: 1.5 }}
                >
                  Login
                </Button>
              </Paper>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleDeliveryConfirm}
              variant="contained"
              color="secondary"
              fullWidth
              startIcon={<HomeIcon />}
              disabled={deliveryStatus !== 'success' || !confirmedDeliveryAddress}
              sx={{ fontWeight: 600, py: 1.2, fontSize: '0.95rem', borderRadius: 2 }}
            >
              Confirm Delivery
            </Button>
          </Stack>
        )}
      </Dialog>
    );
  }

  return null;
};

export default StoreSelector;
