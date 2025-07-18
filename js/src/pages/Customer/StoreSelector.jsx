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
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import Dialog from '@/components/Dialog/Dialog';
import useStore from '@/store/useStore';
import StoresList from './StoresList';
import StoreSelectorTitle from './StoreSelectorTitle';
import NoStoresMessage from './NoStoresMessage';
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';

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
  const [step, setStep] = useState('store'); // 'store' or 'pickup'
  const [tempStore, setTempStore] = useState(null);
  const [selectedPickupId, setSelectedPickupId] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isValidDeliveryAddress, setIsValidDeliveryAddress] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null); // 'success' | 'error' | null
  const [deliveryMessage, setDeliveryMessage] = useState('');

  // If forceStep is provided and modal is opened, set the step accordingly
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
    }
  }, [open, forceStep, initialStore]);

  // Handle store selection
  const handleStoreSelect = (store) => {
    localStorage.setItem('selectedStoreId', String(store.id));
    setTempStore(store);
    clearCart();
    setStep('pickup');
  };

  // Handle pickup address selection
  const handlePickupConfirm = () => {
    if (!tempStore || !selectedPickupId) return;
    const addresses = tempStore.pickupAddresses?.edges?.map((e) => e.node) || [];
    const selectedAddress = addresses.find((addr) => String(addr.id) === String(selectedPickupId));
    setSelectedStore(tempStore);
    setPickupAddress(selectedAddress);
    setDeliveryType('pickup'); // Set delivery type to pickup
    setStep('store');
    setTempStore(null);
    setSelectedPickupId(null);
    onClose();
  };

  // New: validate delivery address as soon as it's valid
  const handleValidDeliveryAddress = (isValid) => {
    setIsValidDeliveryAddress(isValid);
  };

  // Add useEffect for validation
  useEffect(() => {
    if (!isValidDeliveryAddress || !deliveryAddress) {
      setDeliveryStatus(null);
      setDeliveryMessage('');
      return;
    }
    // Extract the last 5-digit number (ZIP code) from the address
    const matches = deliveryAddress.match(/\b(\d{5})(?:-\d{4})?\b/g);
    const pincode = matches ? matches[matches.length - 1] : null;
    // Ensure both pincode and store pincodes are strings and trimmed
    const pincodes = (tempStore?.pincodes || []).map((p) => String(p).trim());
    const pincodeStr = pincode ? String(pincode).trim() : '';

    if (pincodeStr && pincodes.includes(pincodeStr)) {
      setDeliveryStatus('success');
      setDeliveryMessage('Store delivers here');
    } else {
      setDeliveryStatus('error');
      setDeliveryMessage('Store does not deliver here.');
    }
  }, [isValidDeliveryAddress, deliveryAddress, tempStore]);

  // Handle home delivery address validation
  const handleDeliveryConfirm = () => {
    if (deliveryStatus === 'success') {
      setSelectedStore(tempStore);
      setPickupAddress(null);
      setDeliveryType('delivery'); // Set delivery type to delivery
      setTimeout(() => {
        setStep('store');
        setTempStore(null);
        setDeliveryAddress('');
        setIsValidDeliveryAddress(false);
        setDeliveryStatus(null);
        setDeliveryMessage('');
        onClose();
      }, 1200);
    } else {
      setDeliveryStatus('error');
      setDeliveryMessage('Store does not deliver here.');
    }
  };

  const handleBack = () => {
    setStep('store');
    setTempStore(null);
    setSelectedPickupId(null);
    setDeliveryAddress('');
    setIsValidDeliveryAddress(false);
    setDeliveryStatus(null);
    setDeliveryMessage('');
  };

  // In handlePickup selection:
  const handlePickupRadioChange = (e) => {
    setSelectedPickupId(e.target.value);
    setDeliveryType('pickup'); // Set delivery type to pickup
    setDeliveryAddress('');
    setIsValidDeliveryAddress(false);
  };

  // In AddressAutocomplete onChange:
  const handleDeliveryAddressChange = (value) => {
    setDeliveryAddress(value);
    if (value && value.trim() !== '') {
      setDeliveryType('delivery'); // Set delivery type to delivery
      setSelectedPickupId(null);
    } else {
      // If delivery field is cleared, allow both sections to be active
      setDeliveryType(selectedPickupId ? 'pickup' : null);
    }
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
    const addresses = tempStore?.pickupAddresses?.edges?.map((e) => e.node) || [];
    return (
      <Dialog open={open} onClose={onClose} title={<StoreSelectorTitle />}>
        <Typography
          paragraph
          sx={{ textAlign: 'center', fontWeight: 500, color: 'text.secondary', mb: 3 }}
        >
          Please select a pickup address or enter your home delivery address for{' '}
          <b>{tempStore?.name}</b>
        </Typography>
        <Stack spacing={3}>
          {/* Pickup Address Section - Only show if addresses are available */}
          {addresses.length > 0 && (
            <>
              <Paper
                elevation={deliveryType === 'pickup' ? 4 : 1}
                sx={{
                  p: 2,
                  bgcolor: deliveryType === 'pickup' ? 'primary.lighter' : 'grey.50',
                  opacity: deliveryType === 'delivery' && deliveryAddress ? 0.5 : 1,
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
                  {addresses.map((addr) => (
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
              sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <HomeIcon fontSize="small" color="secondary" /> Home Delivery Address
            </Typography>
            <AddressAutocomplete
              value={deliveryAddress}
              onChange={handleDeliveryAddressChange}
              onValidAddress={handleValidDeliveryAddress}
            />
            {deliveryStatus && (
              <Alert severity={deliveryStatus} sx={{ mt: 1 }}>
                {deliveryMessage}
              </Alert>
            )}
            <Button
              onClick={handleDeliveryConfirm}
              variant="contained"
              color="secondary"
              fullWidth
              startIcon={<HomeIcon />}
              disabled={deliveryType !== 'delivery' || !isValidDeliveryAddress}
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
