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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { useAuthStore } from '@/store/useStore';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Layout from '@/components/StoreManager/Layout';
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';

// GraphQL Queries and Mutations
const GET_USER_PROFILE = `
  query GetUserProfile($userId: String!) {
    getUserProfile(userId: $userId) {
      id
      email
      mobile
      active
      type
      referralId
    }
  }
`;

const GET_STORE_WITH_PICKUP_ADDRESSES = `
  query GetStoreWithPickupAddresses($managerId: Int!) {
    storesByManager(managerUserId: $managerId) {
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

  useEffect(() => {
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
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PickupAddresses = () => {
  const [cognitoId, setCognitoId] = useState('');
  const { userProfile, setUserProfile } = useAuthStore();
  const [selectedPickupAddress, setSelectedPickupAddress] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Cognito ID on component mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
        setCognitoId(userAttributes.sub);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    getUserInfo();
  }, []);

  // Fetch user profile using Cognito ID
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['getUserProfile', cognitoId],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_USER_PROFILE, { userId: cognitoId });
      if (response?.getUserProfile) {
        setUserProfile(response.getUserProfile);
      }
      return response;
    },
    enabled: !!cognitoId,
  });

  // Fetch store data
  const {
    data: storeData,
    isLoading: storeLoading,
    error: storeError,
  } = useQuery({
    queryKey: ['storeWithPickupAddresses', userProfile?.id],
    queryFn: () => fetchGraphQL(GET_STORE_WITH_PICKUP_ADDRESSES, { managerId: userProfile?.id }),
    enabled: !!userProfile?.id,
  });

  const store = storeData?.storesByManager && storeData.storesByManager[0];

  // Fetch pickup addresses for the store
  const {
    data: pickupAddressesData,
    isLoading: pickupAddressesLoading,
    error: pickupAddressesError,
    refetch: refetchPickupAddresses,
  } = useQuery({
    queryKey: ['getPickupAddressesByStore', store?.id],
    queryFn: () => fetchGraphQL(GET_PICKUP_ADDRESSES_BY_STORE, { storeId: store?.id }),
    enabled: !!store?.id,
  });

  const pickupAddresses = pickupAddressesData?.getPickupAddressesByStore || [];

  // Update pickup address mutation
  const updateMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(UPDATE_PICKUP_ADDRESS, {
        input: variables,
      });
    },
    onSuccess: () => {
      refetchPickupAddresses();
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
          storeId: store.id,
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

  if (profileLoading || storeLoading || pickupAddressesLoading) {
    return (
      <Layout>
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  if (storeError || pickupAddressesError) {
    return (
      <Layout>
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">
            Error loading data: {storeError?.message || pickupAddressesError?.message}
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Typography variant="h4" gutterBottom>
          Store Pickup Addresses Management
        </Typography>

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
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5">Pickup Addresses</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              Add Pickup Address
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
                        <IconButton onClick={() => handleEditClick(pickupAddress)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(pickupAddress)} color="error">
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
          isLoading={updateMutation.isLoading || addMutation.isLoading}
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
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => deleteMutation.mutate({ id: selectedPickupAddress.id })}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default PickupAddresses;
