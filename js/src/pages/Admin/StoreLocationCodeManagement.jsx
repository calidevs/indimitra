import React, { useState, useEffect } from 'react';
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

// GraphQL Queries and Mutations
const GET_ALL_STORES = `
  query GetAllStores {
    stores {
      id
      name
    }
  }
`;

const GET_LOCATION_CODES_BY_STORE = `
  query GetStoreLocationCodesByStore($storeId: Int!) {
    getStoreLocationCodesByStore(storeId: $storeId) {
      id
      storeId
      location
      code
    }
  }
`;

const UPDATE_LOCATION_CODE = `
  mutation UpdateStoreLocationCode($input: UpdateStoreLocationCodeInput!) {
    updateStoreLocationCode(input: $input) {
      locationCode {
        id
        storeId
        location
        code
      }
      error {
        message
      }
    }
  }
`;

const DELETE_LOCATION_CODE = `
  mutation DeleteStoreLocationCode($id: Int!) {
    deleteStoreLocationCode(id: $id)
  }
`;

const ADD_LOCATION_CODE = `
  mutation CreateStoreLocationCode($input: CreateStoreLocationCodeInput!) {
    createStoreLocationCode(input: $input) {
      locationCode {
        id
        storeId
        location
        code
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
  selectedLocationCode,
  onUpdate,
  isLoading,
  existingCodes,
}) => {
  const [formData, setFormData] = useState({
    location: '',
    code: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedLocationCode) {
      setFormData({
        location: selectedLocationCode.location || '',
        code: selectedLocationCode.code || '',
      });
    } else {
      setFormData({
        location: '',
        code: '',
      });
    }
    setError('');
  }, [selectedLocationCode, open]);

  const handleClose = () => {
    setFormData({
      location: '',
      code: '',
    });
    setError('');
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }
    if (!formData.code.trim()) {
      setError('Code is required');
      return false;
    }

    // Check for duplicate code
    const isDuplicate = existingCodes.some(
      (code) =>
        code.code.toLowerCase() === formData.code.toLowerCase() &&
        (!selectedLocationCode || code.id !== selectedLocationCode.id)
    );

    if (isDuplicate) {
      setError('This code already exists for this store');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onUpdate({
        id: selectedLocationCode?.id,
        ...formData,
      });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {selectedLocationCode ? 'Edit Location Code' : 'Add New Location Code'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            name="location"
            label="Location"
            value={formData.location}
            onChange={handleChange}
            fullWidth
            placeholder="e.g., Main Branch"
            error={!!error && error.includes('Location')}
            helperText={error && error.includes('Location') ? error : ''}
          />

          <TextField
            name="code"
            label="Code"
            value={formData.code}
            onChange={handleChange}
            fullWidth
            placeholder="e.g., MB001"
            error={!!error && (error.includes('Code') || error.includes('already exists'))}
            helperText={
              error && (error.includes('Code') || error.includes('already exists')) ? error : ''
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const StoreLocationCodeManagement = () => {
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedLocationCode, setSelectedLocationCode] = useState(null);
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

  // Fetch location codes for selected store
  const {
    data: locationCodesData,
    isLoading: locationCodesLoading,
    refetch: refetchLocationCodes,
  } = useQuery({
    queryKey: ['getStoreLocationCodesByStore', selectedStore],
    queryFn: () => fetchGraphQL(GET_LOCATION_CODES_BY_STORE, { storeId: parseInt(selectedStore) }),
    enabled: !!selectedStore,
  });

  const locationCodes = locationCodesData?.getStoreLocationCodesByStore || [];

  // Update location code mutation
  const updateMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(UPDATE_LOCATION_CODE, {
        input: variables,
      });
    },
    onSuccess: (data, variables) => {
      // Update the location code in-place in the locationCodes list
      if (locationCodesData && locationCodesData.getStoreLocationCodesByStore) {
        locationCodesData.getStoreLocationCodesByStore.forEach((code) => {
          if (code.id === variables.id) {
            Object.assign(code, variables);
          }
        });
      }
      setEditModalOpen(false);
      setSelectedLocationCode(null);
      setSuccessMessage('Location code updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error updating location code: ${error.message}`);
    },
  });

  // Delete location code mutation
  const deleteMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(DELETE_LOCATION_CODE, variables);
    },
    onSuccess: () => {
      refetchLocationCodes();
      setDeleteModalOpen(false);
      setSelectedLocationCode(null);
      setSuccessMessage('Location code deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error deleting location code: ${error.message}`);
    },
  });

  // Add location code mutation
  const addMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(ADD_LOCATION_CODE, {
        input: {
          ...variables,
          storeId: parseInt(selectedStore),
        },
      });
    },
    onSuccess: () => {
      refetchLocationCodes();
      setEditModalOpen(false);
      setSelectedLocationCode(null);
      setSuccessMessage('Location code added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error adding location code: ${error.message}`);
    },
  });

  const handleEditClick = (locationCode) => {
    setSelectedLocationCode(locationCode);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (locationCode) => {
    setSelectedLocationCode(locationCode);
    setDeleteModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedLocationCode(null);
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
        Store Location Codes Management
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

      {/* Initial message when no store is selected */}
      {!selectedStore && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            Please select a store from the dropdown above to view and manage its location codes.
          </Typography>
        </Alert>
      )}

      {/* Location Codes Table */}
      {selectedStore && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5">Location Codes</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              Add Location Code
            </Button>
          </Box>

          {locationCodesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : locationCodes.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No location codes found for this store. Add your first location code to get started.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Location</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locationCodes.map((locationCode) => (
                    <TableRow key={locationCode.id}>
                      <TableCell>{locationCode.location}</TableCell>
                      <TableCell>{locationCode.code}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditClick(locationCode)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(locationCode)} color="error">
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
          setSelectedLocationCode(null);
          setErrorMessage('');
        }}
        selectedLocationCode={selectedLocationCode}
        onUpdate={(data) => {
          if (selectedLocationCode) {
            updateMutation.mutate(data);
          } else {
            addMutation.mutate(data);
          }
        }}
        isLoading={updateMutation.isLoading || addMutation.isLoading}
        existingCodes={locationCodes}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedLocationCode(null);
          setErrorMessage('');
        }}
      >
        <DialogTitle>Delete Location Code</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this location code? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedLocationCode(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate({ id: selectedLocationCode.id })}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StoreLocationCodeManagement;
