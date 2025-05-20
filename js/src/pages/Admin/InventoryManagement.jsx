import React, { useState, useRef } from 'react';
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
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Popper,
  ClickAwayListener,
  MenuList,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ViewModule as GridIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import fetchGraphQL from '@/config/graphql/graphqlService';
import {
  GET_STORES,
  GET_STORE_INVENTORY,
  UPDATE_INVENTORY_ITEM,
  GET_PRODUCTS,
  ADD_PRODUCT_TO_INVENTORY,
} from '@/queries/operations';

const InventoryManagement = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newQuantity, setNewQuantity] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isListed, setIsListed] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Add Product Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchInput, setProductSearchInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addProductForm, setAddProductForm] = useState({
    price: '',
    quantity: '',
    measurement: '',
    unit: '',
  });
  const anchorRef = useRef(null);

  // Fetch all stores
  const {
    data: storesData,
    isLoading: isLoadingStores,
    error: storesError,
    refetch: refetchStores,
  } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_STORES);
      return response?.stores || [];
    },
    enabled: true,
  });

  // Fetch all products for the add product modal
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_PRODUCTS);
      return response?.products || [];
    },
    enabled: addModalOpen, // Only fetch when the add modal is open
  });

  // Fetch inventory for selected store
  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    error: inventoryError,
    refetch: refetchInventory,
  } = useQuery({
    queryKey: ['storeInventory', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return [];
      const response = await fetchGraphQL(GET_STORE_INVENTORY, {
        storeId: parseInt(selectedStore),
      });
      // Handle the getInventoryByStore response structure
      return response?.getInventoryByStore || [];
    },
    enabled: !!selectedStore,
  });

  // Update inventory item mutation
  const updateInventoryMutation = useMutation({
    mutationFn: (variables) => fetchGraphQL(UPDATE_INVENTORY_ITEM, variables),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Inventory item updated successfully',
        severity: 'success',
      });
      refetchInventory();
      setEditModalOpen(false);
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: `Error updating inventory: ${error.message}`,
        severity: 'error',
      });
    },
  });

  // Add product to inventory mutation
  const addProductMutation = useMutation({
    mutationFn: (variables) => fetchGraphQL(ADD_PRODUCT_TO_INVENTORY, variables),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Product added to inventory successfully',
        severity: 'success',
      });
      refetchInventory();
      setAddModalOpen(false);
      resetAddProductForm();
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: `Error adding product to inventory: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStoreChange = (event) => {
    setSelectedStore(event.target.value);
    setPage(0);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setNewQuantity(item.quantity.toString());
    setNewPrice(item.price.toString());
    setIsAvailable(item.isAvailable);
    setIsListed(item.isListed);
    setEditModalOpen(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const handleUpdateConfirm = () => {
    if (!selectedItem) return;

    updateInventoryMutation.mutate({
      inventoryId: selectedItem.id,
      price: parseFloat(newPrice),
      quantity: parseInt(newQuantity),
      isAvailable,
      isListed,
    });
  };

  const handleDeleteConfirm = () => {
    // Implement delete functionality
    setDeleteModalOpen(false);
    setSnackbar({
      open: true,
      message: 'Delete functionality not implemented yet',
      severity: 'info',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Add Product Modal Handlers
  const handleOpenAddModal = () => {
    if (!selectedStore) {
      setSnackbar({
        open: true,
        message: 'Please select a store first',
        severity: 'warning',
      });
      return;
    }
    setAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
    resetAddProductForm();
  };

  const resetAddProductForm = () => {
    setSelectedProduct(null);
    setProductSearchInput('');
    setAddProductForm({
      price: '',
      quantity: '',
      measurement: '',
      unit: '',
    });
  };

  const handleProductSearchChange = (event) => {
    setProductSearchInput(event.target.value);
    setDropdownOpen(true);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductSearchInput(product.name);
    setDropdownOpen(false);
  };

  const handleClickAway = () => {
    setDropdownOpen(false);
  };

  const handleAddProductFormChange = (e) => {
    const { name, value } = e.target;
    setAddProductForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProductConfirm = () => {
    if (!selectedProduct) {
      setSnackbar({
        open: true,
        message: 'Please select a product',
        severity: 'warning',
      });
      return;
    }

    if (!addProductForm.price || !addProductForm.quantity) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning',
      });
      return;
    }

    addProductMutation.mutate({
      productId: selectedProduct.id,
      storeId: parseInt(selectedStore),
      price: parseFloat(addProductForm.price),
      quantity: parseInt(addProductForm.quantity),
      measurement: addProductForm.measurement ? parseInt(addProductForm.measurement) : null,
      unit: addProductForm.unit || '',
    });
  };

  const getFilteredData = () => {
    if (!inventoryData) return [];

    return inventoryData.filter((item) =>
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'grid' : 'table');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Filter products based on search input
  const filteredProducts =
    productsData?.filter((product) =>
      product.name.toLowerCase().includes(productSearchInput.toLowerCase())
    ) || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Inventory Management
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}
        >
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Store</InputLabel>
            <Select value={selectedStore} onChange={handleStoreChange} label="Select Store">
              <MenuItem value="">
                <em>All Stores</em>
              </MenuItem>
              {storesData?.map((store) => (
                <MenuItem key={store.id} value={store.id}>
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />

          <Button
            variant="outlined"
            startIcon={viewMode === 'table' ? <GridIcon /> : <TableIcon />}
            onClick={toggleViewMode}
          >
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
            disabled={!selectedStore}
          >
            Add Product
          </Button>
        </Box>

        {storesError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading stores: {storesError.message}
          </Alert>
        )}

        {inventoryError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading inventory: {inventoryError.message}
          </Alert>
        )}

        {isLoadingStores || (selectedStore && isLoadingInventory) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {viewMode === 'table' ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Available</TableCell>
                      <TableCell>Listed</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredData()
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {item.product.image && (
                                <Box
                                  component="img"
                                  src={item.product.image}
                                  alt={item.product.name}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    mr: 2,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                  }}
                                />
                              )}
                              <Box>
                                <Typography variant="body1">{item.product.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.product.description}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{item.product.category?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.isAvailable ? 'Available' : 'Not Available'}
                              color={item.isAvailable ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.isListed ? 'Listed' : 'Not Listed'}
                              color={item.isListed ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>${item.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(item)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(item)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Grid container spacing={3}>
                {getFilteredData()
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={item.product.image || 'https://via.placeholder.com/140'}
                          alt={item.product.name}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography gutterBottom variant="h6" component="div" noWrap>
                            {item.product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {item.product.category?.name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} noWrap>
                            {item.product.description}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mt: 2,
                            }}
                          >
                            <Chip
                              label={`Qty: ${item.quantity}`}
                              color={item.quantity < 10 ? 'error' : 'success'}
                              size="small"
                            />
                            <Typography variant="h6" color="primary">
                              ₹{item.price.toFixed(2)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleEdit(item)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDelete(item)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            )}

            <TablePagination
              component="div"
              count={getFilteredData().length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ mt: 2 }}
            />
          </>
        )}
      </Paper>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Inventory Item</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {selectedItem.product.image && (
                  <Box
                    component="img"
                    src={selectedItem.product.image}
                    alt={selectedItem.product.name}
                    sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover', borderRadius: 1 }}
                  />
                )}
                <Box>
                  <Typography variant="subtitle1">{selectedItem.product.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedItem.product.category?.name || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <TextField
                label="Quantity"
                type="number"
                fullWidth
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Price ($)"
                type="number"
                fullWidth
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.value)}
                  label="Availability"
                >
                  <MenuItem value={true}>Available</MenuItem>
                  <MenuItem value={false}>Not Available</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Listing Status</InputLabel>
                <Select
                  value={isListed}
                  onChange={(e) => setIsListed(e.target.value)}
                  label="Listing Status"
                >
                  <MenuItem value={true}>Listed</MenuItem>
                  <MenuItem value={false}>Not Listed</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateConfirm}
            variant="contained"
            color="primary"
            disabled={updateInventoryMutation.isPending}
          >
            {updateInventoryMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Delete Inventory Item</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {selectedItem.product.image && (
                  <Box
                    component="img"
                    src={selectedItem.product.image}
                    alt={selectedItem.product.name}
                    sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover', borderRadius: 1 }}
                  />
                )}
                <Box>
                  <Typography variant="subtitle1">{selectedItem.product.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedItem.product.category?.name || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Are you sure you want to delete this inventory item?
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Quantity: {selectedItem.quantity}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Price: ₹{selectedItem.price.toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={addModalOpen} onClose={handleCloseAddModal} fullWidth maxWidth="md">
        <DialogTitle>Add Product to Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select a product to add to the store's inventory
            </Typography>

            <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
              <TextField
                ref={anchorRef}
                label="Search Product"
                placeholder="Start typing to search..."
                value={productSearchInput}
                onChange={handleProductSearchChange}
                onFocus={() => setDropdownOpen(true)}
                onClick={() => setDropdownOpen(true)}
                fullWidth
                InputProps={{
                  endAdornment: isLoadingProducts ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null,
                }}
              />
              <Popper
                open={dropdownOpen && filteredProducts.length > 0}
                anchorEl={anchorRef.current}
                placement="bottom-start"
                style={{ width: anchorRef.current?.offsetWidth, zIndex: 1300 }}
              >
                <ClickAwayListener onClickAway={handleClickAway}>
                  <Paper elevation={3}>
                    <MenuList sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {filteredProducts.map((product) => (
                        <MenuItem
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          selected={selectedProduct?.id === product.id}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {product.image && (
                              <Box
                                component="img"
                                src={product.image}
                                alt={product.name}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  mr: 2,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                }}
                              />
                            )}
                            <Box>
                              <Typography variant="body1">{product.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {product.categoryId
                                  ? `Category ID: ${product.categoryId}`
                                  : 'No category'}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Paper>
                </ClickAwayListener>
              </Popper>
            </FormControl>

            {selectedProduct && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Product:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {selectedProduct.image && (
                    <Box
                      component="img"
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover', borderRadius: 1 }}
                    />
                  )}
                  <Box>
                    <Typography variant="body1">{selectedProduct.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedProduct.description}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price ($)"
                  type="number"
                  name="price"
                  fullWidth
                  value={addProductForm.price}
                  onChange={handleAddProductFormChange}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  name="quantity"
                  fullWidth
                  value={addProductForm.quantity}
                  onChange={handleAddProductFormChange}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Measurement (optional)"
                  type="number"
                  name="measurement"
                  fullWidth
                  value={addProductForm.measurement}
                  onChange={handleAddProductFormChange}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unit (optional)"
                  name="unit"
                  fullWidth
                  value={addProductForm.unit}
                  onChange={handleAddProductFormChange}
                  placeholder="e.g., kg, g, L, ml"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>Cancel</Button>
          <Button
            onClick={handleAddProductConfirm}
            variant="contained"
            color="primary"
            disabled={addProductMutation.isPending || !selectedProduct}
          >
            {addProductMutation.isPending ? 'Adding...' : 'Add to Inventory'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryManagement;
