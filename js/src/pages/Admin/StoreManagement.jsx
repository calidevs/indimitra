import React, { useState } from 'react';
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
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_STORES } from '@/queries/operations';

// Define the GraphQL mutation for creating a store
const CREATE_STORE = `
  mutation CreateStore($name: String!, $address: String!, $managerUserId: Int!, $radius: Float!) {
    createStore(name: $name, address: $address, managerUserId: $managerUserId, radius: $radius) {
      address
      managerUserId
      name
      radius
      manager {
        email
        id
        mobile
      }
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
    // Dummy data for additional steps
    inventory: [],
    drivers: [],
    storeManagers: [],
  });

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
        inventory: [],
        drivers: [],
        storeManagers: [],
      });
      setActiveStep(0);
      refetch();
    },
    onError: (error) => {
      setError(error.message || 'Failed to create store');
      setSuccess(false);
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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    // Only send the required fields to the mutation
    const storeData = {
      name: formData.name,
      address: formData.address,
      managerUserId: formData.managerUserId,
      radius: formData.radius,
    };

    // Make the actual API call
    createStoreMutation.mutate(storeData);
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
                label="Delivery Radius (km)"
                name="radius"
                type="number"
                value={formData.radius}
                onChange={handleChange}
                inputProps={{ step: '0.1' }}
              />
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
          <Alert severity="success" sx={{ mb: 3 }}>
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
                  <Grid item xs={12} sm={6} md={4} key={store.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: isMobile ? 'auto' : 320,
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{
                              wordBreak: 'break-word',
                              pr: 1,
                              fontSize: isMobile ? '1rem' : '1.25rem',
                            }}
                          >
                            {store.name}
                          </Typography>
                          <Chip
                            label={`${store.drivers.edges.length} drivers`}
                            color="primary"
                            size="small"
                            sx={{ flexShrink: 0 }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <LocationIcon
                            sx={{ mr: 1, color: 'text.secondary', mt: 0.3, flexShrink: 0 }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ wordBreak: 'break-word' }}
                          >
                            {store.address}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon sx={{ mr: 1, color: 'text.secondary', flexShrink: 0 }} />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ wordBreak: 'break-word' }}
                          >
                            {store.drivers.edges.length > 0
                              ? store.drivers.edges[0].node.driver.mobile
                              : 'No contact info'}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <EmailIcon sx={{ mr: 1, color: 'text.secondary', flexShrink: 0 }} />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              wordBreak: 'break-word',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {store.drivers.edges.length > 0
                              ? store.drivers.edges[0].node.driver.email
                              : 'No email info'}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 'auto',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Active:{' '}
                            {store.drivers.edges.filter(({ node }) => node.driver.active).length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total: {store.drivers.edges.length}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                        <Button size="small" startIcon={<EditIcon />} sx={{ flex: 1, mr: 1 }}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          sx={{ flex: 1 }}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
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
    </Box>
  );
};

export default StoreManagement;
