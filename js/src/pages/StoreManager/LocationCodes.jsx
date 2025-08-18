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
import { useAuthStore } from '@/store/useStore';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Layout from '@/components/StoreManager/Layout';

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

const GET_STORE_WITH_LOCATION_CODES = `
  query GetStoreWithLocationCodes($managerId: Int!) {
    storesByManager(managerUserId: $managerId) {
      id
      name
    }
  }
`;

const GET_LOCATION_CODES_BY_STORE = `
  query GetStoreLocationCodesByStore($storeId: Int!) {
    getStoreLocationCodesByStore(storeId: $storeId) {
      id
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
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isLoading ? (selectedLocationCode ? 'Updating...' : 'Adding...') : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const LocationCodes = () => {
  const [cognitoId, setCognitoId] = useState('');
  const { userProfile, setUserProfile } = useAuthStore();
  const [selectedLocationCode, setSelectedLocationCode] = useState(null);
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

  // Fetch store data with location codes
  const {
    data: storeData,
    isLoading: storeLoading,
    error: storeError,
  } = useQuery({
    queryKey: ['storeWithLocationCodes', userProfile?.id],
    queryFn: () => fetchGraphQL(GET_STORE_WITH_LOCATION_CODES, { managerId: userProfile?.id }),
    enabled: !!userProfile?.id,
  });

  const store = storeData?.storesByManager && storeData.storesByManager[0];

  // Add a new query for location codes
  const {
    data: locationCodesData,
    isLoading: locationCodesLoading,
    error: locationCodesError,
    refetch: refetchLocationCodes,
  } = useQuery({
    queryKey: ['getStoreLocationCodesByStore', store?.id],
    queryFn: () => fetchGraphQL(GET_LOCATION_CODES_BY_STORE, { storeId: store?.id }),
    enabled: !!store?.id,
  });

  const locationCodes = locationCodesData?.getStoreLocationCodesByStore || [];

  // Update location code mutation
  const updateMutation = useMutation({
    mutationFn: (variables) => {
      if (!store?.id) {
        throw new Error('Store not found');
      }
      return fetchGraphQL(UPDATE_LOCATION_CODE, {
        input: variables, // Only pass: id, location, code
      });
    },
    onSuccess: () => {
      refetchLocationCodes();
      setEditModalOpen(false);
      setSelectedLocationCode(null);
      setSuccessMessage('Location code updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error updating location code: ${error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
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
          storeId: store.id,
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

  if (profileLoading || storeLoading || locationCodesLoading) {
    return (
      <Layout>
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  if (storeError || locationCodesError) {
    return (
      <Layout>
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">
            Error loading data: {storeError?.message || locationCodesError?.message}
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <Typography variant="h4" gutterBottom>
          Store Location Codes Management
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

        {/* Location Codes Table */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5">Location Codes</Typography>
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
              {addMutation.isPending || addMutation.isLoading ? 'Adding...' : 'Add Location Code'}
            </Button>
          </Box>

          {locationCodes.length === 0 ? (
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
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Alert severity="info" sx={{ my: 2 }}>
                        No location codes found for this store.
                      </Alert>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
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
                        <IconButton
                          onClick={() => handleEditClick(locationCode)}
                          color="primary"
                          disabled={
                            updateMutation.isPending ||
                            updateMutation.isLoading ||
                            deleteMutation.isPending ||
                            deleteMutation.isLoading ||
                            addMutation.isPending ||
                            addMutation.isLoading
                          }
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(locationCode)}
                          color="error"
                          disabled={
                            updateMutation.isPending ||
                            updateMutation.isLoading ||
                            deleteMutation.isPending ||
                            deleteMutation.isLoading ||
                            addMutation.isPending ||
                            addMutation.isLoading
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
          isLoading={
            updateMutation.isPending ||
            updateMutation.isLoading ||
            addMutation.isPending ||
            addMutation.isLoading
          }
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
              disabled={deleteMutation.isPending || deleteMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => deleteMutation.mutate({ id: selectedLocationCode.id })}
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
    </Layout>
  );
};

export default LocationCodes;
