import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';

// GraphQL Queries and Mutations
const GET_ALL_STORES = `
  query GetAllStores {
    stores {
      id
      name
    }
  }
`;

const GET_PICKUP_ADDRESSES_BY_STORE = `
  query GetPickupAddressesByStore($storeId: Int!) {
    getPickupAddressesByStore(storeId: $storeId) {
      id
      storeId
      address
    }
  }
`;

const UPDATE_PICKUP_ADDRESS = `
  mutation UpdatePickupAddress($input: UpdatePickupAddressInput!) {
    updatePickupAddress(input: $input) {
      pickupAddress {
        id
        storeId
        address
      }
      error {
        message
      }
    }
  }
`;

const DELETE_PICKUP_ADDRESS = `
  mutation DeletePickupAddress($id: Int!) {
    deletePickupAddress(id: $id)
  }
`;

const ADD_PICKUP_ADDRESS = `
  mutation CreatePickupAddress($input: PickupAddressInput!) {
    createPickupAddress(input: $input) {
      pickupAddress {
        id
        storeId
        address
      }
      error {
        message
      }
    }
  }
`;

const EditDialog = ({
  open,
  onClose,
  selectedPickupAddress,
  onUpdate,
  isLoading,
  existingAddresses,
}) => {
  const [formData, setFormData] = useState({
    address: '',
  });
  const [error, setError] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);

  React.useEffect(() => {
    if (selectedPickupAddress) {
      setFormData({
        address: selectedPickupAddress.address || '',
      });
      setIsValidAddress(true);
    } else {
      setFormData({
        address: '',
      });
      setIsValidAddress(false);
    }
    setError('');
  }, [selectedPickupAddress]);

  const validateForm = () => {
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }

    if (!isValidAddress) {
      setError('Please select a valid address from the suggestions');
      return false;
    }

    // Check for duplicate address
    const isDuplicate = existingAddresses.some(
      (addr) =>
        addr.address.toLowerCase() === formData.address.toLowerCase() &&
        (!selectedPickupAddress || addr.id !== selectedPickupAddress.id)
    );

    if (isDuplicate) {
      setError('This address already exists for this store');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onUpdate({
        id: selectedPickupAddress?.id,
        ...formData,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {selectedPickupAddress ? 'Edit Pickup Address' : 'Add New Pickup Address'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AddressAutocomplete
            value={formData.address}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, address: value }));
              setError('');
            }}
            onValidAddress={setIsValidAddress}
          />
          {error && (
            <Typography color="error" variant="caption">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || !isValidAddress}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isLoading ? (selectedPickupAddress ? 'Updating...' : 'Adding...') : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PickupAddressManagement = () => {
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedPickupAddress, setSelectedPickupAddress] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all stores
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['getAllStores'],
    queryFn: () => fetchGraphQL(GET_ALL_STORES),
  });

  const stores = storesData?.stores || [];

  // Fetch pickup addresses for selected store
  const {
    data: pickupAddressesData,
    isLoading: pickupAddressesLoading,
    refetch: refetchPickupAddresses,
  } = useQuery({
    queryKey: ['getPickupAddressesByStore', selectedStore],
    queryFn: () =>
      fetchGraphQL(GET_PICKUP_ADDRESSES_BY_STORE, { storeId: parseInt(selectedStore) }),
    enabled: !!selectedStore,
  });

  const pickupAddresses = pickupAddressesData?.getPickupAddressesByStore || [];

  // Update pickup address mutation
  const updateMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(UPDATE_PICKUP_ADDRESS, {
        input: variables,
      });
    },
    onSuccess: (data, variables) => {
      // Update the pickup address in-place in the pickupAddresses list
      if (pickupAddressesData && pickupAddressesData.getPickupAddressesByStore) {
        pickupAddressesData.getPickupAddressesByStore.forEach((address) => {
          if (address.id === variables.id) {
            Object.assign(address, variables);
          }
        });
      }
      setEditModalOpen(false);
      setSelectedPickupAddress(null);
      setSuccessMessage('Pickup address updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error updating pickup address: ${error.message}`);
    },
  });

  // Delete pickup address mutation
  const deleteMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(DELETE_PICKUP_ADDRESS, variables);
    },
    onSuccess: () => {
      refetchPickupAddresses();
      setDeleteModalOpen(false);
      setSelectedPickupAddress(null);
      setSuccessMessage('Pickup address deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error deleting pickup address: ${error.message}`);
    },
  });

  // Add pickup address mutation
  const addMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(ADD_PICKUP_ADDRESS, {
        input: {
          ...variables,
          storeId: parseInt(selectedStore),
        },
      });
    },
    onSuccess: () => {
      refetchPickupAddresses();
      setEditModalOpen(false);
      setSelectedPickupAddress(null);
      setSuccessMessage('Pickup address added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error adding pickup address: ${error.message}`);
    },
  });

  const handleEditClick = (pickupAddress) => {
    setSelectedPickupAddress(pickupAddress);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (pickupAddress) => {
    setSelectedPickupAddress(pickupAddress);
    setDeleteModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedPickupAddress(null);
    setEditModalOpen(true);
  };

  if (storesLoading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Store Pickup Addresses Management
      </Typography>

      {/* Store Selection */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Store</InputLabel>
        <Select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          label="Select Store"
        >
          {stores.map((store) => (
            <MenuItem key={store.id} value={store.id}>
              {store.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Pickup Addresses Table */}
      {selectedStore && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5">Pickup Addresses</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={
                addMutation.isPending || addMutation.isLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <AddIcon />
                )
              }
              onClick={handleAddClick}
              disabled={addMutation.isPending || addMutation.isLoading}
            >
              {addMutation.isPending || addMutation.isLoading ? 'Adding...' : 'Add Pickup Address'}
            </Button>
          </Box>

          {pickupAddresses.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No pickup addresses found. Add your first pickup address to get started.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Address</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pickupAddresses.map((pickupAddress) => (
                    <TableRow key={pickupAddress.id}>
                      <TableCell>{pickupAddress.address}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditClick(pickupAddress)}
                          color="primary"
                          disabled={
                            updateMutation.isPending ||
                            updateMutation.isLoading ||
                            deleteMutation.isPending ||
                            deleteMutation.isLoading
                          }
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(pickupAddress)}
                          color="error"
                          disabled={
                            updateMutation.isPending ||
                            updateMutation.isLoading ||
                            deleteMutation.isPending ||
                            deleteMutation.isLoading
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Edit/Add Dialog */}
      <EditDialog
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedPickupAddress(null);
          setErrorMessage('');
        }}
        selectedPickupAddress={selectedPickupAddress}
        onUpdate={(data) => {
          if (selectedPickupAddress) {
            updateMutation.mutate(data);
          } else {
            addMutation.mutate(data);
          }
        }}
        isLoading={
          updateMutation.isPending ||
          updateMutation.isLoading ||
          addMutation.isPending ||
          addMutation.isLoading
        }
        existingAddresses={pickupAddresses}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedPickupAddress(null);
          setErrorMessage('');
        }}
      >
        <DialogTitle>Delete Pickup Address</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this pickup address? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedPickupAddress(null);
            }}
            disabled={deleteMutation.isPending || deleteMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate({ id: selectedPickupAddress.id })}
            disabled={deleteMutation.isPending || deleteMutation.isLoading}
            startIcon={
              deleteMutation.isPending || deleteMutation.isLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : null
            }
          >
            {deleteMutation.isPending || deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PickupAddressManagement;
