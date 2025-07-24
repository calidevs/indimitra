// In js/src/pages/Dashbaord.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, LoadingSpinner, Container, Typography, Button } from '@components';
import { Paper, FormControlLabel, Switch } from '@mui/material';
import Products from '../Products';
import ListInput from './ListInput';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_ALL_STORES } from '@/queries/operations';
import useStore from '@/store/useStore';
import StoreSelector from './StoreSelector';

const Dashbaord = () => {
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeSelectorStep2Open, setStoreSelectorStep2Open] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const {
    selectedStore,
    setAvailableStores,
    setSelectedStore,
    pickupAddress,
    setCustomOrder,
    listInputAnswers,
    setListInputAnswers,
  } = useStore();

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

  const handleToggleView = () => {
    setIsManualMode(!isManualMode);
  };

  if (storesLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <LoadingSpinner />
      </Box>
    );
  }

  const hasSectionHeaders = selectedStore?.sectionHeaders?.length > 0;

  return (
    <>
      <StoreSelector open={storeModalOpen} onClose={() => setStoreModalOpen(false)} />
      {selectedStore && (
        <>
          <Container>
            <Box
              sx={{
                alignItems: 'center',
                mb: { xs: 2, sm: 3 },
                mt: { xs: 1, sm: 2 },
                p: { xs: 1, sm: 2 },
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  width: '100%',
                  gap: { xs: 1.5, sm: 0 },
                }}
              >
                <Box sx={{ mb: { xs: 1, sm: 0 } }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>{selectedStore.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
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
                      alignItems: { xs: 'flex-start', sm: 'flex-end' },
                      minWidth: { xs: 0, sm: 180 },
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      mt: { xs: 1, sm: 0 },
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.5, sm: 1 },
                    }}
                    onClick={() => setStoreSelectorStep2Open(true)}
                  >
                    <Typography variant="subtitle2" color="primary" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                      Change Pickup Location
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                      {pickupAddress.address}
                    </Typography>
                  </Button>
                )}
              </Box>
              <Box sx={{ mt: 1, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: { xs: 0.5, sm: 2 } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                  {selectedStore.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
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
          <Container>
            {hasSectionHeaders && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  mb: { xs: 2, sm: 3 },
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  borderRadius: 2,
                  minHeight: { xs: 56, sm: 72 },
                }}
              >
                <Box
                  sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 } }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {isManualMode ? 'Browse Products' : 'Quick List Entry'}
                  </Typography>
                  <Box
                    sx={{
                      minWidth: { xs: 0, sm: 200 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isManualMode}
                          onChange={handleToggleView}
                          color="primary"
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            width: 140,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: { xs: '0.95rem', sm: '1rem' },
                          }}
                        >
                          {isManualMode ? 'Manual Browse' : 'Quick List'}
                        </Typography>
                      }
                      labelPlacement="end"
                      sx={{ marginLeft: { xs: 0, sm: 2 } }}
                    />
                  </Box>
                </Box>
              </Paper>
            )}
            {hasSectionHeaders && !isManualMode ? (
              <ListInput
                sectionHeaders={selectedStore.sectionHeaders}
                answers={listInputAnswers}
                onChangeAnswers={setListInputAnswers}
                onSubmit={setCustomOrder}
              />
            ) : (
              <Products />
            )}
          </Container>
        </>
      )}
    </>
  );
};

export default Dashbaord;
