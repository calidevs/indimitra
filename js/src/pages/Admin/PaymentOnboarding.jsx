import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,  
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  InputAdornment

} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import fetchGraphQL from '../../config/graphql/graphqlService';

// Define GraphQL queries and mutations
const GET_PAYMENT_ONBOARDING = `
  query GetPaymentOnboarding($status: String, $searchTerm: String) {
    paymentOnboarding(status: $status, searchTerm: $searchTerm) {
      id
      store {
        id
        name
      }
      status
      paymentMethod
      accountDetails
      documents
      createdAt
      updatedAt
    }
  }
`;

const GET_STORES = `
  query GetStores {
    stores {
      id
      name
    }
  }
`;

const CREATE_PAYMENT_ONBOARDING = `
  mutation CreatePaymentOnboarding($input: CreatePaymentOnboardingInput!) {
    createPaymentOnboarding(input: $input) {
      id
      store {
        id
        name
      }
      status
      paymentMethod
      accountDetails
      documents
    }
  }
`;

const UPDATE_PAYMENT_ONBOARDING = `
  mutation UpdatePaymentOnboarding($id: ID!, $input: UpdatePaymentOnboardingInput!) {
    updatePaymentOnboarding(id: $id, input: $input) {
      id
      store {
        id
        name
      }
      status
      paymentMethod
      accountDetails
      documents
    }
  }
`;

const DELETE_PAYMENT_ONBOARDING = `
  mutation DeletePaymentOnboarding($id: ID!) {
    deletePaymentOnboarding(id: $id)
  }
`;

const steps = ['Store Selection', 'Payment Method', 'Account Details', 'Documents', 'Review'];

