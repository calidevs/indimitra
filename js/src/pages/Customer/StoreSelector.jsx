import React from 'react';
import { Typography } from '@mui/material';

import Dialog from '@/components/Dialog/Dialog';
import useStore from '@/store/useStore';
import StoresList from './StoresList';
import StoreSelectorTitle from './StoreSelectorTitle';
import NoStoresMessage from './NoStoresMessage';

const StoreSelector = ({ open, onClose }) => {
  const { selectedStore, setSelectedStore, availableStores } = useStore();

  // Handle store selection
  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    onClose();
  };

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
};

export default StoreSelector;
