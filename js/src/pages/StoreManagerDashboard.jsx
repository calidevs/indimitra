import React, { useState, useEffect, useRef } from 'react';
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
  FormControl,
  InputLabel,
  TextField,
  CircularProgress,
  Collapse,
  Box,
  Select,
  MenuItem,
  Grid,
  Alert,
  Popper,
  ClickAwayListener,
  MenuList,
  ListItemText,
  ListItemIcon,
  TablePagination,
  Snackbar,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Edit,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Add,
  Store as StoreIcon,
  Delete,
  CloudUpload,
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { useAuthStore } from '@/store/useStore';
import { fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import {
  GET_USER_PROFILE,
  GET_STORE_WITH_INVENTORY,
  UPDATE_INVENTORY_ITEM,
  ADD_PRODUCT_TO_INVENTORY,
} from '@/queries/operations';
import Layout from '@/components/StoreManager/Layout';

// GraphQL query for Square status
const STORE_SQUARE_STATUS = `
  query StoreSquareStatus($storeId: Int!) {
    storeSquareStatus(storeId: $storeId) {
      storeId
      storeName
      isConnected
    }
  }
`;

// Update the UPDATE_STORE mutation
const UPDATE_STORE = `
  mutation UpdateStore(
    $storeId: Int!
    $name: String
    $address: String
    $email: String
    $mobile: String
    $radius: Float
    $isActive: Boolean
    $description: String
    $pincodes: [String!]
    $tnc: String
    $storeDeliveryFee: Float
    $taxPercentage: Float
    $displayField: String
    $sectionHeaders: [String!]
    $images: [String!]
    $whatsappNumber: String
  ) {
    updateStore(
      storeId: $storeId
      name: $name
      address: $address
      email: $email
      mobile: $mobile
      radius: $radius
      isActive: $isActive
      description: $description
      pincodes: $pincodes
      tnc: $tnc
      storeDeliveryFee: $storeDeliveryFee
      taxPercentage: $taxPercentage
      displayField: $displayField
      sectionHeaders: $sectionHeaders
      images: $images
      whatsappNumber: $whatsappNumber
    ) {
      id
      name
      address
      email
      mobile
      radius
      isActive
      description
      pincodes
      tnc
      storeDeliveryFee
      taxPercentage
      displayField
      sectionHeaders
      images
      whatsappNumber
    }
  }
`;

const StoreManagerDashboard = () => {
  const [cognitoId, setCognitoId] = useState('');
  const { userProfile, setUserProfile } = useAuthStore();
  const [selectedItem, setSelectedItem] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addQuantity, setAddQuantity] = useState('');
  const [addSize, setAddSize] = useState('');
  const [addUnit, setAddUnit] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = useRef(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [editStore, setEditStore] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editSectionHeaders, setEditSectionHeaders] = useState([]);
  const [storeStatus, setStoreStatus] = useState(true);
  const [editStoreImages, setEditStoreImages] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch Cognito ID on component mount
  useEffect(() => {
    let mounted = true;
    const getUserInfo = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
        if (mounted) {
          setCognitoId(userAttributes.sub);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    getUserInfo();
    return () => {
      mounted = false;
    };
  }, []);

  // Set isInitialLoad to false after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000); // Increased timeout to ensure smooth transition

    return () => clearTimeout(timer);
  }, []);

  // Fetch user profile using Cognito ID
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['getUserProfile', cognitoId],
    queryFn: async () => {
      if (!cognitoId) return null;
      const response = await fetchGraphQL(GET_USER_PROFILE, { userId: cognitoId });
      return response;
    },
    enabled: !!cognitoId,
  });

  // Update user profile when profile data changes
  useEffect(() => {
    if (profileData?.getUserProfile && !userProfile) {
      setUserProfile(profileData.getUserProfile);
    }
  }, [profileData, userProfile, setUserProfile]);

  // Fetch store, inventory, and products data in a single query
  const {
    data: storeData,
    isLoading: storeLoading,
    error: storeError,
    refetch: refetchStoreData,
  } = useQuery({
    queryKey: ['storeWithInventory', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;
      return fetchGraphQL(GET_STORE_WITH_INVENTORY, { managerId: userProfile.id });
    },
    enabled: !!userProfile?.id,
  });

  // Extract store, inventory, and products from the combined query response
  const store = storeData?.storesByManager?.[0] || null;
  const inventory = store?.inventory?.edges?.map((edge) => edge.node) || [];
  const availableProducts = storeData?.products || [];

  // Fetch Square connection status
  const {
    data: squareStatusData,
    isLoading: squareStatusLoading,
  } = useQuery({
    queryKey: ['storeSquareStatus', store?.id],
    queryFn: () => fetchGraphQL(STORE_SQUARE_STATUS, { storeId: store?.id }),
    enabled: !!store?.id,
  });

  const isSquareConnected = squareStatusData?.storeSquareStatus?.isConnected || false;

  // Update filtered products when search input or available products change
  useEffect(() => {
    if (!availableProducts.length) return;

    if (searchInput.trim() === '') {
      setFilteredProducts(availableProducts);
    } else {
      const filtered = availableProducts.filter((product) =>
        product.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchInput, availableProducts]);

  // Add the update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: (variables) => {
      return fetchGraphQL(UPDATE_STORE, variables);
    },
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Store updated successfully',
        severity: 'success',
      });
      setEditStore(null);
      refetchStoreData();
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: 'Failed to update store: ' + error.message,
        severity: 'error',
      });
    },
  });

  const handleEditClick = () => {
    if (!store) return;
    setEditStore(store);
    setEditSectionHeaders(store.sectionHeaders || []);
    setEditStoreImages(store.images || []);
    setStoreStatus(store.isActive);
  };

  const handleCloseEdit = () => {
    setEditStore(null);
    setEditSectionHeaders([]);
    setEditStoreImages([]);
    setStoreStatus(true);
  };

  const handleSectionHeaderChange = (index, value) => {
    setEditSectionHeaders((prev) => {
      const newHeaders = [...prev];
      newHeaders[index] = value;
      return newHeaders;
    });
  };

  const addSectionHeader = () => {
    setEditSectionHeaders((prev) => [...prev, '']);
  };

  const removeSectionHeader = (index) => {
    setEditSectionHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStoreStatusChange = (event) => {
    setStoreStatus(event.target.value);
  };

  const handleImageUpload = async (file) => {
    if (!file || !editStore?.id) return;

    setIsUploadingImage(true);
    try {
      const baseUrl = window.location.href?.includes('http://localhost')
        ? 'http://127.0.0.1:8000'
        : 'https://indimitra.com';
      
      // Get authentication token
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(
        `${baseUrl}/s3/generate-store-upload-url?store_id=${editStore.id}&file_name=${encodeURIComponent(file.name)}`,
        {
          method: 'GET',
          headers: headers,
        }
      );

      if (!res.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to get upload URL';
        try {
          const errorData = await res.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const { upload_url, content_type, key } = await res.json();

      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': content_type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image');
      }

      const publicUrl = `https://indimitra-dev-order-files.s3.amazonaws.com/${key}`;
      setEditStoreImages((prev) => [...prev, publicUrl]);

      setSnackbar({
        open: true,
        message: 'Image uploaded successfully!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Upload error:', err);
      setSnackbar({
        open: true,
        message: 'Failed to upload image. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (index) => {
    setEditStoreImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateStore = (e) => {
    e.preventDefault();
    if (!editStore) return;

    const formData = new FormData(e.target);

    // Convert pincodes string to array and ensure no empty strings
    const pincodesString = formData.get('pincodes');
    const pincodes = pincodesString
      ? pincodesString
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      : [];

    // Convert string values to appropriate types
    const updateData = {
      storeId: editStore.id,
      name: formData.get('name'),
      address: formData.get('address'),
      email: formData.get('email'),
      mobile: formData.get('mobile') || null,
      radius: parseFloat(formData.get('radius')),
      isActive: formData.get('isActive') === 'true',
      description: formData.get('description') || null,
      pincodes: pincodes,
      tnc: formData.get('tnc') || null,
      storeDeliveryFee: parseFloat(formData.get('storeDeliveryFee')) || null,
      taxPercentage: parseFloat(formData.get('taxPercentage')) || null,
      displayField: formData.get('displayField'),
      sectionHeaders: editSectionHeaders.filter((header) => header.trim().length > 0),
      images: editStoreImages,
      whatsappNumber: formData.get('whatsappNumber') || null,
    };

    updateStoreMutation.mutate(updateData);
  };

  // Check loading state first
  if (profileLoading || storeLoading || isInitialLoad || !store) {
    return (
      <Layout>
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  // Check for errors
  if (storeError) {
    return (
      <Layout>
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">Error loading store data: {storeError.message}</Alert>
        </Container>
      </Layout>
    );
  }

  // Check if store exists and initial load is complete
  if (!store && !isInitialLoad) {
    return (
      <Layout>
        <Container sx={{ mt: 4 }}>
          <Alert severity="warning">
            No store found. You are not assigned as a manager to any store.
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Store Manager Dashboard
        </Typography>

        {/* Store Information Card */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h5">Store Information</Typography>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleEditClick}
              sx={{ textTransform: 'none' }}
            >
              Edit Store
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Name:</strong> {store.name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Address:</strong> {store.address}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Delivery Radius:</strong> {store.radius || 'Not set'}{' '}
                {store.radius ? 'mi' : ''}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Delivery Fee:</strong> ${store.storeDeliveryFee?.toFixed(2) || '0.00'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Tax Rate:</strong> {store.taxPercentage?.toFixed(1) || '0.0'}%
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Total Products:</strong> {inventory.filter(item => item.isListed).length}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Display Field:</strong> {store.displayField}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Square Payment:</strong>{' '}
                <Chip
                  size="small"
                  label={isSquareConnected ? "Connected" : "Not Connected"}
                  color={isSquareConnected ? "success" : "default"}
                />
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Cash on Delivery:</strong>{' '}
                <Chip
                  size="small"
                  label={store?.codEnabled ? "Enabled" : "Disabled"}
                  color={store?.codEnabled ? "success" : "default"}
                />
              </Typography>
            </Grid>
            {store.whatsappNumber && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>WhatsApp:</strong> {store.whatsappNumber}
                </Typography>
              </Grid>
            )}
            {store.description && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  <strong>Description:</strong> {store.description}
                </Typography>
              </Grid>
            )}
            {store.pincodes && store.pincodes.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  <strong>Delivery Pincodes:</strong> {store.pincodes.join(', ')}
                </Typography>
              </Grid>
            )}
            {store.sectionHeaders && store.sectionHeaders.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Section Headers:</strong>
                </Typography>
                <Box sx={{ pl: 2 }}>
                  {store.sectionHeaders.map((header, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      • {header}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Edit Store Modal */}
        <Dialog open={!!editStore} onClose={handleCloseEdit} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StoreIcon />
              <Typography variant="h6">Edit Store</Typography>
            </Box>
          </DialogTitle>
          <form onSubmit={handleUpdateStore}>
            <DialogContent>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                    Basic Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="name"
                    label="Store Name"
                    defaultValue={editStore?.name}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    defaultValue={editStore?.email}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="mobile"
                    label="Mobile Number"
                    defaultValue={editStore?.mobile}
                    fullWidth
                  />
                </Grid>

                {/* Location & Delivery */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 2, fontWeight: 600, mt: 2 }}
                  >
                    Location & Delivery
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="address"
                    label="Address"
                    defaultValue={editStore?.address}
                    required
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="radius"
                    label="Delivery Radius (mi)"
                    type="number"
                    defaultValue={editStore?.radius}
                    required
                    fullWidth
                    inputProps={{ step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="storeDeliveryFee"
                    label="Delivery Fee ($)"
                    type="number"
                    defaultValue={editStore?.storeDeliveryFee}
                    fullWidth
                    inputProps={{ step: '0.01', min: 0 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="taxPercentage"
                    label="Tax Rate (%)"
                    type="number"
                    defaultValue={editStore?.taxPercentage}
                    fullWidth
                    inputProps={{ step: '0.1', min: 0 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="pincodes"
                    label="Delivery Pincodes"
                    defaultValue={editStore?.pincodes?.join(', ')}
                    fullWidth
                    helperText="Enter pincodes separated by commas"
                  />
                </Grid>

                {/* Additional Information */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 2, fontWeight: 600, mt: 2 }}
                  >
                    Additional Information
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="Description"
                    defaultValue={editStore?.description}
                    fullWidth
                    multiline
                    rows={2}
                    helperText="Store timings and other details"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="tnc"
                    label="Terms & Conditions"
                    defaultValue={editStore?.tnc}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="whatsappNumber"
                    label="WhatsApp Support Number"
                    placeholder="+1234567890"
                    defaultValue={editStore?.whatsappNumber}
                    fullWidth
                    helperText="Include country code. Optional."
                  />
                </Grid>

                {/* Display Field */}
                <Grid item xs={12}>
                  <TextField
                    name="displayField"
                    label="Display Field"
                    defaultValue={editStore?.displayField}
                    required
                    fullWidth
                    helperText="Unique identifier for the store"
                  />
                </Grid>

                {/* Section Headers */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Section Headers
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {editSectionHeaders.map((header, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          fullWidth
                          label={`Question ${index + 1}`}
                          value={header}
                          onChange={(e) => handleSectionHeaderChange(index, e.target.value)}
                          placeholder="Enter question text"
                          inputProps={{ 'aria-label': `Question ${index + 1}` }}
                        />
                        <IconButton
                          color="error"
                          onClick={() => removeSectionHeader(index)}
                          sx={{ alignSelf: 'center' }}
                          aria-label="Remove question"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      startIcon={<Add />}
                      onClick={addSectionHeader}
                      variant="outlined"
                      sx={{ mt: 1 }}
                      aria-label="Add question"
                    >
                      Add Question
                    </Button>
                  </Box>
                </Grid>

                {/* Store Images */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 2, fontWeight: 600, mt: 2 }}
                  >
                    Store Images / Offers Banner
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="edit-store-image-upload"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleImageUpload(file);
                        e.target.value = '';
                      }}
                    />
                    <label htmlFor="edit-store-image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={isUploadingImage ? <CircularProgress size={16} /> : <CloudUpload />}
                        disabled={isUploadingImage}
                        sx={{ mb: 2 }}
                      >
                        {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                      </Button>
                    </label>
                    {editStoreImages.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {editStoreImages.map((imageUrl, index) => (
                          <Box key={index} sx={{ position: 'relative', width: 150, height: 150 }}>
                            <img
                              src={imageUrl}
                              alt={`Store image ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 4,
                              }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveImage(index)}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Store Status */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ mb: 2, fontWeight: 600, mt: 2 }}
                  >
                    Store Status
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Store Status</InputLabel>
                    <Select
                      name="isActive"
                      label="Store Status"
                      value={storeStatus}
                      onChange={handleStoreStatusChange}
                    >
                      <MenuItem value={true}>Active</MenuItem>
                      <MenuItem value={false}>Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={handleCloseEdit}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={updateStoreMutation.isPending}
                startIcon={updateStoreMutation.isPending ? <CircularProgress size={20} /> : null}
              >
                {updateStoreMutation.isPending ? 'Updating...' : 'Update Store'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Success/Error Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
};

export default StoreManagerDashboard;
