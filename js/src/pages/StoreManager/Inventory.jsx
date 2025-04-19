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
} from '@mui/material';
import {
  Edit,
  Delete,
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
            quantity
            price
            measurement
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
  mutation UpdateInventoryItem($inventoryId: ID!, $price: Float!, $quantity: Int!) {
    updateInventoryItem(inventoryId: $inventoryId, price: $price, quantity: $quantity) {
      id
      price
      quantity
      updatedAt
    }
  }
`;

const DELETE_INVENTORY_ITEM = `
  mutation DeleteInventoryItem($inventoryId: ID!) {
    deleteInventoryItem(inventoryId: $inventoryId) {
      id
    }
  }
`;

const Inventory = () => {
  // State variables
  const [cognitoId, setCognitoId] = useState('');
  const { userProfile, setUserProfile } = useAuthStore();
  const [selectedItem, setSelectedItem] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);

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
    console.log('Store data updated:', storeData);
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
    if (inventoryItems.length > 0) {
      const uniqueCategories = [
        ...new Set(inventoryItems.map((item) => item.product?.category?.name || 'Uncategorized')),
      ];
      setCategories(uniqueCategories);
    } else {
      setCategories([]);
    }
  }, [inventoryItems]);

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
      refetchInventory();
      setEditModalOpen(false);
      setSelectedItem(null);
      setNewPrice('');
      setNewQuantity('');
      setSuccessMessage('Inventory item updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error updating inventory: ${error.message}`);
    },
  });

  // Mutation for deleting inventory
  const deleteMutation = useMutation({
    mutationFn: ({ inventoryId }) => {
      return fetchGraphQL(DELETE_INVENTORY_ITEM, {
        inventoryId,
      });
    },
    onSuccess: () => {
      refetchInventory();
      setDeleteModalOpen(false);
      setSelectedItem(null);
      setSuccessMessage('Inventory item deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrorMessage(`Error deleting inventory: ${error.message}`);
    },
  });

  // Reset form when modal is closed
  useEffect(() => {
    if (!editModalOpen) {
      setNewPrice('');
      setNewQuantity('');
      setErrorMessage('');
    }
  }, [editModalOpen]);

  // Reset form when delete modal is closed
  useEffect(() => {
    if (!deleteModalOpen) {
      setErrorMessage('');
    }
  }, [deleteModalOpen]);

  const handleEditClick = (item) => {
    if (!item) return;

    setSelectedItem(item);
    setNewPrice(item.price ? item.price.toString() : '');
    setNewQuantity(item.quantity ? item.quantity.toString() : '');
    setEditModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
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

  const handleDeleteConfirm = () => {
    if (!selectedItem) return;

    deleteMutation.mutate({
      inventoryId: selectedItem.id,
    });
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
                <InputLabel id="category-label">Category</InputLabel>
                {/* Replace Material-UI Select with native select */}
                <select
                  id="category-select"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8.5px 14px',
                    fontSize: '1rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    backgroundColor: 'transparent',
                    appearance: 'auto',
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="stock-filter-label">Stock Filter</InputLabel>
                {/* Replace Material-UI Select with native select */}
                <select
                  id="stock-filter-select"
                  value={lowStockOnly ? 'true' : 'false'}
                  onChange={(e) => setLowStockOnly(e.target.value === 'true')}
                  style={{
                    width: '100%',
                    padding: '8.5px 14px',
                    fontSize: '1rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    backgroundColor: 'transparent',
                    appearance: 'auto',
                  }}
                >
                  <option value="false">All Items</option>
                  <option value="true">Low Stock Only</option>
                </select>
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
      <Container sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Inventory Management
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
              startIcon={<Add />}
              onClick={() => {
                // This would open a dialog to add a new product to inventory
                // Implementation would depend on your requirements
                setSuccessMessage('Add product functionality to be implemented');
                setTimeout(() => setSuccessMessage(''), 3000);
              }}
            >
              Add Product
            </Button>
          </Box>

          {filteredInventory.length === 0 ? (
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
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedInventory.map((item) => {
                      const isLowStock = item.quantity <= lowStockThreshold;
                      const inventoryItem = item.product?.inventoryItems?.edges[0]?.node;
                      return (
                        <React.Fragment key={item.productId}>
                          <TableRow
                            sx={{
                              backgroundColor: isLowStock ? 'rgba(255, 0, 0, 0.1)' : 'inherit',
                            }}
                          >
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleExpandClick(item.productId)}
                              >
                                {expandedItem === item.productId ? (
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
                            <TableCell>
                              {item.quantity}{' '}
                              {inventoryItem?.unit
                                ? getMeasurementUnitLabel(inventoryItem.unit)
                                : ''}
                            </TableCell>
                            <TableCell>
                              {isLowStock ? (
                                <Chip label="Low Stock" color="error" size="small" />
                              ) : (
                                <Chip label="In Stock" color="success" size="small" />
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
                              <IconButton
                                onClick={() => handleDeleteClick(item)}
                                size="small"
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ p: 0 }} colSpan={7}>
                              <Collapse
                                in={expandedItem === item.productId}
                                timeout="auto"
                                unmountOnExit
                              >
                                <Box sx={{ p: 3, backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        <strong>Description:</strong>{' '}
                                        {item.product?.description || 'No description available'}
                                      </Typography>
                                      <Typography variant="subtitle2" gutterBottom>
                                        <strong>Product ID:</strong> {item.productId}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        <strong>Last Updated:</strong>{' '}
                                        {inventoryItem?.updatedAt
                                          ? new Date(inventoryItem.updatedAt).toLocaleString()
                                          : 'N/A'}
                                      </Typography>
                                      <Typography variant="subtitle2" gutterBottom>
                                        <strong>Measurement:</strong>{' '}
                                        {inventoryItem?.measurement
                                          ? `${inventoryItem.measurement} ${getMeasurementUnitLabel(
                                              inventoryItem.unit
                                            )}`
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
                  <TextField
                    label="Price ($)"
                    type="number"
                    fullWidth
                    value={newPrice || ''}
                    onChange={(e) => setNewPrice(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={newQuantity || ''}
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

        {/* Delete Inventory Item Dialog */}
        <Dialog
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setErrorMessage('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Inventory Item</DialogTitle>
          <DialogContent>
            {selectedItem && (
              <>
                <Typography variant="body1" gutterBottom>
                  Are you sure you want to delete this inventory item?
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
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
                      Quantity: {selectedItem.quantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Price: ${selectedItem.price.toFixed(2)}
                    </Typography>
                  </Box>
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
                setDeleteModalOpen(false);
                setErrorMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Inventory;
