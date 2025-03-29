// In js/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import Products from './Products';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_ALL_STORES } from '@/queries/operations';
import useStore from '@/store/useStore';
import { Store as StoreIcon, LocationOn, MyLocation } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const Home = () => {
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const { selectedStore, setSelectedStore, availableStores, setAvailableStores } = useStore();
  const theme = useTheme();

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

  // Update the availableStores in the global store
  useEffect(() => {
    if (storesData?.stores && storesData.stores.length > 0) {
      setAvailableStores(storesData.stores);

      // If no store is selected, open store selector modal
      if (!selectedStore) {
        setStoreModalOpen(true);
      }
    }
  }, [storesData, selectedStore, setAvailableStores]);

  // Handle store selection
  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setStoreModalOpen(false);
  };

  // If still loading stores, show loading indicator
  if (storesLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Inline Store Selector Modal (without requiring a separate component) */}
      <Dialog
        open={storeModalOpen}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            background: theme.palette.custom.gradientPrimary,
            color: 'white',
            py: 2.5,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <StoreIcon />
            <Typography variant="h5" fontWeight={600}>
              Select a Store
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
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

          {storesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress size={50} />
            </Box>
          ) : storesError ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Typography color="error.main" sx={{ mb: 1, fontWeight: 500 }}>
                Error loading stores
              </Typography>
              <Typography variant="body2" color="error.main">
                {storesError.message}
              </Typography>
            </Paper>
          ) : availableStores.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderRadius: 2,
              }}
            >
              <Typography sx={{ fontWeight: 500, color: 'info.main' }}>
                No stores available at the moment.
              </Typography>
            </Paper>
          ) : (
            <List sx={{ mt: 1 }}>
              {availableStores.map((store) => (
                <Paper
                  key={store.id}
                  elevation={0}
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    border: '1px solid',
                    borderColor:
                      selectedStore?.id === store.id ? 'primary.main' : 'rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                >
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleStoreSelect(store)}
                      selected={selectedStore?.id === store.id}
                      sx={{
                        p: 0,
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box
                          sx={{
                            p: 2,
                            backgroundColor:
                              selectedStore?.id === store.id
                                ? 'rgba(0, 0, 0, 0.02)'
                                : 'transparent',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar
                              sx={{
                                bgcolor:
                                  selectedStore?.id === store.id ? 'primary.main' : 'grey.300',
                                mr: 2,
                              }}
                            >
                              <StoreIcon />
                            </Avatar>
                            <Box>
                              <Typography fontWeight={600} fontSize="1.1rem">
                                {store.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <LocationOn
                                  sx={{
                                    fontSize: '0.9rem',
                                    color: 'text.secondary',
                                    mr: 0.5,
                                  }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                  {store.address}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {store.radius && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Chip
                                icon={<MyLocation fontSize="small" />}
                                label={`${store.radius} km radius`}
                                size="small"
                                variant="outlined"
                                color={selectedStore?.id === store.id ? 'primary' : 'default'}
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Only show Products when a store is selected */}
      {selectedStore && <Products />}
    </>
  );
};

export default Home;
