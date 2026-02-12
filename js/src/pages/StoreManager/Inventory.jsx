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
  Card,
  CardContent,
  CardMedia,
  Divider,
  Chip,
  Pagination,
  Stack,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Edit,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Add,
  Search,
  FilterList,
} from '@mui/icons-material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { useAuthStore } from '@/store/useStore';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Layout from '@/components/StoreManager/Layout';

// GraphQL Queries and Mutations
const GET_USER_PROFILE = `
  query GetUserProfile($userId: String!) {
    getUserProfile(userId: $userId) {
      id
      email
      mobile
      active
      type
      referralId
    }
  }
`;

const GET_STORE_WITH_INVENTORY = `
  query GetStoreWithInventory($managerId: Int!) {
    storesByManager(managerUserId: $managerId) {
      id
      name
      address
      radius
      inventory {
        edges {
                      node {
              id
              storeId
              productId
              quantity
              price
              measurement
              unit
              isAvailable
              isListed
              updatedAt
              product {
                id
                name
                description
                category {
                  id
                  name
                }
                image
              }
            }
        }
      }
    }
    products {
      id
      name
      description
      category {
        id
        name
      }
    }
  }
`;

const UPDATE_INVENTORY_ITEM = `
  mutation UpdateInventoryItem(
    $inventoryId: Int!
    $price: Float!
    $quantity: Int!
    $isAvailable: Boolean
    $isListed: Boolean
  ) {
    updateInventoryItem(
      inventoryId: $inventoryId
      price: $price
      quantity: $quantity
      isAvailable: $isAvailable
      isListed: $isListed
    ) {
      id
      price
      quantity
      isAvailable
      isListed
      updatedAt
    }
  }
`;



const ADD_PRODUCT_TO_INVENTORY = `
  mutation AddProductToInventory(
    $productId: Int!
    $storeId: Int!
    $price: Float!
    $quantity: Int!
    $measurement: Int
    $unit: String
  ) {
    addProductToInventory(
      productId: $productId
      storeId: $storeId
      price: $price
      quantity: $quantity
      measurement: $measurement
      unit: $unit
    ) {
      id
      measurement
      price
      productId
      quantity
      storeId
      unit
      updatedAt
      product {
        id
        name
        description
        category {
          id
          name
        }
        image
      }
    }
  }
`;


