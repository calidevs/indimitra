// In js/src/pages/Dashbaord.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, LoadingSpinner, Container, Typography, Button } from '@components';
import Products from '../Products';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_ALL_STORES } from '@/queries/operations';
import useStore from '@/store/useStore';
import StoreSelector from './StoreSelector';

const Dashbaord = () => {
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeSelectorStep2Open, setStoreSelectorStep2Open] = useState(false);
  const { selectedStore, setAvailableStores, setSelectedStore, pickupAddress } = useStore();

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
      const storedStoreId = localStorage.getItem('selectedStoreId');
      if (storedStoreId) {
        const foundStore = storesData.stores.find((s) => String(s.id) === storedStoreId);
        if (!selectedStore || selectedStore.id !== foundStore?.id) {
          if (foundStore) {
            setSelectedStore(foundStore);
          } else {
            // If the store id is not found in the current list, clear and show modal
            localStorage.removeItem('selectedStoreId');
            setStoreModalOpen(true);
          }
        }
      } else if (!selectedStore) {
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
      {selectedStore && (
        <>
          <Container>
            <Box
              sx={{
                alignItems: 'center',
                mb: 3,
                mt: 2,
                p: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Box>
                  <Typography variant="h6">{selectedStore.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedStore.address}
                  </Typography>
                </Box>
                {pickupAddress && (
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      minWidth: 180,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                    }}
                    onClick={() => setStoreSelectorStep2Open(true)}
                  >
                    <Typography variant="subtitle2" color="primary">
                      Change Pickup Location
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pickupAddress.address}
                    </Typography>
                  </Button>
                )}
              </Box>
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedStore.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedStore.tnc}
                </Typography>
              </Box>
            </Box>
          </Container>
          <StoreSelector
            open={storeSelectorStep2Open}
            onClose={() => setStoreSelectorStep2Open(false)}
            forceStep="pickup"
            initialStore={selectedStore}
          />
          <Products />
        </>
      )}
    </>
  );
};

export default Dashbaord;
