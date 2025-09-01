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

const GET_FEES_BY_STORE = `
  query GetFeesByStore($storeId: Int!) {
    getFeesByStore(storeId: $storeId) {
      id
      feeCurrency
      feeRate
      limit
      storeId
      type
    }
  }
`;

const UPDATE_FEE = `
  mutation UpdateFee($input: UpdateFeeInput!) {
    updateFee(input: $input) {
      fee {
        id
        feeCurrency
        feeRate
        limit
        storeId
        type
      }
      error {
        message
      }
    }
  }
`;

const DELETE_FEE = `
  mutation DeleteFee($id: Int!) {
    deleteFee(id: $id)
  }
`;

const ADD_FEE = `
  mutation CreateFee($input: CreateFeeInput!) {
    createFee(input: $input) {
      fee {
        id
        feeCurrency
        feeRate
        limit
        storeId
        type
      }
      error {
        message
      }
    }
  }
`;

const EditDialog = ({ open, onClose, selectedFee, onUpdate, isLoading }) => {
  const initialFormData = {
    feeCurrency: '',
    feeRate: '',
    limit: '',
    type: 'DELIVERY',
  };
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (selectedFee) {
      setFormData({
        feeCurrency: selectedFee.feeCurrency || '',
        feeRate: selectedFee.feeRate?.toString() || '',
        limit: selectedFee.limit?.toString() || '',
        type: selectedFee.type?.toUpperCase() || 'DELIVERY',
      });
    } else if (open) {
      setFormData(initialFormData);
    }
  }, [selectedFee, open]);

  useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    onUpdate({
      id: selectedFee?.id,
      ...formData,
      feeRate: parseFloat(formData.feeRate),
      limit: parseFloat(formData.limit),
    });
    if (!selectedFee) {
      setFormData(initialFormData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{selectedFee ? 'Edit Fee' : 'Add New Fee'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Fee Type</InputLabel>
            <Select name="type" value={formData.type} onChange={handleChange} label="Fee Type">
              <MenuItem value="DELIVERY">Delivery Fee</MenuItem>
              <MenuItem value="PICKUP">Pickup Fee</MenuItem>
            </Select>
          </FormControl>

          <TextField
            name="feeCurrency"
            label="Currency"
            value={formData.feeCurrency}
            onChange={handleChange}
            fullWidth
            placeholder="e.g., USD"
          />

          <TextField
            name="feeRate"
            label="Fee Rate"
            type="number"
            value={formData.feeRate}
            onChange={handleChange}
            fullWidth
            inputProps={{ step: '0.01', min: '0' }}
          />

          <TextField
            name="limit"
            label="Limit"
            type="number"
            value={formData.limit}
            onChange={handleChange}
            fullWidth
            inputProps={{ step: '0.01', min: '0' }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isLoading ? (selectedFee ? 'Updating...' : 'Adding...') : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FeesManagement = () => {
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedFee, setSelectedFee] = useState(null);
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

  // Fetch fees for selected store
  const {
    data: feesData,
    isLoading: feesLoading,
    refetch: refetchFees,
  } = useQuery({
    queryKey: ['getFeesByStore', selectedStore],
    queryFn: () => fetchGraphQL(GET_FEES_BY_STORE, { storeId: parseInt(selectedStore) }),
    enabled: !!selectedStore,
  });

  const fees = feesData?.getFeesByStore || [];

  // Update fee mutation
  const updateMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(UPDATE_FEE, {
        input: variables,
      });
    },
    onSuccess: (data, variables) => {
      // Fix: Use feesData.getFeesByStore instead of feesData directly
      if (feesData && feesData.getFeesByStore) {
        feesData.getFeesByStore.forEach((fee) => {
          if (fee.id === variables.id) {
            Object.assign(fee, variables);
          }
        });
      }
      setEditModalOpen(false);
      setSelectedFee(null);
      setSuccessMessage('Fee updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error updating fee: ${error.message}`);
    },
  });

  // Delete fee mutation
  const deleteMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(DELETE_FEE, variables);
    },
    onSuccess: () => {
      refetchFees();
      setDeleteModalOpen(false);
      setSelectedFee(null);
      setSuccessMessage('Fee deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error deleting fee: ${error.message}`);
    },
  });

  // Add fee mutation
  const addMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(ADD_FEE, {
        input: {
          ...variables,
          storeId: parseInt(selectedStore),
        },
      });
    },
    onSuccess: () => {
      refetchFees();
      setEditModalOpen(false);
      setSelectedFee(null);
      setSuccessMessage('Fee added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error adding fee: ${error.message}`);
    },
  });

  const handleEditClick = (fee) => {
    setSelectedFee(fee);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (fee) => {
    setSelectedFee(fee);
    setDeleteModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedFee(null);
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
        Fees Management
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
            Please select a store from the dropdown above to view and manage its fees.
          </Typography>
        </Alert>
      )}

      {/* Fees Table */}
      {selectedStore && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5">Fees</Typography>
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
              {addMutation.isPending || addMutation.isLoading ? 'Adding...' : 'Add Fee'}
            </Button>
          </Box>

          {feesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : fees.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No fees found for this store. Add your first fee to get started.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>Limit</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fees.length === 0 && !feesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Alert severity="info" sx={{ my: 2 }}>
                          No fees found for this store.
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>{fee.type}</TableCell>
                        <TableCell>{fee.feeCurrency}</TableCell>
                        <TableCell>{fee.feeRate}</TableCell>
                        <TableCell>{fee.limit}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleEditClick(fee)}
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
                            onClick={() => handleDeleteClick(fee)}
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
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      <EditDialog
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedFee(null);
          setErrorMessage('');
        }}
        selectedFee={selectedFee}
        onUpdate={(data) => {
          if (selectedFee) {
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
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedFee(null);
          setErrorMessage('');
        }}
      >
        <DialogTitle>Delete Fee</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this fee? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedFee(null);
            }}
            disabled={deleteMutation.isPending || deleteMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate({ id: selectedFee.id })}
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

export default FeesManagement;
