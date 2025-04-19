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
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) {
      id
      name
      address
      radius
      status
    }
  }
`;

const steps = ['Store Information', 'Location Details', 'Business Details', 'Review'];

const StoreManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Store Onboarding States
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    businessType: '',
    taxId: '',
    radius: '',
    operatingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '15:00' },
      sunday: { open: '', close: '' },
    },
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
        input: {
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          phone: data.phone,
          email: data.email,
          website: data.website,
          businessType: data.businessType,
          taxId: data.taxId,
          radius: parseInt(data.radius, 10),
          operatingHours: data.operatingHours,
        },
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      // Reset form after successful submission
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        businessType: '',
        taxId: '',
        radius: '',
        operatingHours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { open: '10:00', close: '15:00' },
          sunday: { open: '', close: '' },
        },
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
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = () => {
    createStoreMutation.mutate(formData);
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
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Store Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Business Type</InputLabel>
                <Select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  label="Business Type"
                >
                  <MenuItem value="RETAIL">Retail</MenuItem>
                  <MenuItem value="RESTAURANT">Restaurant</MenuItem>
                  <MenuItem value="GROCERY">Grocery</MenuItem>
                  <MenuItem value="PHARMACY">Pharmacy</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax ID"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Location Details
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="ZIP Code"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
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
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Operating Hours
              </Typography>
            </Grid>
            {Object.entries(formData.operatingHours).map(([day, hours]) => (
              <Grid item xs={12} key={day}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ width: 100, textTransform: 'capitalize' }}>{day}</Typography>
                  <TextField
                    label="Open"
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Typography>to</Typography>
                  <TextField
                    label="Close"
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        );
      case 3:
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
                      <strong>Email:</strong> {formData.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {formData.phone}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Business Type:</strong> {formData.businessType}
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Location
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Address:</strong> {formData.address}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>City:</strong> {formData.city}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>State:</strong> {formData.state}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>ZIP Code:</strong> {formData.zipCode}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Country:</strong> {formData.country}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Delivery Radius:</strong> {formData.radius} km
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
