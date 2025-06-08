import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Store as StoreIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as AttachMoneyIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_STORES } from '@/queries/operations';

// Define the GraphQL mutation for creating a store
const CREATE_STORE = `
  mutation CreateStore(
    $name: String!
    $address: String!
    $managerUserId: Int!
    $radius: Float!
    $email: String!
    $mobile: String!
    $description: String
    $storeDeliveryFee: Float
    $taxPercentage: Float
    $tnc: String
    $displayField: String!
    $sectionHeaders: [String!]
    $pincodes: [String!]
  ) {
    createStore(
      name: $name
      address: $address
      managerUserId: $managerUserId
      radius: $radius
      email: $email
      mobile: $mobile
      description: $description
      storeDeliveryFee: $storeDeliveryFee
      taxPercentage: $taxPercentage
      tnc: $tnc
      displayField: $displayField
      sectionHeaders: $sectionHeaders
      pincodes: $pincodes
    ) {
      id
      name
      address
      email
      mobile
      managerUserId
      radius
      description
      storeDeliveryFee
      taxPercentage
      tnc
      displayField
      sectionHeaders
      pincodes
    }
  }
`;

// Add the mutation
const UPDATE_STORE = `
  mutation UpdateStore(
    $storeId: Int!
    $name: String
    $address: String
    $email: String
    $mobile: String
    $managerUserId: Int
    $radius: Float
    $isActive: Boolean
    $disabled: Boolean
    $description: String
    $pincodes: [String!]
    $tnc: String
    $storeDeliveryFee: Float
    $taxPercentage: Float
  ) {
    updateStore(
      storeId: $storeId
      name: $name
      address: $address
      email: $email
      mobile: $mobile
      managerUserId: $managerUserId
      radius: $radius
      isActive: $isActive
      disabled: $disabled
      description: $description
      pincodes: $pincodes
      tnc: $tnc
      storeDeliveryFee: $storeDeliveryFee
      taxPercentage: $taxPercentage
    ) {
      id
      name
      address
      email
      mobile
      managerUserId
      radius
      isActive
      disabled
      description
      pincodes
      tnc
      storeDeliveryFee
      taxPercentage
    }
  }
`;

const steps = ['Store Information', 'Inventory', 'Drivers', 'Store Managers', 'Review'];

const StoreManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Store Onboarding States
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    managerUserId: '',
    radius: '',
    email: '',
    mobile: '',
    description: '',
    storeDeliveryFee: '',
    taxPercentage: '',
    tnc: '',
    displayField: '',
    sectionHeaders: [],
    // Dummy data for additional steps
    inventory: [],
    drivers: [],
    storeManagers: [],
    pincodes: '',
  });

  const [editStore, setEditStore] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch stores
  const {
    data: storesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['stores'],
    queryFn: () => fetchGraphQL(GET_STORES),
    enabled: shouldFetch,
  });

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: (data) => {
      return fetchGraphQL(CREATE_STORE, {
        name: data.name,
        address: data.address,
        managerUserId: parseInt(data.managerUserId, 10),
        radius: parseFloat(data.radius),
        email: data.email,
        mobile: data.mobile,
        description: data.description || null,
        storeDeliveryFee: data.storeDeliveryFee ? parseFloat(data.storeDeliveryFee) : null,
        taxPercentage: data.taxPercentage ? parseFloat(data.taxPercentage) : null,
        tnc: data.tnc || null,
        displayField: data.displayField || null,
        sectionHeaders: data.sectionHeaders || null,
        pincodes: data.pincodes || null,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      // Reset form after successful submission
      setFormData({
        name: '',
        address: '',
        managerUserId: '',
        radius: '',
        email: '',
        mobile: '',
        description: '',
        storeDeliveryFee: '',
        taxPercentage: '',
        tnc: '',
        displayField: '',
        sectionHeaders: [],
        inventory: [],
        drivers: [],
        storeManagers: [],
        pincodes: '',
      });
      setActiveStep(0);
      refetch();
    },
    onError: (error) => {
      setError(error.message || 'Failed to create store');
      setSuccess(false);
    },
  });

  // Add the mutation hook
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
      refetch();
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: 'Failed to update store: ' + error.message,
        severity: 'error',
      });
    },
  });

  const handleFetchStores = () => {
    setShouldFetch(true);
    refetch();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNext = () => {
    // Validate form on the first step before proceeding
    if (activeStep === 0 && !validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Clear general error message when any field is edited
    if (error) {
      setError(null);
    }
  };

  const handleSectionHeaderChange = (index, value) => {
    const newHeaders = [...formData.sectionHeaders];
    newHeaders[index] = value;
    setFormData((prev) => ({
      ...prev,
      sectionHeaders: newHeaders,
    }));
  };

  const addSectionHeader = () => {
    setFormData((prev) => ({
      ...prev,
      sectionHeaders: [...prev.sectionHeaders, ''],
    }));
  };

  const removeSectionHeader = (index) => {
    const newHeaders = formData.sectionHeaders.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      sectionHeaders: newHeaders,
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Store name is required';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!formData.managerUserId) {
      errors.managerUserId = 'Manager User ID is required';
    }

    if (!formData.displayField.trim()) {
      errors.displayField = 'Display Field is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    // Convert pincodes string to array and ensure no empty strings
    const pincodesString = formData.pincodes;
    const pincodes = pincodesString
      ? pincodesString
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      : [];

    // Only send the required fields to the mutation
    const storeData = {
      name: formData.name,
      address: formData.address,
      managerUserId: parseInt(formData.managerUserId, 10),
      radius: parseFloat(formData.radius),
      email: formData.email,
      mobile: formData.mobile,
      description: formData.description || null,
      storeDeliveryFee: formData.storeDeliveryFee ? parseFloat(formData.storeDeliveryFee) : null,
      taxPercentage: formData.taxPercentage ? parseFloat(formData.taxPercentage) : null,
      tnc: formData.tnc || null,
      displayField: formData.displayField,
      sectionHeaders: formData.sectionHeaders.filter((header) => header.trim().length > 0),
      pincodes: pincodes,
      is_active: true,
      disabled: false,
    };

    // Make the actual API call
    createStoreMutation.mutate(storeData);
  };

  const handleEditClick = (store) => {
    setEditStore(store);
  };

  const handleCloseEdit = () => {
    setEditStore(null);
  };

  const handleUpdateStore = (e) => {
    e.preventDefault();
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
      managerUserId: parseInt(formData.get('managerUserId')),
      radius: parseFloat(formData.get('radius')),
      isActive: formData.get('isActive') === 'true',
      disabled: formData.get('disabled') === 'true',
      description: formData.get('description') || null,
      pincodes: pincodes,
      tnc: formData.get('tnc') || null,
      storeDeliveryFee: parseFloat(formData.get('storeDeliveryFee')) || null,
      taxPercentage: parseFloat(formData.get('taxPercentage')) || null,
    };

    updateStoreMutation.mutate(updateData);
  };

  // Filter stores based on search term
  const filteredStores =
    storesData?.stores?.filter(
      (store) =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Store Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Store Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!validationErrors.name}
                helperText={validationErrors.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={!!validationErrors.address}
                helperText={validationErrors.address}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Manager Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Manager Mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                error={!!validationErrors.mobile}
                helperText={validationErrors.mobile}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Manager User ID"
                name="managerUserId"
                type="number"
                value={formData.managerUserId}
                onChange={handleChange}
                error={!!validationErrors.managerUserId}
                helperText={
                  validationErrors.managerUserId ||
                  'Enter the ID of the user who will manage this store'
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Delivery Radius (mi)"
                name="radius"
                type="number"
                value={formData.radius}
                onChange={handleChange}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Fee ($)"
                name="storeDeliveryFee"
                type="number"
                value={formData.storeDeliveryFee}
                onChange={handleChange}
                inputProps={{ step: '0.01', min: 0 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                name="taxPercentage"
                type="number"
                value={formData.taxPercentage}
                onChange={handleChange}
                inputProps={{ step: '0.1', min: 0 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
                helperText="Store timings and other details"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Terms & Conditions"
                name="tnc"
                value={formData.tnc}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Pincodes"
                name="pincodes"
                value={formData.pincodes}
                onChange={handleChange}
                helperText="Enter pincodes separated by commas"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Display Field"
                name="displayField"
                value={formData.displayField}
                onChange={handleChange}
                error={!!validationErrors.displayField}
                helperText={validationErrors.displayField || 'Unique identifier for the store'}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Section Headers
              </Typography>
              <Box sx={{ mb: 2 }}>
                {formData.sectionHeaders.map((header, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      label={`Question ${index + 1}`}
                      value={header}
                      onChange={(e) => handleSectionHeaderChange(index, e.target.value)}
                      placeholder="Enter question text"
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeSectionHeader(index)}
                      sx={{ alignSelf: 'center' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={addSectionHeader}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  Add Question
                </Button>
              </Box>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Inventory Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This is a placeholder for inventory management. In a real implementation, you would
                be able to add products to the store.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sample Inventory Items
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Product 1</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Category: Grocery
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Price: $9.99
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stock: 50
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Product 2</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Category: Electronics
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Price: $49.99
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stock: 25
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Product 3</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Category: Clothing
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Price: $19.99
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stock: 100
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button variant="outlined" startIcon={<AddIcon />}>
                  Add Inventory Item
                </Button>
              </Box>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Driver Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This is a placeholder for driver management. In a real implementation, you would be
                able to assign drivers to the store.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sample Drivers
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">John Doe</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: john.doe@example.com
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: (555) 123-4567
                        </Typography>
                        <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Jane Smith</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: jane.smith@example.com
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: (555) 987-6543
                        </Typography>
                        <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Mike Johnson</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: mike.johnson@example.com
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: (555) 456-7890
                        </Typography>
                        <Chip label="Inactive" color="error" size="small" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button variant="outlined" startIcon={<AddIcon />}>
                  Add Driver
                </Button>
              </Box>
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Store Manager Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This is a placeholder for store manager management. In a real implementation, you
                would be able to assign managers to the store.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sample Store Managers
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Sarah Williams</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: sarah.williams@example.com
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: (555) 234-5678
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Role: Store Manager
                        </Typography>
                        <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">Robert Brown</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: robert.brown@example.com
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Phone: (555) 876-5432
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Role: Assistant Manager
                        </Typography>
                        <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button variant="outlined" startIcon={<AddIcon />}>
                  Add Store Manager
                </Button>
              </Box>
            </Grid>
          </Grid>
        );
      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Store Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Store Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Name:</strong> {formData.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Address:</strong> {formData.address}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Manager User ID:</strong> {formData.managerUserId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Delivery Radius:</strong> {formData.radius} km
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Additional Information (Placeholder)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Inventory Items:</strong> 3 sample items
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Drivers:</strong> 3 sample drivers
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Store Managers:</strong> 2 sample managers
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  // Add useEffect to handle success message timeout
  useEffect(() => {
    let timeoutId;
    if (success) {
      timeoutId = setTimeout(() => {
        setSuccess(false);
      }, 5000); // 5 seconds
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [success]);

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <StoreIcon sx={{ mr: 1 }} />
          <Typography variant="h5">Store Management</Typography>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Store List" />
          <Tab label="Add New Store" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              animation: 'fadeOut 0.5s ease-in-out 4.5s forwards',
              '@keyframes fadeOut': {
                '0%': {
                  opacity: 1,
                },
                '100%': {
                  opacity: 0,
                },
              },
            }}
          >
            Store created successfully!
          </Alert>
        )}

        {activeTab === 0 ? (
          // Store List View
          <>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {!shouldFetch ? (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" align="center" gutterBottom>
                    Click "Fetch Stores" to load store data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    This helps save resources by only loading data when needed
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={handleFetchStores}
                  >
                    Fetch Stores
                  </Button>
                </CardActions>
              </Card>
            ) : isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredStores.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No stores found matching your criteria
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {filteredStores.map((store) => (
                  <Grid item xs={12} key={store.id}>
                    <Paper
                      sx={{
                        transition: 'all 0.3s ease-in-out',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: (theme) => `0 8px 24px ${theme.palette.primary.main}20`,
                          '& .store-header': {
                            background: (theme) =>
                              `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            '& .store-name': {
                              color: 'white',
                            },
                            '& .store-id': {
                              color: 'rgba(255, 255, 255, 0.8)',
                            },
                          },
                          '& .action-buttons': {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      {/* Header Section with Gradient */}
                      <Box
                        className="store-header"
                        sx={{
                          p: 2,
                          background: (theme) =>
                            `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                          transition: 'all 0.3s ease-in-out',
                        }}
                      >
                        <Grid container alignItems="center" spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StoreIcon sx={{ mr: 2, color: 'white', fontSize: '2rem' }} />
                              <Box>
                                <Typography
                                  className="store-name"
                                  variant="h6"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    transition: 'color 0.3s ease-in-out',
                                  }}
                                >
                                  {store.name}
                                </Typography>
                                <Typography
                                  className="store-id"
                                  variant="body2"
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    transition: 'color 0.3s ease-in-out',
                                  }}
                                >
                                  ID: {store.id}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                gap: 2,
                              }}
                            >
                              <Chip
                                label={store.isActive ? 'Active' : 'Inactive'}
                                color={store.isActive ? 'success' : 'error'}
                                sx={{
                                  fontWeight: 600,
                                  boxShadow: 2,
                                  '& .MuiChip-label': { px: 1 },
                                }}
                              />
                              <Box
                                className="action-buttons"
                                sx={{ display: 'flex', gap: 1, opacity: 0.9 }}
                              >
                                <Button
                                  size="small"
                                  startIcon={<EditIcon />}
                                  sx={{
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    color: 'white',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                  }}
                                  onClick={() => handleEditClick(store)}
                                >
                                  Edit
                                </Button>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                          {/* Contact Information */}
                          <Grid item xs={12} md={4}>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 2,
                                  fontWeight: 600,
                                  color: 'primary.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  '&::before': {
                                    content: '""',
                                    display: 'inline-block',
                                    width: 4,
                                    height: 16,
                                    backgroundColor: 'primary.main',
                                    marginRight: 1,
                                    borderRadius: 1,
                                  },
                                }}
                              >
                                Contact Information
                              </Typography>

                              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                <LocationIcon
                                  sx={{
                                    mr: 1.5,
                                    color: 'primary.main',
                                    mt: 0.3,
                                    flexShrink: 0,
                                    fontSize: '1.2rem',
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    wordBreak: 'break-word',
                                    color: 'text.primary',
                                    fontWeight: 500,
                                  }}
                                >
                                  {store.address}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PhoneIcon
                                  sx={{
                                    mr: 1.5,
                                    color: 'primary.main',
                                    flexShrink: 0,
                                    fontSize: '1.2rem',
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    wordBreak: 'break-word',
                                    color: 'text.primary',
                                    fontWeight: 500,
                                  }}
                                >
                                  {store.mobile || 'No contact info'}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <EmailIcon
                                  sx={{
                                    mr: 1.5,
                                    color: 'primary.main',
                                    flexShrink: 0,
                                    fontSize: '1.2rem',
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    wordBreak: 'break-word',
                                    color: 'text.primary',
                                    fontWeight: 500,
                                  }}
                                >
                                  {store.email || 'No email info'}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>

                          {/* Delivery Information */}
                          <Grid item xs={12} md={4}>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 2,
                                  fontWeight: 600,
                                  color: 'primary.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  '&::before': {
                                    content: '""',
                                    display: 'inline-block',
                                    width: 4,
                                    height: 16,
                                    backgroundColor: 'primary.main',
                                    marginRight: 1,
                                    borderRadius: 1,
                                  },
                                }}
                              >
                                Delivery Information
                              </Typography>

                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <LocalShippingIcon
                                  sx={{
                                    mr: 1.5,
                                    color: 'primary.main',
                                    flexShrink: 0,
                                    fontSize: '1.2rem',
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'text.primary',
                                    fontWeight: 500,
                                  }}
                                >
                                  Radius: {store.radius} mi
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AttachMoneyIcon
                                  sx={{
                                    mr: 1.5,
                                    color: 'primary.main',
                                    flexShrink: 0,
                                    fontSize: '1.2rem',
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'text.primary',
                                    fontWeight: 500,
                                  }}
                                >
                                  Delivery Fee: ${store.storeDeliveryFee?.toFixed(2) || '0.00'}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PercentIcon
                                  sx={{
                                    mr: 1.5,
                                    color: 'primary.main',
                                    flexShrink: 0,
                                    fontSize: '1.2rem',
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'text.primary',
                                    fontWeight: 500,
                                  }}
                                >
                                  Tax Rate: {store.taxPercentage?.toFixed(1) || '0.0'}%
                                </Typography>
                              </Box>

                              {store.pincodes && store.pincodes.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                  {store.pincodes.map((pincode) => (
                                    <Chip
                                      key={pincode}
                                      label={pincode}
                                      size="small"
                                      sx={{
                                        backgroundColor: 'primary.light',
                                        color: 'primary.contrastText',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                          backgroundColor: 'primary.main',
                                          transform: 'scale(1.05)',
                                        },
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Grid>

                          {/* Description & T&C */}
                          <Grid item xs={12} md={4}>
                            <Box>
                              {store.description && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      mb: 2,
                                      fontWeight: 600,
                                      color: 'primary.main',
                                      display: 'flex',
                                      alignItems: 'center',
                                      '&::before': {
                                        content: '""',
                                        display: 'inline-block',
                                        width: 4,
                                        height: 16,
                                        backgroundColor: 'primary.main',
                                        marginRight: 1,
                                        borderRadius: 1,
                                      },
                                    }}
                                  >
                                    Description
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      wordBreak: 'break-word',
                                      color: 'text.primary',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {store.description}
                                  </Typography>
                                </Box>
                              )}

                              {store.tnc && (
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      mb: 2,
                                      fontWeight: 600,
                                      color: 'primary.main',
                                      display: 'flex',
                                      alignItems: 'center',
                                      '&::before': {
                                        content: '""',
                                        display: 'inline-block',
                                        width: 4,
                                        height: 16,
                                        backgroundColor: 'primary.main',
                                        marginRight: 1,
                                        borderRadius: 1,
                                      },
                                    }}
                                  >
                                    Terms & Conditions
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      wordBreak: 'break-word',
                                      color: 'text.primary',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {store.tnc}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        ) : (
          // Store Onboarding View
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button disabled={activeStep === 0} onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                disabled={createStoreMutation.isLoading}
              >
                {createStoreMutation.isLoading ? (
                  <CircularProgress size={24} />
                ) : activeStep === steps.length - 1 ? (
                  'Submit'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          </Box>
        )}
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
              <Grid item xs={12} md={6}>
                <TextField
                  name="managerUserId"
                  label="Manager User ID"
                  type="number"
                  defaultValue={editStore?.managerUserId}
                  required
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
                  inputProps={{ step: 0.01, min: 0 }}
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
                  inputProps={{ step: 0.1, min: 0 }}
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
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Store Status</InputLabel>
                  <Select name="isActive" label="Store Status" defaultValue={editStore?.isActive}>
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Disabled Status</InputLabel>
                  <Select
                    name="disabled"
                    label="Disabled Status"
                    defaultValue={editStore?.disabled}
                  >
                    <MenuItem value={true}>Disabled</MenuItem>
                    <MenuItem value={false}>Enabled</MenuItem>
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
    </Box>
  );
};

export default StoreManagement;
