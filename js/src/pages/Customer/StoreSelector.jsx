import React, { useState, useEffect } from 'react';
import {
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  Box,
  Alert,
  Paper,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Collapse,
  Checkbox,
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FilterIcon from '@mui/icons-material/FilterList';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LocationOn from '@mui/icons-material/LocationOn';
import { CircularProgress } from '@mui/material';

import Dialog from '@/components/Dialog/Dialog';
import useStore, { useAuthStore, useAddressStore } from '@/store/useStore';
import StoresList from './StoresList';
import StoreSelectorTitle from './StoreSelectorTitle';
import NoStoresMessage from './NoStoresMessage';
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';
import { useQueryClient } from '@tanstack/react-query';

// Replace LoadingSpinner with CircularProgress
const LoadingSpinner = ({ size = 24, sx }) => (
  <CircularProgress size={size} sx={{ color: 'inherit', ...sx }} />
);

const StoreSelector = ({ open, onClose, forceStep, initialStore }) => {
  const {
    selectedStore,
    setSelectedStore,
    availableStores,
    clearCart,
    setPickupAddress,
    deliveryType,
    setDeliveryType,
  } = useStore();
  
  const { userProfile } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Use the address store
  const {
    addresses,
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

  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);

  // Fetch addresses when step changes to pickup and user profile is available
  useEffect(() => {
    if (step === 'pickup' && tempStore && userProfile?.id) {
      fetchAddresses(userProfile.id);
    }
  }, [step, tempStore, userProfile?.id, fetchAddresses]);

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
    setSelectedAddressId(null);
    setShowAddressForm(false);
    setNewAddress('');
    setIsPrimary(false);
    setIsAddingAddress(false);
    setIsValidAddress(false);
    setDeliveryStatus(null);
    setDeliveryMessage('');
    setSelectedPickupId(null);
  };

  // Address dropdown change handler
  const handleAddressDropdownChange = (e) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);
    
    if (addressId) {
      const selectedAddress = addresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        validateDeliveryAddress(selectedAddress.address);
        setDeliveryType('delivery');
        setSelectedPickupId(null);
      }
    } else {
      setDeliveryType(selectedPickupId ? 'pickup' : null);
      setDeliveryStatus(null);
      setDeliveryMessage('');
    }
  };

  // Add new address handler
  const handleAddAddress = async () => {
    if (!newAddress.trim() || !isValidAddress || !userProfile?.id) return;

    // Check for duplicate addresses
    const isDuplicate = addresses.some(addr => 
      addr.address.toLowerCase().trim() === newAddress.toLowerCase().trim()
    );

    if (isDuplicate) {
      setDeliveryStatus('error');
      setDeliveryMessage('This address already exists in your list.');
      return;
    }

    setIsAddingAddress(true);
    
    try {
      await createAddressMutation(newAddress, userProfile.id, isPrimary);
      
      // Refresh addresses after adding
      await fetchAddresses(userProfile.id);
      
      // Find the newly added address and select it
      const updatedAddresses = await fetchAddresses(userProfile.id);
      const newAddressObj = updatedAddresses.find(addr => 
        addr.address.toLowerCase().trim() === newAddress.toLowerCase().trim()
      );
      
      if (newAddressObj) {
        setSelectedAddressId(newAddressObj.id);
        validateDeliveryAddress(newAddress);
        setDeliveryType('delivery');
        setSelectedPickupId(null);
      }
      
      // Reset form
      setNewAddress('');
      setIsPrimary(false);
      setShowAddressForm(false);
      setIsValidAddress(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['userAddresses', userProfile.id]);
      
    } catch (error) {
      setDeliveryStatus('error');
      setDeliveryMessage('Failed to add address. Please try again.');
      console.error('Error adding address:', error);
    } finally {
      setIsAddingAddress(false);
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
    clearCart();
    setStep('pickup');
  };

  const handlePickupConfirm = () => {
    if (!tempStore || !selectedPickupId) return;
    const pickupAddresses = tempStore.pickupAddresses?.edges?.map((e) => e.node) || [];
    const selectedAddress = pickupAddresses.find((addr) => String(addr.id) === String(selectedPickupId));
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
    if (deliveryStatus === 'success' && selectedAddressId) {
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
    setSelectedAddressId(null);
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
    
    return (
      <Dialog open={open} onClose={onClose} title={<StoreSelectorTitle />}>
        <Typography
          paragraph
          sx={{ textAlign: 'center', fontWeight: 500, color: 'text.secondary', mb: 3 }}
        >
          Please select a pickup address or choose your delivery address for{' '}
          <b>{tempStore?.name}</b>
        </Typography>
        <Stack spacing={3}>
          {/* Pickup Address Section */}
          {pickupAddresses.length > 0 && (
            <>
              <Paper
                elevation={deliveryType === 'pickup' ? 4 : 1}
                sx={{
                  p: 2,
                  bgcolor: deliveryType === 'pickup' ? 'primary.lighter' : 'grey.50',
                  opacity: deliveryType === 'delivery' && selectedAddressId ? 0.5 : 1,
                  border: deliveryType === 'pickup' ? '2px solid #1976d2' : '1px solid #eee',
                  transition: 'all 0.2s',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <StoreIcon fontSize="small" color="primary" /> Pickup Address
                </Typography>
                <RadioGroup value={selectedPickupId || ''} onChange={handlePickupRadioChange}>
                  {pickupAddresses.map((addr) => (
                    <FormControlLabel
                      key={addr.id}
                      value={String(addr.id)}
                      control={<Radio color="primary" />}
                      label={addr.address}
                    />
                  ))}
                </RadioGroup>
                <Button
                  onClick={handlePickupConfirm}
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<LocalShippingIcon />}
                  disabled={deliveryType !== 'pickup' || !selectedPickupId}
                  sx={{ mt: 2, fontWeight: 600, py: 1.2, fontSize: '1rem' }}
                >
                  Confirm Pickup
                </Button>
              </Paper>
              <Divider>OR</Divider>
            </>
          )}
          {/* Home Delivery Section */}
          <Paper
            elevation={deliveryType === 'delivery' ? 4 : 1}
            sx={{
              p: 2,
              bgcolor: deliveryType === 'delivery' ? 'secondary.lighter' : 'grey.50',
              opacity: deliveryType === 'pickup' && selectedPickupId ? 0.5 : 1,
              border: deliveryType === 'delivery' ? '2px solid #9c27b0' : '1px solid #eee',
              transition: 'all 0.2s',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <HomeIcon fontSize="small" color="secondary" /> Delivery Address
            </Typography>

            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Address</InputLabel>
                {isLoadingAddresses ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <LoadingSpinner size={24} />
                  </Box>
                ) : (
                  <Select
                    value={selectedAddressId || ''}
                    onChange={handleAddressDropdownChange}
                    label="Select Address"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterIcon />
                        </InputAdornment>
                      ),
                    }}
                  >
                    {addresses && addresses.length > 0 ? (
                      addresses.map((addr) => (
                        <MenuItem key={addr.id} value={addr.id}>
                          {addr.address} {addr.isPrimary ? '(Primary)' : ''}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No addresses available</MenuItem>
                    )}
                  </Select>
                )}
              </FormControl>

              <Button
                fullWidth
                variant="outlined"
                startIcon={showAddressForm ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setShowAddressForm(!showAddressForm)}
                sx={{ mb: 2 }}
              >
                {showAddressForm ? 'Cancel' : 'Add New Address'}
              </Button>

              <Collapse in={showAddressForm}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Stack spacing={2}>
                    <AddressAutocomplete
                      value={newAddress}
                      onChange={setNewAddress}
                      onValidAddress={setIsValidAddress}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isPrimary}
                          onChange={(e) => setIsPrimary(e.target.checked)}
                        />
                      }
                      label="Set as Primary Address"
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddAddress}
                      disabled={
                        !newAddress.trim() || isAddingAddress || !isValidAddress
                      }
                      startIcon={
                        isAddingAddress ? <LoadingSpinner size={20} /> : <LocationOn />
                      }
                    >
                      {isAddingAddress ? 'Adding...' : 'Add Address'}
                    </Button>
                  </Stack>
                </Box>
              </Collapse>
            </Box>

            {deliveryStatus && (
              <Alert severity={deliveryStatus} sx={{ mt: 2 }}>
                {deliveryMessage}
              </Alert>
            )}
            <Button
              onClick={handleDeliveryConfirm}
              variant="contained"
              color="secondary"
              fullWidth
              startIcon={<HomeIcon />}
              disabled={deliveryType !== 'delivery' || !selectedAddressId || deliveryStatus !== 'success'}
              sx={{ mt: 2, fontWeight: 600, py: 1.2, fontSize: '1rem' }}
            >
              Confirm Delivery
            </Button>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
            <Button
              onClick={handleBack}
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<ArrowBackIcon />}
              sx={{ fontWeight: 500, borderRadius: 2 }}
            >
              Back
            </Button>
          </Box>
        </Stack>
      </Dialog>
    );
  }

  return null;
};

export default StoreSelector;
