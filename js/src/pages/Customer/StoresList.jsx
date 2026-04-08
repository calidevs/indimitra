import React from 'react';
import { Stack } from '@mui/material';
import StoreItem from './StoreItem';

const StoresList = ({ availableStores, selectedStore, handleStoreSelect }) => {
  return (
    <Stack spacing={1.5}>
      {availableStores.map((store) => (
        <StoreItem
          key={store.id}
          store={store}
          isSelected={selectedStore?.id === store.id}
          onSelect={handleStoreSelect}
        />
      ))}
    </Stack>
  );
};

export default StoresList;