const PaymentOnboarding = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOnboarding, setEditingOnboarding] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    storeId: '',
    paymentMethod: '',

    accountDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      routingNumber: '',
      swiftCode: '',
    },
    documents: [],
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch payment onboarding with filters
  const {
    data: onboardingData,
    isLoading,
    refetch,
    error: queryError,
  } = useQuery({
    queryKey: ['paymentOnboarding', statusFilter, searchTerm],
    queryFn: () =>
      fetchGraphQL(GET_PAYMENT_ONBOARDING, {
        status: statusFilter || null,
        searchTerm: searchTerm || null,
      }),
  });

  // Fetch stores for the dropdown
  const { data: storesData = { stores: [] } } = useQuery({
    queryKey: ['stores'],
    queryFn: () => fetchGraphQL(GET_STORES),
  });

  // Create payment onboarding mutation
  const createOnboardingMutation = useMutation({
    mutationFn: (data) => fetchGraphQL(CREATE_PAYMENT_ONBOARDING, { input: data }),
    onSuccess: () => {
      refetch();
      handleCloseDialog();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (error) => {
      setError(error.message || 'Failed to create payment onboarding');
      setTimeout(() => setError(null), 3000);
    },
  });

  // Update payment onboarding mutation
  const updateOnboardingMutation = useMutation({
    mutationFn: ({ id, data }) => fetchGraphQL(UPDATE_PAYMENT_ONBOARDING, { id, input: data }),
    onSuccess: (data, variables) => {
      // Update the onboarding record in-place in the onboarding list
      if (onboardingData) {
        onboardingData.forEach((record) => {
          if (record.id === variables.id) {
            Object.assign(record, variables.data);
          }
        });
      }
      handleCloseDialog();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (error) => {
      setError(error.message || 'Failed to update payment onboarding');
      setTimeout(() => setError(null), 3000);
    },
  });

  // Delete payment onboarding mutation
  const deleteOnboardingMutation = useMutation({
    mutationFn: (id) => fetchGraphQL(DELETE_PAYMENT_ONBOARDING, { id }),
    onSuccess: () => {
      refetch();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (error) => {
      setError(error.message || 'Failed to delete payment onboarding');
      setTimeout(() => setError(null), 3000);
    },
  });

  const handleOpenDialog = (onboarding = null) => {
    if (onboarding) {
      setEditingOnboarding(onboarding);
      setFormData({
        storeId: onboarding.store.id,
        paymentMethod: onboarding.paymentMethod,
        accountDetails: onboarding.accountDetails || {
          accountName: '',
          accountNumber: '',
          bankName: '',
          ifscCode: '',
          routingNumber: '',
          swiftCode: '',
        },
        documents: onboarding.documents || [],
      });
    } else {
      setEditingOnboarding(null);
      setFormData({
        storeId: '',
        paymentMethod: '',
        accountDetails: {
          accountName: '',
          accountNumber: '',
          bankName: '',
          ifscCode: '',
          routingNumber: '',
          swiftCode: '',
        },
        documents: [],
      });
    }
    setActiveStep(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOnboarding(null);
    setActiveStep(0);
    setFormData({
      storeId: '',
      paymentMethod: '',
      accountDetails: {
        accountName: '',
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        routingNumber: '',
        swiftCode: '',
      },
      documents: [],
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      status: 'PENDING',
    };

    if (editingOnboarding) {
      updateOnboardingMutation.mutate({ id: editingOnboarding.id, data });
    } else {
      createOnboardingMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this payment onboarding?')) {
      deleteOnboardingMutation.mutate(id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('accountDetails.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        accountDetails: {
          ...prev.accountDetails,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon />;
      case 'REJECTED':
        return <ErrorIcon />;
      case 'PENDING':
        return <PendingIcon />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();

  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Store
              </Typography>
              <FormControl fullWidth required>
                <InputLabel>Store</InputLabel>
                <Select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleChange}
                  label="Store"
                >
                  {storesData?.stores?.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Payment Method
              </Typography>
              <FormControl fullWidth required>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  label="Payment Method"
                >
                  <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="PAYPAL">PayPal</MenuItem>
                  <MenuItem value="STRIPE">Stripe</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Account Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Account Name"
                name="accountDetails.accountName"
                value={formData.accountDetails.accountName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Account Number"
                name="accountDetails.accountNumber"
                value={formData.accountDetails.accountNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Bank Name"
                name="accountDetails.bankName"
                value={formData.accountDetails.bankName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IFSC Code"
                name="accountDetails.ifscCode"
                value={formData.accountDetails.ifscCode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Routing Number"
                name="accountDetails.routingNumber"
                value={formData.accountDetails.routingNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SWIFT Code"
                name="accountDetails.swiftCode"
                value={formData.accountDetails.swiftCode}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Documents
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload relevant documents for payment verification. This step is optional.
              </Typography>
              <Button variant="outlined" component="label">
                Upload Documents
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => {
                    // In a real app, you would handle file uploads here
                    // For now, we'll just simulate it
                    const fileNames = Array.from(e.target.files).map((file) => file.name);
                    setFormData((prev) => ({
                      ...prev,
                      documents: [...prev.documents, ...fileNames],
                    }));
                  }}
                />
              </Button>
              {formData.documents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Uploaded Documents:</Typography>
                  <ul>
                    {formData.documents.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </Box>
              )}
            </Grid>
          </Grid>
        );
      case 4:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Store</Typography>
              <Typography>
                {storesData?.stores?.find((store) => store.id === formData.storeId)?.name || 'No store selected'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Payment Method</Typography>
              <Typography>{formData.paymentMethod}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1">Account Details</Typography>
              <Typography>Account Name: {formData.accountDetails.accountName}</Typography>
              <Typography>Account Number: {formData.accountDetails.accountNumber}</Typography>
              <Typography>Bank Name: {formData.accountDetails.bankName}</Typography>
              {formData.accountDetails.ifscCode && (
                <Typography>IFSC Code: {formData.accountDetails.ifscCode}</Typography>
              )}
              {formData.accountDetails.routingNumber && (
                <Typography>Routing Number: {formData.accountDetails.routingNumber}</Typography>
              )}
              {formData.accountDetails.swiftCode && (
                <Typography>SWIFT Code: {formData.accountDetails.swiftCode}</Typography>
              )}
            </Grid>
            {formData.documents.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">Documents</Typography>
                <ul>
                  {formData.documents.map((doc, index) => (
                    <li key={index}>{doc}</li>
                  ))}
                </ul>
              </Grid>
            )}
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
          <PaymentIcon sx={{ mr: 1 }} />
          <Typography variant="h5">Payment Onboarding</Typography>
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (

          <Alert severity='success' sx={{ mb: 3 }}>
            {editingOnboarding
              ? 'Payment onboarding updated successfully!'
              : 'Payment onboarding created successfully!'}
          </Alert>
        )}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by store name"
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
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Add Payment Onboarding Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mb: 3 }}
        >
          Add Payment Onboarding
        </Button>

        {/* Payment Onboarding Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Store</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>{queryError ? (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  <Typography color='error'>Error fetching payment onboarding</Typography>
                </TableCell>
              </TableRow>)
              : isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : onboardingData?.paymentOnboarding.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No payment onboarding found
                  </TableCell>
                </TableRow>
              ) : (
                onboardingData?.paymentOnboarding.map((onboarding) => (
                  <TableRow key={onboarding.id}>
                    <TableCell>{onboarding.store.name}</TableCell>
                    <TableCell>{onboarding.paymentMethod}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(onboarding.status)}
                        label={onboarding.status}
                        color={getStatusColor(onboarding.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(onboarding.createdAt)}</TableCell>
                    <TableCell>{formatDate(onboarding.updatedAt)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(onboarding)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(onboarding.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                ))

              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Payment Onboarding Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingOnboarding ? 'Edit Payment Onboarding' : 'Add New Payment Onboarding'}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ my: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Divider sx={{ mb: 3 }} />
          {renderStepContent(activeStep)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={createOnboardingMutation.isLoading || updateOnboardingMutation.isLoading}
            >
              {createOnboardingMutation.isLoading || updateOnboardingMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : editingOnboarding ? (
                'Update'
              ) : (
                'Submit'
              )}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentOnboarding;
