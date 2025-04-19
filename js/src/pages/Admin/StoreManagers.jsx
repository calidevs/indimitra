import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
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
  Divider,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';

// Define GraphQL queries and mutations
const GET_STORE_MANAGERS = `
  query GetStoreManagers($status: String, $searchTerm: String) {
    storeManagers(status: $status, searchTerm: $searchTerm) {
      id
      name
      email
      phone
      status
      store {
        id
        name
      }
      createdAt
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

const CREATE_STORE_MANAGER = `
  mutation CreateStoreManager($input: CreateStoreManagerInput!) {
    createStoreManager(input: $input) {
      id
      name
      email
      phone
      status
      store {
        id
        name
      }
    }
  }
`;

const UPDATE_STORE_MANAGER = `
  mutation UpdateStoreManager($id: ID!, $input: UpdateStoreManagerInput!) {
    updateStoreManager(id: $id, input: $input) {
      id
      name
      email
      phone
      status
      store {
        id
        name
      }
    }
  }
`;

const DELETE_STORE_MANAGER = `
  mutation DeleteStoreManager($id: ID!) {
    deleteStoreManager(id: $id)
  }
`;

const StoreManagers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    storeId: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch store managers with filters
  const {
    data: managersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['storeManagers', statusFilter, searchTerm],
    queryFn: () =>
      fetchGraphQL(GET_STORE_MANAGERS, {
        status: statusFilter || null,
        searchTerm: searchTerm || null,
      }),
  });

  // Fetch stores for the dropdown
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: () => fetchGraphQL(GET_STORES),
  });

  // Create store manager mutation
  const createManagerMutation = useMutation({
    mutationFn: (data) => fetchGraphQL(CREATE_STORE_MANAGER, { input: data }),
    onSuccess: () => {
      refetch();
      handleCloseDialog();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (error) => {
      setError(error.message || 'Failed to create store manager');
      setTimeout(() => setError(null), 3000);
    },
  });

  // Update store manager mutation
  const updateManagerMutation = useMutation({
    mutationFn: ({ id, data }) => fetchGraphQL(UPDATE_STORE_MANAGER, { id, input: data }),
    onSuccess: () => {
      refetch();
      handleCloseDialog();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (error) => {
      setError(error.message || 'Failed to update store manager');
      setTimeout(() => setError(null), 3000);
    },
  });

  // Delete store manager mutation
  const deleteManagerMutation = useMutation({
    mutationFn: (id) => fetchGraphQL(DELETE_STORE_MANAGER, { id }),
    onSuccess: () => {
      refetch();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (error) => {
      setError(error.message || 'Failed to delete store manager');
      setTimeout(() => setError(null), 3000);
    },
  });

  const handleOpenDialog = (manager = null) => {
    if (manager) {
      setEditingManager(manager);
      setFormData({
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        storeId: manager.store.id,
        password: '',
      });
    } else {
      setEditingManager(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        storeId: '',
        password: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingManager(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      storeId: '',
      password: '',
    });
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      status: 'ACTIVE',
    };

    if (editingManager) {
      updateManagerMutation.mutate({ id: editingManager.id, data });
    } else {
      createManagerMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this store manager?')) {
      deleteManagerMutation.mutate(id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 1 }} />
          <Typography variant="h5">Store Manager Management</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {editingManager
              ? 'Store manager updated successfully!'
              : 'Store manager created successfully!'}
          </Alert>
        )}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name or email"
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
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Add Store Manager Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mb: 3 }}
        >
          Add Store Manager
        </Button>

        {/* Store Managers Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Store</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Join Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : managersData?.storeManagers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No store managers found
                  </TableCell>
                </TableRow>
              ) : (
                managersData?.storeManagers.map((manager) => (
                  <TableRow key={manager.id}>
                    <TableCell>{manager.name}</TableCell>
                    <TableCell>{manager.email}</TableCell>
                    <TableCell>{manager.phone}</TableCell>
                    <TableCell>{manager.store.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={manager.status}
                        color={getStatusColor(manager.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(manager.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(manager)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(manager.id)}>
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

      {/* Add/Edit Store Manager Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingManager ? 'Edit Store Manager' : 'Add New Store Manager'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Name"
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
              <FormControl fullWidth required>
                <InputLabel>Store</InputLabel>
                <Select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleChange}
                  label="Store"
                >
                  {storesData?.stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {!editingManager && (
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createManagerMutation.isLoading || updateManagerMutation.isLoading}
          >
            {createManagerMutation.isLoading || updateManagerMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : editingManager ? (
              'Update'
            ) : (
              'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoreManagers;
