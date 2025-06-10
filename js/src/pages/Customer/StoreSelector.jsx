import React, { useState } from 'react';
import { Typography, Radio, RadioGroup, FormControlLabel, Button, Box } from '@mui/material';

import Dialog from '@/components/Dialog/Dialog';
import useStore from '@/store/useStore';
import StoresList from './StoresList';
import StoreSelectorTitle from './StoreSelectorTitle';
import NoStoresMessage from './NoStoresMessage';

const StoreSelector = ({ open, onClose }) => {
  const { selectedStore, setSelectedStore, availableStores, clearCart, setPickupAddress } =
    useStore();
  const [step, setStep] = useState('store'); // 'store' or 'pickup'
  const [tempStore, setTempStore] = useState(null);
  const [selectedPickupId, setSelectedPickupId] = useState(null);

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

  const handleBack = () => {
    setStep('store');
    setTempStore(null);
    setSelectedPickupId(null);
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

  // Step 2: Pickup address selection
  if (step === 'pickup') {
    const addresses = tempStore?.pickupAddresses?.edges?.map((e) => e.node) || [];
    return (
      <Dialog open={open} onClose={onClose} title={<StoreSelectorTitle />}>
        <Typography
          paragraph
          sx={{ textAlign: 'center', fontWeight: 500, color: 'text.secondary', mb: 3 }}
        >
          Please select a pickup address for <b>{tempStore?.name}</b>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={handleBack} variant="outlined">
            Back
          </Button>
          <Button onClick={handlePickupConfirm} variant="contained" disabled={!selectedPickupId}>
            Confirm
          </Button>
        </Box>
      </Dialog>
    );
  }

  return null;
};

export default StoreSelector;
