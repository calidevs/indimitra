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
} from '@mui/material';
import { Edit, KeyboardArrowDown, KeyboardArrowUp, Add } from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { useAuthStore } from '@/store/useStore';
import { fetchUserAttributes } from 'aws-amplify/auth';
import {
  GET_USER_PROFILE,
  GET_STORE_WITH_INVENTORY,
  UPDATE_INVENTORY_ITEM,
  ADD_PRODUCT_TO_INVENTORY,
} from '@/queries/operations';
import Layout from '@/components/StoreManager/Layout';

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

  // Set isInitialLoad to false after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
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

  // Fetch store, inventory, and products data in a single query
  const {
    data: storeData,
    isLoading: storeLoading,
    error: storeError,
    refetch: refetchStoreData,
  } = useQuery({
    queryKey: ['storeWithInventory', userProfile?.id],
    queryFn: () => fetchGraphQL(GET_STORE_WITH_INVENTORY, { managerId: userProfile.id }),
    enabled: !!userProfile?.id,
  });

  // Extract store, inventory, and products from the combined query response
  const store = storeData?.storesByManager && storeData.storesByManager[0];
  const inventory = store?.inventory?.edges?.map((edge) => edge.node) || [];
  const availableProducts = storeData?.products || [];

  // Update filtered products when search input or available products change
  useEffect(() => {
    if (searchInput.trim() === '') {
      setFilteredProducts(availableProducts);
    } else {
      const filtered = availableProducts.filter((product) =>
        product.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchInput, availableProducts]);

  // Mutation for updating inventory
  const updateMutation = useMutation({
    mutationFn: ({ inventoryId, price, quantity }) => {
      return fetchGraphQL(UPDATE_INVENTORY_ITEM, {
        inventoryId,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
      });
    },
    onSuccess: () => {
      refetchStoreData();
      setEditModalOpen(false);
      setSelectedItem(null);
      setNewPrice('');
      setNewQuantity('');
    },
    onError: (error) => {
      setErrorMessage(`Error updating inventory: ${error.message}`);
    },
  });

  // Mutation for adding product to inventory
  const addMutation = useMutation({
    mutationFn: ({ storeId, productId, price, quantity, size, measurementUnit }) => {
      return fetchGraphQL(ADD_PRODUCT_TO_INVENTORY, {
        storeId,
        productId: parseInt(productId, 10),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        size: size ? parseFloat(size) : null,
        measurement_unit: measurementUnit ? parseInt(measurementUnit, 10) : null,
      });
    },
    onSuccess: () => {
      refetchStoreData();
      setAddModalOpen(false);
      resetAddForm();
    },
    onError: (error) => {
      setErrorMessage(`Error adding product: ${error.message}`);
    },
  });

  // Filter inventory items based on search term and low stock filter
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.category.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStock = !lowStockOnly || item.quantity <= lowStockThreshold;

    return matchesSearch && matchesStock;
  });

  // Create paginated inventory
  const paginatedInventory = React.useMemo(() => {
    return filteredInventory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredInventory, page, rowsPerPage]);

  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setNewPrice(item.price.toString());
    setNewQuantity(item.quantity.toString());
    setEditModalOpen(true);
  };

  const handleAddClick = () => {
    setAddModalOpen(true);
  };

  const handleUpdateConfirm = () => {
    if (!selectedItem) return;

    // Validate inputs
    if (!newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) {
      setErrorMessage('Please enter a valid price greater than zero.');
      return;
    }

    if (!newQuantity || isNaN(parseInt(newQuantity, 10)) || parseInt(newQuantity, 10) < 0) {
      setErrorMessage('Please enter a valid quantity (0 or greater).');
      return;
    }

    setErrorMessage('');
    updateMutation.mutate({
      inventoryId: selectedItem.id,
      price: newPrice,
      quantity: newQuantity,
    });
  };

  const handleAddConfirm = () => {
    // Validate inputs
    if (!selectedProduct) {
      setErrorMessage('Please select a product.');
      return;
    }

    if (!addPrice || isNaN(parseFloat(addPrice)) || parseFloat(addPrice) <= 0) {
      setErrorMessage('Please enter a valid price greater than zero.');
      return;
    }

    if (!addQuantity || isNaN(parseInt(addQuantity, 10)) || parseInt(addQuantity, 10) < 0) {
      setErrorMessage('Please enter a valid quantity (0 or greater).');
      return;
    }

    setErrorMessage('');
    addMutation.mutate({
      storeId: store.id,
      productId: selectedProduct,
      price: addPrice,
      quantity: addQuantity,
      size: addSize || null,
      measurementUnit: addUnit || null,
    });
  };

  const resetAddForm = () => {
    setSelectedProduct('');
    setAddPrice('');
    setAddQuantity('');
    setAddSize('');
    setAddUnit('');
  };

  const handleExpandClick = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const getMeasurementUnitLabel = (unit) => {
    switch (unit) {
      case 1:
        return 'g';
      case 2:
        return 'kg';
      case 3:
        return 'ml';
      case 4:
        return 'L';
      case 5:
        return 'pcs';
      default:
        return '';
    }
  };

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
    setDropdownOpen(true);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product.id);
    setSearchInput(product.name);
    setDropdownOpen(false);
  };

  const handleClickAway = () => {
    setDropdownOpen(false);
  };

  // Check loading state first
  if (profileLoading || storeLoading || isInitialLoad) {
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

  // Check if store exists
  if (!store) {
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
          <Typography variant="h5" gutterBottom>
            Store Information
          </Typography>
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
                <strong>Total Products:</strong> {inventory.length}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Inventory Management */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5">Inventory Management</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddClick}
            >
              Add Product
            </Button>
          </Box>

          {/* Search and Filters */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Search Products"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: '200px' }}
            />

            <FormControl size="small" sx={{ minWidth: '150px' }}>
              <InputLabel>Stock Filter</InputLabel>
              <Select
                value={lowStockOnly}
                label="Stock Filter"
                onChange={(e) => setLowStockOnly(e.target.value)}
              >
                <MenuItem value={false}>All Items</MenuItem>
                <MenuItem value={true}>Low Stock Only</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Low Stock Threshold"
              type="number"
              size="small"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
              disabled={!lowStockOnly}
              sx={{ width: '150px' }}
            />
          </Box>

          {storeLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : storeError ? (
            <Alert severity="error" sx={{ my: 2 }}>
              Error loading store data: {storeError.message}
            </Alert>
          ) : (
            <>
              {filteredInventory.length === 0 ? (
                <Alert severity="info" sx={{ my: 2 }}>
                  No inventory items match your filters.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell />
                        <TableCell>Product</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedInventory.map((item) => {
                        const isLowStock = item.quantity <= lowStockThreshold;
                        return (
                          <React.Fragment key={item.id}>
                            <TableRow
                              sx={{
                                backgroundColor: isLowStock ? 'rgba(255, 0, 0, 0.1)' : 'inherit',
                              }}
                            >
                              <TableCell>
                                <IconButton size="small" onClick={() => handleExpandClick(item.id)}>
                                  {expandedItem === item.id ? (
                                    <KeyboardArrowUp />
                                  ) : (
                                    <KeyboardArrowDown />
                                  )}
                                </IconButton>
                              </TableCell>
                              <TableCell>{item.product.name}</TableCell>
                              <TableCell>{item.product.category.name}</TableCell>
                              <TableCell>${item.price.toFixed(2)}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                {isLowStock ? (
                                  <Typography color="error">Low Stock</Typography>
                                ) : (
                                  <Typography color="success.main">In Stock</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  onClick={() => handleEditClick(item)}
                                  size="small"
                                  color="primary"
                                >
                                  <Edit />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ p: 0 }} colSpan={7}>
                                <Collapse
                                  in={expandedItem === item.id}
                                  timeout="auto"
                                  unmountOnExit
                                >
                                  <Box sx={{ p: 3, backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          <strong>Description:</strong>{' '}
                                          {item.product.description || 'No description available'}
                                        </Typography>
                                        <Typography variant="subtitle2" gutterBottom>
                                          <strong>Size:</strong> {item.size || 'N/A'}{' '}
                                          {item.measurement_unit
                                            ? getMeasurementUnitLabel(item.measurement_unit)
                                            : ''}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          <strong>Last Updated:</strong>{' '}
                                          {new Date(item.updatedAt).toLocaleString()}
                                        </Typography>
                                        <Typography variant="subtitle2" gutterBottom>
                                          <strong>Product ID:</strong> {item.product.id}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredInventory.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>

        {/* Edit Inventory Item Dialog */}
        <Dialog
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setErrorMessage('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogContent>
            {selectedItem && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Product:</strong> {selectedItem.product.name}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Category:</strong> {selectedItem.product.category.name}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Price ($)"
                    type="number"
                    fullWidth
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </>
            )}
            {errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditModalOpen(false);
                setErrorMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateConfirm}
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? <CircularProgress size={24} /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Product to Inventory Dialog */}
        <Dialog
          open={addModalOpen}
          onClose={() => {
            setAddModalOpen(false);
            resetAddForm();
            setErrorMessage('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Product to Inventory</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <TextField
                ref={anchorRef}
                label="Search Product"
                placeholder="Start typing to search..."
                value={searchInput}
                onChange={handleSearchChange}
                onFocus={() => setDropdownOpen(true)}
                fullWidth
                InputProps={{
                  endAdornment: storeLoading ? (
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
                          selected={selectedProduct === product.id}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body1">{product.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {product.category.name}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Paper>
                </ClickAwayListener>
              </Popper>
            </FormControl>
            <TextField
              label="Price ($)"
              type="number"
              fullWidth
              value={addPrice}
              onChange={(e) => setAddPrice(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ mt: 2 }}
            />
            <TextField
              label="Quantity (No of Items In Inventory)"
              type="number"
              fullWidth
              value={addQuantity}
              onChange={(e) => setAddQuantity(e.target.value)}
              inputProps={{ min: 0 }}
              sx={{ mt: 2 }}
            />
            <TextField
              label="Measurement"
              type="number"
              fullWidth
              value={addSize}
              onChange={(e) => setAddSize(e.target.value)}
              inputProps={{ min: 0 }}
              sx={{ mt: 2 }}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Unit</InputLabel>
              <Select value={addUnit} onChange={(e) => setAddUnit(e.target.value)} label="Unit">
                <MenuItem value="">None</MenuItem>
                <MenuItem value="1">Grams (g)</MenuItem>
                <MenuItem value="2">Kilograms (kg)</MenuItem>
                <MenuItem value="3">Milliliters (ml)</MenuItem>
                <MenuItem value="4">Liters (L)</MenuItem>
                <MenuItem value="5">Pieces (pcs)</MenuItem>
              </Select>
            </FormControl>
            {errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAddModalOpen(false);
                resetAddForm();
                setErrorMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddConfirm}
              disabled={addMutation.isLoading}
            >
              {addMutation.isLoading ? <CircularProgress size={24} /> : 'Add Product'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default StoreManagerDashboard;
