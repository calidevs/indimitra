import React, { useState, useMemo } from 'react';
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
  TablePagination,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_PRODUCTS, CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT } from '@/queries/operations';
import graphqlService from '@/config/graphql/graphqlService';

const GET_CATEGORIES = `
  query GetCategories {
    categories {
      id
      name
    }
  }
`;

const CREATE_CATEGORY = `
  mutation CreateCategory($name: String!) {
    createCategory(name: $name) {
      category {
        id
        name
      }
    }
  }
`;

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
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [allProducts, setAllProducts] = useState([]);
  const [imageUploadError, setImageUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Define baseUrl at component level
  const baseUrl = window.location.href?.includes('http://localhost')
    ? 'http://127.0.0.1:8000'
    : 'https://indimitra.com';

  // Fetch all products at once
  const { data: productsData, refetch } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => graphqlService(GET_PRODUCTS),
    enabled: false,
  });

  // Fetch categories with proper refetch function
  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await graphqlService(GET_CATEGORIES);
      return result.categories || [];
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data) => {
      console.log('Executing mutation with data:', data); // Add logging
      return fetchGraphQL(CREATE_PRODUCT, {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        image: data.image,
      });
    },
    onSuccess: () => {
      refetch();
      handleCloseDialog();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => {
      console.log('Updating product with data:', { id, data }); // Add logging
      return fetchGraphQL(UPDATE_PRODUCT, {
        productId: id,
        name: data.name,
        description: data.description,
        categoryId: parseInt(data.categoryId, 10),
        image: data.image || null,
      });
    },
    onSuccess: () => {
      refetch();
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Product updated successfully!',
        severity: 'success',
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      setSnackbar({
        open: true,
        message: `Failed to update product: ${error.message}`,
        severity: 'error',
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId) => graphqlService(DELETE_PRODUCT, { productId }),
    onSuccess: () => {
      refetch();
    },
  });

  // Create category mutation with proper refetch
  const createCategoryMutation = useMutation({
    mutationFn: (name) => graphqlService(CREATE_CATEGORY, { name }),
    onSuccess: () => {
      setCategoryDialogOpen(false);
      setNewCategoryName('');
      setCategoryError('');
      refetchCategories(); // Refetch categories after successful creation
    },
    onError: (error) => {
      setCategoryError(error.message || 'Failed to create category');
    },
  });

  // Create category mapping from fetched data
  const CATEGORY_MAP = useMemo(() => {
    if (!categoriesData) return {};
    return categoriesData.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categoriesData]);

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
      // Convert categoryId to integer and ensure image is included
      const mutationData = {
        name: formData.name,
        description: formData.description,
        categoryId: parseInt(formData.categoryId, 10),
        image: formData.image || null, // Ensure image is passed even if null
      };
      console.log('Submitting product with data:', mutationData); // Add logging
      createProductMutation.mutate(mutationData);
    }
  };

  const handleDelete = (id) => {
    // First check if the product has inventory items
    const product = allProducts.find((p) => p.id === id);
    const hasInventory = product?.inventoryItems?.edges?.length > 0;

    if (hasInventory) {
      const confirmForceDelete = window.confirm(
        'This product has inventory items. Deleting it will also remove all associated inventory items. Are you sure you want to proceed?'
      );

      if (!confirmForceDelete) {
        return;
      }
    } else {
      const confirmDelete = window.confirm('Are you sure you want to delete this product?');

      if (!confirmDelete) {
        return;
      }
    }

    // Proceed with deletion
    deleteProductMutation.mutate(parseInt(id, 10));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'categoryId' && value === 'new') {
      setCategoryDialogOpen(true);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update handleFetchProducts to store all products
  const handleFetchProducts = () => {
    setIsLoading(true);
    setError(null);

    refetch()
      .then((result) => {
        if (result.data?.products) {
          setAllProducts(result.data.products);
        }
        setDataLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError('Failed to load products. Please try again.');
        setIsLoading(false);
      });
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }
    createCategoryMutation.mutate(newCategoryName.trim());
  };

  // Filter products based on selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return allProducts;
    return allProducts.filter((product) => product.categoryId === parseInt(selectedCategory));
  }, [allProducts, selectedCategory]);

  // Get paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  // Simple pagination handlers that only update state
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Add sanitizeFilename function at the top of the component
  const sanitizeFilename = (str) => {
    return str
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageUploadError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setImageUploadError('');

      // Get the category name from CATEGORY_MAP
      const categoryName = CATEGORY_MAP[formData.categoryId] || 'uncategorized';

      // Get upload URL from backend
      const res = await fetch(
        `${baseUrl}/s3/generate-product-upload-url?product_name=${encodeURIComponent(
          formData.name
        )}&category_name=${encodeURIComponent(categoryName)}&file_name=${encodeURIComponent(
          file.name
        )}`
      );

      if (!res.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { upload_url, content_type, key } = await res.json();

      // Upload file to S3 using presigned URL
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': content_type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image');
      }

      // Construct public URL for the uploaded image
      const publicUrl = `https://indimitra-dev-order-files.s3.amazonaws.com/${key}`;

      // Update form data with the public URL
      setFormData((prev) => ({
        ...prev,
        image: publicUrl,
      }));

      setSnackbar({
        open: true,
        message: 'Image uploaded successfully!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Upload error:', err);
      setImageUploadError('Failed to upload image. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to upload image. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

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
            <TableContainer component={Paper}>
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
                  {paginatedProducts.map((product) => (
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
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredProducts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
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
                  <MenuItem value="">
                    <em>Select a category</em>
                  </MenuItem>
                  {Object.entries(CATEGORY_MAP).map(([id, name]) => (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ))}
                  <MenuItem value="new" sx={{ borderTop: '1px solid #e0e0e0', mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                      <AddIcon sx={{ mr: 1 }} />
                      Add New Category
                    </Box>
                  </MenuItem>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Image URL"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  disabled={isUploading}
                  error={!!imageUploadError}
                  helperText={imageUploadError}
                />
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={isUploading || !formData.name || !formData.categoryId}
                >
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </Button>
                {formData.image && (
                  <Box sx={{ mt: 1 }}>
                    <img
                      src={formData.image}
                      alt="Product preview"
                      style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </Box>
                )}
              </Box>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                {editingProduct ? 'Updating...' : 'Creating...'}
              </Box>
            ) : editingProduct ? (
              'Update'
            ) : (
              'Add'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            error={!!categoryError}
            helperText={categoryError}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateCategory();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={createCategoryMutation.isLoading}
          >
            {createCategoryMutation.isLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductManagement;