const EditDialog = React.memo(({ open, onClose, selectedItem, onUpdate, isLoading }) => {
  const [price, setPrice] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [isAvailable, setIsAvailable] = React.useState(true);
  const [isListed, setIsListed] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (selectedItem) {
      setPrice(selectedItem.price ? selectedItem.price.toString() : '');
      setQuantity(selectedItem.quantity ? selectedItem.quantity.toString() : '');
      setIsAvailable(selectedItem.isAvailable !== undefined ? selectedItem.isAvailable : true);
      setIsListed(selectedItem.isListed !== undefined ? selectedItem.isListed : true);
    }
  }, [selectedItem]);

  const handleUpdate = () => {
    // Validate inputs
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError('Please enter a valid price greater than zero.');
      return;
    }

    if (!quantity || isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) < 0) {
      setError('Please enter a valid quantity (0 or greater).');
      return;
    }

    setError('');
    onUpdate({
      inventoryId: selectedItem.id,
      price,
      quantity,
      isAvailable,
      isListed,
    });
  };

  const inputStyles = {
    width: '100%',
    padding: '8.5px 14px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid rgba(0, 0, 0, 0.23)',
    marginBottom: '16px',
    outline: 'none',
    '&:focus': {
      borderColor: '#1976d2',
      borderWidth: '2px',
    },
  };

  const labelStyles = {
    fontSize: '0.875rem',
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        setError('');
        onClose();
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Inventory Item</DialogTitle>
      <DialogContent>
        {selectedItem && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {selectedItem.product?.image && (
                <CardMedia
                  component="img"
                  sx={{ width: 80, height: 80, objectFit: 'contain', mr: 2 }}
                  image={selectedItem.product.image}
                  alt={selectedItem.product.name}
                />
              )}
              <Box>
                <Typography variant="subtitle1">
                  <strong>{selectedItem.product?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedItem.product?.category?.name || 'Uncategorized'}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mt: 2 }}>
              <label htmlFor="edit-price-input" style={labelStyles}>
                Price ($)
              </label>
              <input
                id="edit-price-input"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                style={inputStyles}
              />
              <label htmlFor="edit-quantity-input" style={labelStyles}>
                Quantity
              </label>
              <input
                id="edit-quantity-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                style={inputStyles}
              />
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Available (In Stock)"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={isListed}
                      onChange={(e) => setIsListed(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Listed (Visible to Customers)"
                />
              </Box>
            </Box>
          </>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setError('');
            onClose();
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdate}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isLoading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

const AddProductDialogNew = React.memo(
  ({ open, onClose, storeId, availableProducts, onAdd, isLoading, errorMessage }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formState, setFormState] = useState({
      price: '',
      quantity: '',
      measurement: '',
      unit: '',
      searchInput: '',
    });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const anchorRef = useRef(null);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormState((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const filteredProducts = React.useMemo(() => {
      return availableProducts.filter((product) =>
        product.name.toLowerCase().includes(formState.searchInput.toLowerCase())
      );
    }, [availableProducts, formState.searchInput]);

    const handleProductSelect = (product) => {
      setSelectedProduct(product);
      setFormState((prev) => ({
        ...prev,
        searchInput: product.name,
      }));
      setDropdownOpen(false);
    };

    const handleClickAway = () => {
      setDropdownOpen(false);
    };

    const handleSearchChange = (event) => {
      handleInputChange(event);
      setDropdownOpen(true);
    };

    const handleAdd = () => {
      if (!selectedProduct) return;

      onAdd({
        storeId,
        productId: selectedProduct.id,
        price: formState.price,
        quantity: formState.quantity,
        measurement: formState.measurement || null,
        unit: formState.unit || null,
      });
    };

    const resetForm = () => {
      setSelectedProduct(null);
      setFormState({
        price: '',
        quantity: '',
        measurement: '',
        unit: '',
        searchInput: '',
      });
    };

    React.useEffect(() => {
      if (!open) {
        resetForm();
      }
    }, [open]);

    const inputStyles = {
      width: '100%',
      padding: '8.5px 14px',
      fontSize: '1rem',
      borderRadius: '4px',
      border: '1px solid rgba(0, 0, 0, 0.23)',
      marginBottom: '16px',
      outline: 'none',
    };

    const labelStyles = {
      fontSize: '0.875rem',
      color: 'rgba(0, 0, 0, 0.6)',
      marginBottom: '4px',
      display: 'block',
    };

    return (
      <Dialog
        open={open}
        onClose={() => {
          onClose();
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Product to Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <label htmlFor="searchInput" style={labelStyles}>
              Search Product
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="searchInput"
                name="searchInput"
                type="text"
                placeholder="Start typing to search..."
                value={formState.searchInput}
                onChange={handleSearchChange}
                onFocus={() => setDropdownOpen(true)}
                style={inputStyles}
                ref={anchorRef}
              />
              {isLoading && (
                <CircularProgress
                  size={20}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </div>
            {dropdownOpen && filteredProducts.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  width: anchorRef.current?.offsetWidth,
                  zIndex: 1300,
                  backgroundColor: '#fff',
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px',
                  maxHeight: '300px',
                  overflow: 'auto',
                }}
              >
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      backgroundColor:
                        selectedProduct?.id === product.id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      },
                    }}
                  >
                    <div>{product.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                      {product.category.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <label htmlFor="price" style={labelStyles}>
              Price ($)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              value={formState.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              style={inputStyles}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <label htmlFor="quantity" style={labelStyles}>
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              value={formState.quantity}
              onChange={handleInputChange}
              min="0"
              style={inputStyles}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <label htmlFor="measurement" style={labelStyles}>
              Measurement
            </label>
            <input
              id="measurement"
              name="measurement"
              type="number"
              value={formState.measurement}
              onChange={handleInputChange}
              min="0"
              style={inputStyles}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <label htmlFor="unit" style={labelStyles}>
              Unit
            </label>
            <select
              id="unit"
              name="unit"
              value={formState.unit}
              onChange={handleInputChange}
              style={{
                ...inputStyles,
                backgroundColor: 'transparent',
                appearance: 'auto',
                height: '40px',
              }}
            >
              <option value="">None</option>
              <option value="1">Grams (g)</option>
              <option value="2">Kilograms (kg)</option>
              <option value="3">Milliliters (ml)</option>
              <option value="4">Liters (L)</option>
              <option value="5">Pieces (pcs)</option>
            </select>
          </Box>

          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              onClose();
              resetForm();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAdd}
            disabled={isLoading || !selectedProduct || !formState.price || !formState.quantity}
            startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {isLoading ? 'Adding Product...' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

const Inventory = () => {
  // State variables
  const [cognitoId, setCognitoId] = useState('');
  const { userProfile, setUserProfile } = useAuthStore();
  const [selectedItem, setSelectedItem] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [expandedItem, setExpandedItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  // Create refs for select elements to prevent focus issues
  const categorySelectRef = useRef(null);
  const stockFilterSelectRef = useRef(null);

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

  // Fetch user profile using Cognito ID
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['getUserProfile', cognitoId],
    queryFn: async () => {
      console.log('Fetching user profile with cognitoId:', cognitoId);
      const response = await fetchGraphQL(GET_USER_PROFILE, { userId: cognitoId });
      console.log('User profile response:', response);

      if (response?.getUserProfile) {
        console.log('Setting user profile:', response.getUserProfile);
        setUserProfile(response.getUserProfile);
      }

      return response;
    },
    enabled: !!cognitoId,
  });

  // Fetch inventory data
  const {
    data: storeData,
    isLoading: inventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useQuery({
    queryKey: ['storeWithInventory', userProfile?.id],
    queryFn: () => {
      console.log('Fetching store data with managerId:', userProfile?.id);
      return fetchGraphQL(GET_STORE_WITH_INVENTORY, { managerId: userProfile?.id });
    },
    enabled: !!userProfile?.id,
  });

  // Log store data when it changes
  useEffect(() => {
    if (storeData && storeData.products) {
      setTableLoading(false);
    }
  }, [storeData]);

  // Extract store, inventory, and products from the combined query response
  const store = storeData?.storesByManager && storeData.storesByManager[0];
  const inventoryItems = store?.inventory?.edges?.map((edge) => edge.node) || [];
  const availableProducts = storeData?.products || [];

  // Memoize filtered inventory to prevent unnecessary recalculations
  const filteredInventory = React.useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStock = !lowStockOnly || item.quantity <= lowStockThreshold;

      const matchesCategory =
        filterCategory === 'all' || item.product?.category?.name === filterCategory;

      return matchesSearch && matchesStock && matchesCategory;
    });
  }, [inventoryItems, searchTerm, lowStockOnly, lowStockThreshold, filterCategory]);

  // Memoize paginated inventory
  const paginatedInventory = React.useMemo(() => {
    return filteredInventory.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [filteredInventory, page, rowsPerPage]);

  // Extract unique categories from inventory items
  useEffect(() => {
    const uniqueCategories = [
      ...new Set(
        inventoryItems
          .map((item) => item.product?.category?.name || 'Uncategorized')
          .filter(Boolean)
      ),
    ].sort();

    if (JSON.stringify(uniqueCategories) !== JSON.stringify(categories)) {
      setCategories(uniqueCategories);
    }
  }, [inventoryItems]);

  // Mutation for updating inventory
  const updateMutation = useMutation({
    mutationFn: ({ inventoryId, price, quantity, isAvailable, isListed }) => {
      return fetchGraphQL(UPDATE_INVENTORY_ITEM, {
        inventoryId,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        isAvailable: isAvailable !== undefined ? isAvailable : null,
        isListed: isListed !== undefined ? isListed : null,
      });
    },
    onSuccess: () => {
      refetchInventory();
      setEditModalOpen(false);
      setSelectedItem(null);
      setSuccessMessage('Inventory item updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error updating inventory: ${error.message}`);
    },
  });



  // Mutation for adding product to inventory
  const addMutation = useMutation({
    mutationFn: ({ storeId, productId, price, quantity, measurement, unit }) => {
      return fetchGraphQL(ADD_PRODUCT_TO_INVENTORY, {
        storeId: parseInt(storeId, 10),
        productId: parseInt(productId, 10),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        measurement: measurement ? parseInt(measurement, 10) : null,
        unit: unit || null,
      });
    },
    onSuccess: () => {
      refetchInventory();
      setAddModalOpen(false);
      setSuccessMessage('Product added to inventory successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error adding product: ${error.message}`);
    },
  });

  const handleEditClick = (item) => {
    if (!item) return;

    setSelectedItem(item);
    setEditModalOpen(true);
  };



  const handleExpandClick = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const getMeasurementUnitLabel = (unit) => {
    switch (unit) {
      case 'ml':
        return 'ml';
      case 'grams':
        return 'g';
      case 'kg':
        return 'kg';
      case 'L':
        return 'L';
      case 'pcs':
        return 'pcs';
      case 'pieces':
        return 'pcs';
      default:
        return unit || '';
    }
  };

  // Create a separate component for the filters to isolate state updates
  const FilterControls = React.memo(
    ({
      searchTerm,
      setSearchTerm,
      filterCategory,
      setFilterCategory,
      lowStockOnly,
      setLowStockOnly,
      lowStockThreshold,
      setLowStockThreshold,
      categories,
    }) => {
      const selectStyles = {
        width: '100%',
        padding: '8.5px 14px',
        fontSize: '1rem',
        borderRadius: '4px',
        border: '1px solid rgba(0, 0, 0, 0.23)',
        backgroundColor: 'transparent',
        appearance: 'auto',
        height: '40px', // Match Material-UI small input height
      };

      const labelStyles = {
        fontSize: '0.875rem',
        color: 'rgba(0, 0, 0, 0.6)',
        marginBottom: '4px',
        display: 'block',
      };

      return (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="Search Products"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="stock-filter-label">Stock Filter</InputLabel>
                <Select
                  labelId="stock-filter-label"
                  id="stock-filter-select"
                  value={lowStockOnly ? 'true' : 'false'}
                  label="Stock Filter"
                  onChange={(e) => setLowStockOnly(e.target.value === 'true')}
                >
                  <MenuItem value="false">All Items</MenuItem>
                  <MenuItem value="true">Low Stock Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Low Stock Threshold"
                type="number"
                size="small"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
                disabled={!lowStockOnly}
                fullWidth
              />
            </Grid>
          </Grid>
        </Paper>
      );
    }
  );

  if (profileLoading || inventoryLoading) {
    return (
      <Layout>
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  if (inventoryError) {
    return (
      <Layout>
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">Error loading inventory data: {inventoryError.message}</Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <>
        <Typography variant="h4" gutterBottom>
          Store Inventory Management
        </Typography>

        {/* Search and Filters */}
        <FilterControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          lowStockOnly={lowStockOnly}
          setLowStockOnly={setLowStockOnly}
          lowStockThreshold={lowStockThreshold}
          setLowStockThreshold={setLowStockThreshold}
          categories={categories}
        />

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {/* Inventory Table */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h5">Inventory Items</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={
                addMutation.isPending || addMutation.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Add />
                )
              }
              onClick={() => setAddModalOpen(true)}
              disabled={addMutation.isPending || addMutation.isPending}
            >
              {addMutation.isPending || addMutation.isPending ? 'Adding...' : 'Add Product'}
            </Button>
          </Box>

          {tableLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredInventory.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No inventory items match your filters.
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell />
                      <TableCell>Product</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Available</TableCell>
                      <TableCell>Listed</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedInventory.map((item) => {
                      return (
                        <React.Fragment key={item.id}>
                          <TableRow
                            sx={{
                              backgroundColor: !item?.isAvailable
                                ? 'rgba(255, 0, 0, 0.1)'
                                : 'inherit',
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
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {item.product?.image && (
                                  <CardMedia
                                    component="img"
                                    sx={{ width: 50, height: 50, objectFit: 'contain', mr: 2 }}
                                    image={item.product.image}
                                    alt={item.product.name}
                                  />
                                )}
                                <Typography>{item.product?.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{item.product?.category?.name || 'Uncategorized'}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              {!item?.isAvailable ? (
                                <Chip label="Low Stock" color="error" size="small" />
                              ) : (
                                <Chip label="In Stock" color="success" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              {item?.isListed ? (
                                <Chip label="Listed" color="success" size="small" />
                              ) : (
                                <Chip label="Not Listed" color="error" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => handleEditClick(item)}
                                size="small"
                                color="primary"
                                disabled={
                                  updateMutation.isPending ||
                                  updateMutation.isLoading ||
                                  addMutation.isPending ||
                                  addMutation.isLoading
                                }
                              >
                                <Edit />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ p: 0 }} colSpan={7}>
                              <Collapse in={expandedItem === item.id} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 3, backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        <strong>Description:</strong>{' '}
                                        {item.product?.description || 'No description available'}
                                      </Typography>
                                      <Typography variant="subtitle2" gutterBottom>
                                        <strong>Product ID:</strong> {item.product?.id}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        <strong>Last Updated:</strong>{' '}
                                        {item.updatedAt
                                          ? new Date(item.updatedAt).toLocaleString()
                                          : 'N/A'}
                                      </Typography>
                                      <Typography variant="subtitle2" gutterBottom>
                                        <strong>Measurement:</strong>{' '}
                                        {item.measurement && item.unit
                                          ? `${item.measurement} ${item.unit}`
                                          : 'N/A'}
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

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={Math.ceil(filteredInventory.length / rowsPerPage)}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </Paper>

        {/* Edit Dialog */}
        <EditDialog
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setErrorMessage('');
          }}
          selectedItem={selectedItem}
          onUpdate={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
        />



        <AddProductDialogNew
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          storeId={store?.id}
          availableProducts={availableProducts}
          onAdd={addMutation.mutate}
          isLoading={addMutation.isPending}
          errorMessage={errorMessage}
        />
      </>
    </Layout>
  );
};

export default Inventory;
