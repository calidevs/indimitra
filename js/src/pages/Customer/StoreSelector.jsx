import React, { useState } from 'react';
import { Typography, Radio, RadioGroup, FormControlLabel, Button, Box, Alert } from '@mui/material';

import Dialog from '@/components/Dialog/Dialog';
import useStore from '@/store/useStore';
import StoresList from './StoresList';
import StoreSelectorTitle from './StoreSelectorTitle';
import NoStoresMessage from './NoStoresMessage';
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';

const StoreSelector = ({ open, onClose }) => {
  const { selectedStore, setSelectedStore, availableStores, clearCart, setPickupAddress } =
    useStore();
  const [step, setStep] = useState('store'); // 'store' or 'pickup'
  const [tempStore, setTempStore] = useState(null);
  const [selectedPickupId, setSelectedPickupId] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isValidDeliveryAddress, setIsValidDeliveryAddress] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null); // 'success' | 'error' | null
  const [deliveryMessage, setDeliveryMessage] = useState('');

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
    setStep('store');
    setTempStore(null);
    setSelectedPickupId(null);
    onClose();
  };

  // Handle home delivery address validation
  const handleDeliveryConfirm = () => {
    if (!deliveryAddress || !isValidDeliveryAddress) {
      setDeliveryStatus('error');
      setDeliveryMessage('Please select a valid address from the suggestions.');
      return;
    }
    // Robustly extract pincode (US ZIP code style: 5 digits, anywhere in the address)
    let pincode = null;
    let match = deliveryAddress.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (match) {
      pincode = match[1];
    } else {
      // Try splitting by comma and searching for a 5-digit number
      const parts = deliveryAddress.split(',');
      for (let i = parts.length - 1; i >= 0; i--) {
        const zipMatch = parts[i].match(/\b(\d{5})\b/);
        if (zipMatch) {
          pincode = zipMatch[1];
          break;
        }
      }
    }
    const pincodes = tempStore?.pincodes || [];
    if (pincode && pincodes.includes(pincode)) {
      setDeliveryStatus('success');
      setDeliveryMessage('Store delivers here');
      setSelectedStore(tempStore);
      // Optionally, store delivery address in Zustand (add setDeliveryAddress if needed)
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
        {/* Pickup Address Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Pickup Address
          </Typography>
          {addresses.length === 0 ? (
            <Typography color="error" align="center">
              No pickup addresses available for this store.
            </Typography>
          ) : (
            <RadioGroup
              value={selectedPickupId || ''}
              onChange={(e) => setSelectedPickupId(e.target.value)}
            >
              {addresses.map((addr) => (
                <FormControlLabel
                  key={addr.id}
                  value={String(addr.id)}
                  control={<Radio />}
                  label={addr.address}
                />
              ))}
            </RadioGroup>
          )}
          <Button
            onClick={handlePickupConfirm}
            variant="contained"
            disabled={!selectedPickupId}
            sx={{ mt: 2 }}
          >
            Confirm Pickup
          </Button>
        </Box>
        {/* Home Delivery Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Home Delivery Address
          </Typography>
          <AddressAutocomplete
            value={deliveryAddress}
            onChange={setDeliveryAddress}
            onValidAddress={setIsValidDeliveryAddress}
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
            disabled={!isValidDeliveryAddress}
            sx={{ mt: 2 }}
          >
            Confirm Delivery
          </Button>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
          <Button onClick={handleBack} variant="outlined">
            Back
          </Button>
        </Box>
      </Dialog>
    );
  }

  return null;
};

export default StoreSelector;
