import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_PRODUCTS, CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT } from '@/queries/operations';

// Category mapping for display
const CATEGORY_MAP = {
  1: 'Rice',
  2: 'Pulses',
  3: 'Flour',
  4: 'Snacks',
  5: 'Oils',
  6: 'Spices',
};

const ProductManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    image: '',
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch products
  const { data: productsData, refetch } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => fetchGraphQL(GET_PRODUCTS),
    enabled: false, // Don't fetch automatically
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data) => fetchGraphQL(CREATE_PRODUCT, { input: data }),
    onSuccess: () => {
      refetch();
      handleCloseDialog();
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => fetchGraphQL(UPDATE_PRODUCT, { id, input: data }),
    onSuccess: () => {
      refetch();
      handleCloseDialog();
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id) => fetchGraphQL(DELETE_PRODUCT, { id }),
    onSuccess: () => {
      refetch();
    },
  });

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        image: product.image,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        image: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      image: '',
    });
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFetchProducts = () => {
    setIsLoading(true);
    setError(null);

    // Simulate API call with setTimeout
    setTimeout(() => {
      try {
        // In a real app, this would be an API call
        refetch()
          .then(() => {
            setDataLoaded(true);
            setIsLoading(false);
          })
          .catch((err) => {
            setError('Failed to load products. Please try again.');
            setIsLoading(false);
          });
      } catch (err) {
        setError('Failed to load products. Please try again.');
        setIsLoading(false);
      }
    }, 1000);
  };

  // Filter products based on selected category
  const filteredProducts = productsData?.products?.filter(
    (product) => !selectedCategory || product.categoryId === parseInt(selectedCategory)
  );

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AddIcon sx={{ mr: 1 }} />
          <Typography variant="h5">Product Management</Typography>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {Object.entries(CATEGORY_MAP).map(([id, name]) => (
                  <MenuItem key={id} value={id}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleFetchProducts}
              disabled={isLoading}
              sx={{ minWidth: 150 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Fetch Products'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Product
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!dataLoaded ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Click "Fetch Products" to load product information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This helps save resources by only loading data when needed
            </Typography>
          </Box>
        ) : isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Products Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{CATEGORY_MAP[product.categoryId] || 'Unknown'}</TableCell>
                        <TableCell>{product.description}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleOpenDialog(product)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(product.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  label="Category"
                >
                  {Object.entries(CATEGORY_MAP).map(([id, name]) => (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createProductMutation.isLoading || updateProductMutation.isLoading}
          >
            {createProductMutation.isLoading || updateProductMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : editingProduct ? (
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

export default ProductManagement;
