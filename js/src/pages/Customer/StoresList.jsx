import React from 'react';
import { List } from '@mui/material';
import StoreItem from './StoreItem';

const StoresList = ({ availableStores, selectedStore, handleStoreSelect }) => {
  return (
    <List sx={{ mt: 1 }}>
      {availableStores.map((store) => (
        <StoreItem
          key={store.id}
          store={store}
          isSelected={selectedStore?.id === store.id}
          onSelect={handleStoreSelect}
        />
      ))}
    </List>
  );
};

export default StoresList;
