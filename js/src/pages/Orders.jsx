import React, { useState, useEffect, useReducer } from 'react';
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
  Chip,
  CircularProgress,
  IconButton,
  Collapse,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
  Grid,
  Divider,
  Card,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Receipt,
  ShoppingBag,
  LocalShipping,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { fetchAuthSession } from 'aws-amplify/auth';
import fetchGraphQL from '@/config/graphql/graphqlService';
import {
  GET_USER_ORDERS,
  CANCEL_ORDER,
  GET_USER_PROFILE,
  UPDATE_ORDER_ITEMS,
} from '@/queries/operations';
import useStore, { useAuthStore } from '@/store/useStore';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Orders = () => {
  // Force re-render function
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [cognitoId, setCognitoId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelMessage, setCancelMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add state for editing quantity
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [tempQuantity, setTempQuantity] = useState(null);

  // Add state for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get zustand state and functions
  const { userProfile, setUserProfile } = useAuthStore();
  const getLatestProfile = () => useAuthStore.getState().userProfile;

  // Fetch Cognito ID from session
  useEffect(() => {
    const getUserId = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          const id = session.tokens.idToken.payload.sub;
          console.log('Fetched Cognito ID:', id);
          setCognitoId(id);
        } else {
          console.warn('No valid session tokens found.');
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    getUserId();
  }, []);

  // Fetch user profile with Cognito ID and store in Zustand
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['getUserProfile', cognitoId],
    queryFn: async () => {
      console.log('Fetching user profile with cognitoId:', cognitoId);
      const response = await fetchGraphQL(GET_USER_PROFILE, { userId: cognitoId });
      console.log('User profile API response:', response);

      // Set profile data immediately when we get it
      if (response?.getUserProfile) {
        console.log('Setting profile in store:', response.getUserProfile);
        setUserProfile(response.getUserProfile);

        // Force refresh after a small delay
        setTimeout(() => {
          console.log('Current profile in store:', getLatestProfile());
          forceUpdate();
        }, 200);
      }

      return response;
    },
    enabled: !!cognitoId,
    onError: (error) => {
      console.error('Error fetching user profile:', error);
    },
  });

  // Get the effective profile from any available source
  const directStoreProfile = getLatestProfile();
  const effectiveProfile = directStoreProfile || userProfile || profileData?.getUserProfile;

  console.log('Orders Page State:', {
    directStoreProfile,
    zustandHookProfile: userProfile,
    apiProfile: profileData?.getUserProfile,
    using: effectiveProfile,
  });

  // Fetch orders using the user's numeric ID
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch,
  } = useQuery({
    queryKey: ['userOrders', effectiveProfile?.id],
    queryFn: () => fetchGraphQL(GET_USER_ORDERS, { userId: effectiveProfile.id }),
    enabled: !!effectiveProfile?.id,
  });

  const mutation = useMutation({
    mutationFn: (variables) =>
      fetchGraphQL(CANCEL_ORDER, {
        orderId: variables.orderId,
        cancelMessage: variables.cancelMessage,
        cancelledByUserId: effectiveProfile.id,
      }),
    onSuccess: () => {
      refetch();
      handleCloseModal();
      setCancelMessage('');
    },
  });

  const updateOrderItemsMutation = useMutation({
    mutationFn: (variables) =>
      fetchGraphQL(UPDATE_ORDER_ITEMS, {
        orderId: variables.orderId,
        orderItemUpdates: variables.orderItemUpdates,
        totalAmount: variables.totalAmount,
        orderTotalAmount: variables.orderTotalAmount,
        taxAmount: variables.taxAmount,
      }),
    onSuccess: () => {
      refetch();
    },
  });

  const handleOpenModal = (orderId) => {
    setSelectedOrderId(orderId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOrderId(null);
  };

  const handleConfirmCancel = () => {
    if (selectedOrderId && cancelMessage.trim()) {
      mutation.mutate({
        orderId: selectedOrderId,
        cancelMessage: cancelMessage.trim(),
      });
    }
  };

  const handleExpandClick = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleFileAction = async (orderId) => {
    if (isLoading) {
      console.log('Already loading, skipping call');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting file fetch for order:', orderId);

      const baseUrl = window.location.href?.includes('http://localhost')
        ? 'http://127.0.0.1:8000'
        : 'https://indimitra.com';

      const response = await fetch(
        `${baseUrl}/s3/generate-view-url?order_id=${orderId}&file_name=order_${orderId}.jpeg`
      );

      if (response.status === 200) {
        const data = await response.json();
        console.log('S3 URL response:', data);

        if (data?.view_url) {
          console.log('Found file URL, initiating download:', data.view_url);
          const link = document.createElement('a');
          link.href = data.view_url;
          link.download = data.file_name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
      }

      alert('No bill available for this order');
    } catch (error) {
      console.error('Error getting file URL:', error);
      alert('Error downloading the bill. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityUpdate = (order, item, newQuantity) => {
    console.log('handleQuantityUpdate called with:', {
      order,
      item,
      newQuantity,
    });

    if (!item || !item.id) {
      console.error('Invalid item or missing item ID:', item);
      return;
    }

    const currentQuantity = item.quantity;
    const price = item.product.inventoryItems?.edges[0]?.node?.price || 0;
    const quantityChange = newQuantity - currentQuantity;

    // Calculate new totals
    const itemAmountChange = price * quantityChange;
    const newTotalAmount = order.totalAmount + itemAmountChange;

    // If newTotalAmount is 0 (all items removed), set all amounts to 0
    const newTaxAmount = newTotalAmount === 0 ? 0 : newTotalAmount * 0.1;
    const newOrderTotalAmount =
      newTotalAmount === 0
        ? 0
        : newTotalAmount + newTaxAmount + (order.deliveryFee || 0) + (order.tipAmount || 0);

    const mutationVariables = {
      orderId: parseInt(order.id, 10),
      orderItemUpdates: [
        {
          orderItemId: parseInt(item.id, 10),
          quantityChange: quantityChange,
        },
      ],
      totalAmount: newTotalAmount,
      orderTotalAmount: newOrderTotalAmount,
      taxAmount: newTaxAmount,
    };

    console.log('Sending mutation with variables:', mutationVariables);

    updateOrderItemsMutation.mutate(mutationVariables);
  };

  const handleRemoveItem = (order, item) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Item',
      message: 'Are you sure you want to remove this item from the order?',
      onConfirm: () => {
        handleQuantityUpdate(order, item, 0);
        setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
      },
    });
  };

  // Update the helper function to get the latest version of an order item
  const getLatestOrderItem = (orderItems) => {
    if (!orderItems?.edges?.length) return null;

    // Create a map of all items
    const itemMap = new Map();
    orderItems.edges.forEach(({ node }) => {
      itemMap.set(node.id, node);
    });

    // Find items that have updatedOrderitemsId as null (these are the latest versions)
    const latestItems = orderItems.edges
      .map(({ node }) => node)
      .filter((item) => item.updatedOrderitemsId === null);

    console.log('Latest items:', latestItems);
    return latestItems;
  };

  // Add a helper function to build item history
  const buildItemHistory = (currentItem, allItems) => {
    console.log('Building history for current item:', currentItem);

    // Create a map of all items for quick lookup
    const itemMap = new Map();
    allItems.forEach(({ node }) => {
      itemMap.set(node.id, node);
    });

    // Start with the current item
    const history = [currentItem];
    let currentId = currentItem.id;

    // Follow the chain of updates
    while (true) {
      // Find the item that references the current item
      const nextItem = Array.from(itemMap.values()).find(
        (item) => item.updatedOrderitemsId === currentId
      );

      if (!nextItem) break;

      console.log('Found previous version:', nextItem);
      history.push(nextItem);
      currentId = nextItem.id;
    }

    // Reverse the history to show oldest to newest
    const orderedHistory = history.reverse();
    console.log('Complete history array:', orderedHistory);
    return orderedHistory;
  };

  // Update the handlers for quantity editing
  const handleEditQuantity = (item) => {
    setEditingQuantity(item.id);
    setTempQuantity(item.quantity);
  };

  const handleCancelEdit = () => {
    setEditingQuantity(null);
    setTempQuantity(null);
  };

  const handleSubmitQuantity = (order, item) => {
    if (tempQuantity === 0) {
      // Show confirmation dialog for removing item
      setConfirmDialog({
        open: true,
        title: 'Remove Item',
        message: 'Are you sure you want to remove this item from the order?',
        onConfirm: () => {
          handleQuantityUpdate(order, item, 0);
          setEditingQuantity(null);
          setTempQuantity(null);
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
        },
      });
    } else if (tempQuantity > 0) {
      handleQuantityUpdate(order, item, tempQuantity);
      setEditingQuantity(null);
      setTempQuantity(null);
    }
  };

  // Add a helper function to check if order is editable
  const isOrderEditable = (status) => {
    return ['PENDING', 'ORDER_PLACED', 'ACCEPTED'].includes(status);
  };

  // Show loading while fetching profile or orders
  if (profileLoading || (ordersLoading && effectiveProfile?.id))
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (profileError) return <Typography color="error">Error fetching user profile!</Typography>;

  if (ordersError && effectiveProfile?.id)
    return <Typography color="error">Error fetching orders!</Typography>;

  const orders = ordersData?.getOrdersByUser || [];

  // Sort orders by ID in descending order (newest first)
  const sortedOrders = [...orders].sort((a, b) => b.id - a.id);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, px: { xs: 1, sm: 2, md: 3 } }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          mb: { xs: 2, sm: 3 },
        }}
      >
        My Orders
      </Typography>

      {sortedOrders.length === 0 ? (
        <Typography>No orders found!</Typography>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            mt: 2,
            overflowX: 'auto',
            '& .MuiTableCell-root': {
              px: { xs: 1, sm: 2 },
              py: { xs: 1.5, sm: 2 },
              whiteSpace: 'nowrap',
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Order ID</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Total</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  Delivery Date
                </TableCell>
                <TableCell>Bill</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow onClick={() => handleExpandClick(order.id)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {order.id}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {order.type === 'PICKUP' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShoppingBag fontSize="small" />
                            {order.pickupAddress?.address || 'Pickup location not specified'}
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalShipping fontSize="small" />
                            {order.address?.address || 'No address provided'}
                          </Box>
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size={isMobile ? 'small' : 'medium'}
                        color={
                          order.status === 'COMPLETE'
                            ? 'success'
                            : order.status === 'PENDING' || order.status === 'ORDER_PLACED'
                              ? 'warning'
                              : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      ${order.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Download Bill">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileAction(order.id);
                            }}
                          >
                            <Receipt />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                          variant="contained"
                          color="error"
                          size={isMobile ? 'small' : 'medium'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(order.id);
                          }}
                          disabled={!isOrderEditable(order.status)}
                        >
                          Cancel
                        </Button>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandClick(order.id);
                          }}
                          size="small"
                        >
                          {expandedOrder === order.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Row for Order Items */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={expandedOrder === order.id} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: { xs: 1, sm: 2 } }}>
                          <Grid container spacing={{ xs: 2, sm: 3 }}>
                            {/* Order Items Section */}
                            <Grid item xs={12}>
                              <Typography
                                variant="h6"
                                gutterBottom
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  color: 'primary.main',
                                  fontWeight: 600,
                                  fontSize: { xs: '1rem', sm: '1.25rem' },
                                }}
                              >
                                <ShoppingBag /> Order Items
                              </Typography>
                              <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
                                {order.orderItems?.edges?.length > 0 ? (
                                  <Grid container spacing={{ xs: 1, sm: 2 }}>
                                    {getLatestOrderItem(order.orderItems).map((node) => {
                                      console.log('Processing latest item:', node);
                                      const inventoryItem =
                                        node.product.inventoryItems?.edges[0]?.node;

                                      // Build the history for this item
                                      const itemHistory = buildItemHistory(
                                        node,
                                        order.orderItems.edges
                                      );
                                      console.log('Item history for', node.id, ':', itemHistory);

                                      return (
                                        <Grid item xs={12} key={node.id}>
                                          <Card
                                            variant="outlined"
                                            sx={{
                                              p: { xs: 1.5, sm: 2 },
                                              '&:hover': {
                                                bgcolor: 'grey.50',
                                              },
                                            }}
                                          >
                                            {/* Current Item */}
                                            <Grid
                                              container
                                              spacing={{ xs: 1, sm: 2 }}
                                              alignItems="center"
                                            >
                                              <Grid item xs={12} sm={4}>
                                                <Typography
                                                  variant="subtitle1"
                                                  fontWeight={600}
                                                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                                >
                                                  {node.product.name}
                                                </Typography>
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                  fontWeight={500}
                                                >
                                                  {node.product.category.name}
                                                </Typography>
                                                {itemHistory.length > 1 && (
                                                  <Typography
                                                    variant="caption"
                                                    color="primary"
                                                    sx={{ display: 'block', mt: 0.5 }}
                                                  >
                                                    {itemHistory.length - 1} previous version
                                                    {itemHistory.length > 2 ? 's' : ''}
                                                  </Typography>
                                                )}
                                              </Grid>
                                              <Grid item xs={6} sm={2}>
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                  fontWeight={600}
                                                >
                                                  Unit Price
                                                </Typography>
                                                <Typography variant="body1" fontWeight={500}>
                                                  ${inventoryItem?.price.toFixed(2)}
                                                </Typography>
                                                {inventoryItem && (
                                                  <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    fontWeight={500}
                                                  >
                                                    {inventoryItem.measurement} {inventoryItem.unit}
                                                  </Typography>
                                                )}
                                              </Grid>
                                              <Grid item xs={6} sm={2}>
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                  fontWeight={600}
                                                >
                                                  Quantity
                                                </Typography>
                                                {editingQuantity === node.id ? (
                                                  <Box
                                                    sx={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 1,
                                                    }}
                                                  >
                                                    <TextField
                                                      type="number"
                                                      size="small"
                                                      value={tempQuantity}
                                                      onChange={(e) =>
                                                        setTempQuantity(
                                                          parseInt(e.target.value) || 0
                                                        )
                                                      }
                                                      inputProps={{ min: 0 }}
                                                      sx={{ width: '80px' }}
                                                    />
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                      <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() =>
                                                          handleSubmitQuantity(order, node)
                                                        }
                                                        disabled={
                                                          tempQuantity === null || tempQuantity < 0
                                                        }
                                                      >
                                                        <CheckIcon fontSize="small" />
                                                      </IconButton>
                                                      <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleCancelEdit}
                                                      >
                                                        <CloseIcon fontSize="small" />
                                                      </IconButton>
                                                    </Box>
                                                  </Box>
                                                ) : (
                                                  <Box
                                                    sx={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 1,
                                                    }}
                                                  >
                                                    <Typography variant="body1" fontWeight={500}>
                                                      {node.quantity}
                                                    </Typography>
                                                    {isOrderEditable(order.status) && (
                                                      <IconButton
                                                        size="small"
                                                        onClick={() => handleEditQuantity(node)}
                                                      >
                                                        <EditIcon fontSize="small" />
                                                      </IconButton>
                                                    )}
                                                  </Box>
                                                )}
                                              </Grid>
                                              <Grid item xs={12} sm={4}>
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    justifyContent: {
                                                      xs: 'flex-start',
                                                      sm: 'flex-end',
                                                    },
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    mt: { xs: 1, sm: 0 },
                                                  }}
                                                >
                                                  <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    fontWeight={600}
                                                  >
                                                    Total:
                                                  </Typography>
                                                  <Typography
                                                    variant="h6"
                                                    color="primary"
                                                    fontWeight={700}
                                                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                                  >
                                                    $
                                                    {(
                                                      node.quantity *
                                                      (node.product.inventoryItems?.edges[0]?.node
                                                        ?.price || 0)
                                                    ).toFixed(2)}
                                                  </Typography>
                                                  {isOrderEditable(order.status) && (
                                                    <IconButton
                                                      size="small"
                                                      color="error"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveItem(order, node);
                                                      }}
                                                    >
                                                      <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                  )}
                                                </Box>
                                              </Grid>
                                            </Grid>

                                            {/* Edit History Section */}
                                            {itemHistory.length > 1 && (
                                              <Box
                                                sx={{
                                                  mt: 2,
                                                  pt: 2,
                                                  borderTop: '1px solid',
                                                  borderColor: 'divider',
                                                }}
                                              >
                                                <Typography
                                                  variant="subtitle2"
                                                  color="text.secondary"
                                                  fontWeight={600}
                                                  gutterBottom
                                                  sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                  }}
                                                >
                                                  <HistoryIcon fontSize="small" />
                                                  Order Change History ({itemHistory.length -
                                                    1}{' '}
                                                  changes)
                                                </Typography>
                                                <Box sx={{ pl: 2 }}>
                                                  {itemHistory.slice(0, -1).map((item, index) => {
                                                    console.log('Rendering history item:', item);
                                                    return (
                                                      <Box
                                                        key={item.id}
                                                        sx={{
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: 2,
                                                          color: 'text.secondary',
                                                          bgcolor: 'grey.50',
                                                          p: 1.5,
                                                          borderRadius: 1,
                                                          mb: 1,
                                                        }}
                                                      >
                                                        <Typography
                                                          variant="body2"
                                                          sx={{
                                                            textDecoration: 'line-through',
                                                            color: 'text.secondary',
                                                            minWidth: '120px',
                                                            fontWeight: 500,
                                                          }}
                                                        >
                                                          Change {index + 1}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 3 }}>
                                                          <Typography
                                                            variant="body2"
                                                            sx={{
                                                              textDecoration: 'line-through',
                                                              color: 'text.secondary',
                                                            }}
                                                          >
                                                            Quantity: {item.quantity}
                                                          </Typography>
                                                          <Typography
                                                            variant="body2"
                                                            sx={{
                                                              textDecoration: 'line-through',
                                                              color: 'text.secondary',
                                                            }}
                                                          >
                                                            Amount: ${item.orderAmount.toFixed(2)}
                                                          </Typography>
                                                        </Box>
                                                      </Box>
                                                    );
                                                  })}
                                                </Box>
                                              </Box>
                                            )}
                                          </Card>
                                        </Grid>
                                      );
                                    })}
                                  </Grid>
                                ) : (
                                  <Box
                                    sx={{
                                      textAlign: 'center',
                                      py: 3,
                                      color: 'text.secondary',
                                    }}
                                  >
                                    <Typography fontWeight={500}>
                                      No items found for this order.
                                    </Typography>
                                  </Box>
                                )}
                              </Paper>
                            </Grid>
                            {/* Combined Order Details and Delivery Information Section */}
                            <Grid item xs={12}>
                              <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
                                <Grid container spacing={{ xs: 2, sm: 3 }}>
                                  {/* Order Details */}
                                  <Grid item xs={12} md={6}>
                                    <Typography
                                      variant="h6"
                                      gutterBottom
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        mb: 1,
                                        fontSize: { xs: '1rem', sm: '1.25rem' },
                                      }}
                                    >
                                      <Receipt /> Order Details
                                    </Typography>
                                    <Box sx={{ pl: 1 }}>
                                      {order.customOrder && (
                                        <Box sx={{ mb: 2 }}>
                                          <Typography
                                            variant="subtitle2"
                                            color="text.secondary"
                                            fontWeight={700}
                                          >
                                            Custom Order Instructions
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            fontWeight={500}
                                            sx={{
                                              whiteSpace: 'pre-line',
                                              bgcolor: 'grey.50',
                                              p: 1.5,
                                              borderRadius: 1,
                                              mt: 0.5,
                                            }}
                                          >
                                            {order.customOrder}
                                          </Typography>
                                        </Box>
                                      )}

                                      <Box
                                        sx={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          mb: 0.5,
                                        }}
                                      >
                                        <Typography
                                          variant="subtitle2"
                                          color="text.secondary"
                                          fontWeight={700}
                                        >
                                          Subtotal
                                        </Typography>
                                        <Typography fontWeight={500}>
                                          ${order.totalAmount.toFixed(2)}
                                        </Typography>
                                      </Box>

                                      {order.deliveryFee && (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mb: 0.5,
                                          }}
                                        >
                                          <Typography
                                            variant="subtitle2"
                                            color="text.secondary"
                                            fontWeight={700}
                                          >
                                            Delivery Fee
                                          </Typography>
                                          <Typography fontWeight={500}>
                                            ${order.deliveryFee.toFixed(2)}
                                          </Typography>
                                        </Box>
                                      )}

                                      {order.taxAmount && (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mb: 0.5,
                                          }}
                                        >
                                          <Typography
                                            variant="subtitle2"
                                            color="text.secondary"
                                            fontWeight={700}
                                          >
                                            Tax
                                          </Typography>
                                          <Typography fontWeight={500}>
                                            ${order.taxAmount.toFixed(2)}
                                          </Typography>
                                        </Box>
                                      )}

                                      {order.tipAmount && (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mb: 0.5,
                                          }}
                                        >
                                          <Typography
                                            variant="subtitle2"
                                            color="text.secondary"
                                            fontWeight={700}
                                          >
                                            Tip
                                          </Typography>
                                          <Typography fontWeight={500}>
                                            ${order.tipAmount.toFixed(2)}
                                          </Typography>
                                        </Box>
                                      )}

                                      <Divider sx={{ my: 1 }} />

                                      <Box
                                        sx={{ display: 'flex', justifyContent: 'space-between' }}
                                      >
                                        <Typography
                                          variant="subtitle2"
                                          color="text.secondary"
                                          fontWeight={700}
                                        >
                                          Total Amount
                                        </Typography>
                                        <Typography
                                          variant="subtitle1"
                                          color="primary"
                                          fontWeight={700}
                                        >
                                          ${order.orderTotalAmount.toFixed(2)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Grid>

                                  {/* Delivery Information */}
                                  <Grid item xs={12} md={6}>
                                    <Typography
                                      variant="h6"
                                      gutterBottom
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        mb: 1,
                                        fontSize: { xs: '1rem', sm: '1.25rem' },
                                      }}
                                    >
                                      <LocalShipping /> Delivery Information
                                    </Typography>
                                    <Box sx={{ pl: 1 }}>
                                      <Box sx={{ mb: 1 }}>
                                        <Typography
                                          variant="subtitle2"
                                          color="text.secondary"
                                          fontWeight={700}
                                        >
                                          {order.type === 'PICKUP'
                                            ? 'Pickup Location'
                                            : 'Delivery Address'}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                          {order.type === 'PICKUP'
                                            ? order.pickupAddress?.address ||
                                              'Pickup location not specified'
                                            : order.address?.address || 'No address provided'}
                                        </Typography>
                                      </Box>

                                      {order.deliveryInstructions && (
                                        <Box sx={{ mb: 1 }}>
                                          <Typography
                                            variant="subtitle2"
                                            color="text.secondary"
                                            fontWeight={700}
                                          >
                                            Delivery Instructions
                                          </Typography>
                                          <Typography variant="body2" fontWeight={500}>
                                            {order.deliveryInstructions}
                                          </Typography>
                                        </Box>
                                      )}

                                      {order.deliveryDate && (
                                        <Box sx={{ mb: 1 }}>
                                          <Typography
                                            variant="subtitle2"
                                            color="text.secondary"
                                            fontWeight={600}
                                          >
                                            Expected Delivery Date
                                          </Typography>
                                          <Typography variant="body2" fontWeight={500}>
                                            {new Date(order.deliveryDate).toLocaleDateString()}
                                          </Typography>
                                        </Box>
                                      )}

                                      {order.cancelMessage && (
                                        <Box sx={{ mb: 1 }}>
                                          <Typography
                                            variant="subtitle2"
                                            color="error"
                                            fontWeight={700}
                                          >
                                            Cancellation Reason
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            color="error"
                                            fontWeight={500}
                                          >
                                            {order.cancelMessage}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </Grid>
                                </Grid>
                              </Paper>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmation Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="cancelMessage"
            label="Reason for Cancellation"
            type="text"
            fullWidth
            variant="outlined"
            value={cancelMessage}
            onChange={(e) => setCancelMessage(e.target.value)}
            error={openModal && !cancelMessage.trim()}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            No, Keep Order
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={!cancelMessage.trim()}
          >
            Yes, Cancel Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add the confirmation dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog({ open: false, title: '', message: '', onConfirm: null })
            }
            color="primary"
          >
            Cancel
          </Button>
          <Button onClick={confirmDialog.onConfirm} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Orders;
