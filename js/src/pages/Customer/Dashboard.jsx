// In js/src/pages/Dashbaord.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, LoadingSpinner } from '@components';
import Products from '../Products';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_ALL_STORES } from '@/queries/operations';
import useStore from '@/store/useStore';
import StoreSelector from './StoreSelector';

const Dashbaord = () => {
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const { selectedStore, setAvailableStores, setSelectedStore } = useStore();

  // Fetch all stores
  const {
    data: storesData,
    isLoading: storesLoading,
    error: storesError,
  } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_ALL_STORES);
      return response;
    },
  });

  useEffect(() => {
    if (storesData?.stores && storesData.stores.length > 0) {
      setAvailableStores(storesData.stores);
      const storedStore = localStorage.getItem('selectedStore');
      
      if (storedStore) {
        const parsedStore = JSON.parse(storedStore);
        if(!selectedStore || selectedStore.id !== parsedStore.id){
            setSelectedStore(parsedStore);
        }
      }
      if (!selectedStore && !storedStore) {
        setStoreModalOpen(true);
      }
    }
  }, [storesData, selectedStore, setAvailableStores]);
  

  if (storesLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <>
      <StoreSelector open={storeModalOpen} onClose={() => setStoreModalOpen(false)} />
      {selectedStore && <Products setStoreModalOpen={() => setStoreModalOpen(true)}/>}
    </>
  );
};

export default Dashbaord;
