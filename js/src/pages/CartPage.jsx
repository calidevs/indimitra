import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Divider,
  Paper,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Collapse,
  Stack,
  TextField,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  RadioGroup,
  Radio,
  InputAdornment,
} from '@mui/material';
import {
  Remove,
  Add,
  LocationOn,
  ExpandMore,
  ExpandLess,
  Phone,
  ShoppingBag,
  LocalShipping,
  Payment,
  Store,
  Home,
  CheckCircle,
} from '@mui/icons-material';
import useStore, { useAuthStore, useAddressStore } from './../store/useStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import fetchGraphQL from '../config/graphql/graphqlService';
import { CREATE_ORDER_MUTATION, GET_USER_PROFILE } from '../queries/operations';
import { DELIVERY_FEE, TAX_RATE } from '../config/constants/constants';
import { useNavigate, Link } from 'react-router-dom';
import LoginModal from './Login/LoginModal';
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';
import { fetchAuthSession } from '@aws-amplify/auth';
import FilterIcon from '@mui/icons-material/FilterList';

// Replace LoadingSpinner with CircularProgress
const LoadingSpinner = ({ size = 24, sx }) => (
  <CircularProgress size={size} sx={{ color: 'inherit', ...sx }} />
);

// Add the UPDATE_SECONDARY_PHONE mutation
const UPDATE_SECONDARY_PHONE = `
  mutation UpdateSecondaryPhone($userId: Int!, $secondaryPhone: String) {
    updateSecondaryPhone(userId: $userId, secondaryPhone: $secondaryPhone) {
      active
    }
  }
`;

const SecondaryPhoneInput = ({ userProfile, onPhoneUpdate }) => {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const { mutate: updatePhone, isPending } = useMutation({
    mutationFn: (variables) => fetchGraphQL(UPDATE_SECONDARY_PHONE, variables),
    onSuccess: () => {
      onPhoneUpdate();
      setShowUpdateForm(false);
      setPhoneNumber('');
      setError('');
    },
    onError: (error) => {
      setError('Failed to update phone number. Please try again.');
    },
  });

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
    setError('');
  };

  const handleSubmit = () => {
    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    updatePhone({
      userId: userProfile.id,
      secondaryPhone: phoneNumber,
    });
  };

  if (!userProfile) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {!showUpdateForm ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Secondary Contact
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Update if you want to change)
            </Typography>
          </Box>

          {userProfile.secondaryPhone ? (
            <>
              <Typography variant="body1">+1 {userProfile.secondaryPhone}</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowUpdateForm(true)}
                startIcon={<Phone />}
                sx={{ alignSelf: 'flex-start' }}
              >
                Change Number
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                No secondary number added
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowUpdateForm(true)}
                startIcon={<Phone />}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add Number
              </Button>
            </>
          )}
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {userProfile.secondaryPhone ? 'Update Number' : 'Add Number'}
            </Typography>
          </Box>

          <TextField
            size="small"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="Enter 10-digit number"
            error={!!error}
            helperText={error}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>+1</Typography>,
            }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSubmit}
              disabled={isPending || phoneNumber.length !== 10}
              startIcon={isPending ? <LoadingSpinner size={20} /> : <Phone />}
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setShowUpdateForm(false);
                setPhoneNumber('');
                setError('');
              }}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

const CartPage = () => {
  const {
    cart,
    removeFromCart,
    addToCart,
    cartTotal,
    clearCart,
    selectedStore,
    getCartTotals,
    setTipAmount,
    customOrder,
    setCustomOrder,
    pickupAddress,
    setPickupAddress,
    deliveryType,
    setDeliveryType,
    tipAmount,
  } = useStore();
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  const { userProfile, fetchUserProfile, isProfileLoading, setModalOpen, setCurrentForm } =
    useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tipPercentage, setTipPercentage] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [selectedPickupId, setSelectedPickupId] = useState(null);

  // Track if user has manually selected an address
  const [userSelectedAddress, setUserSelectedAddress] = useState(false);

  // Fetch user profile when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      const session = await fetchAuthSession();
      const cognitoId = session?.tokens?.idToken?.payload?.sub;
      if (cognitoId) {
        await fetchUserProfile(cognitoId);
      }
    };
    fetchProfile();
  }, [fetchUserProfile]);

  // Use the address store instead of local state
  const {
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    fetchAddresses,
    isLoading: isLoadingAddresses,
    createAddress: createAddressMutation,
  } = useAddressStore();

  // New state for inline address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const boxCount = Object.values(cart).reduce((acc, item) => acc + (item.quantity || 0), 0);

  // State to store cart totals
  const [cartTotals, setCartTotals] = useState({
    subtotal: 0,
    deliveryFee: 0,
    taxAmount: 0,
    taxPercentage: 0,
    tipAmount: 0,
    total: 0,
  });

  // Fetch addresses when modal opens and user profile is available
  useEffect(() => {
    if (userProfile?.id) {
      fetchAddresses(userProfile.id);
    }
  }, [userProfile?.id, fetchAddresses]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Addresses from store:', addresses);
    console.log('Selected address ID:', selectedAddressId);
  }, [addresses, selectedAddressId]);

  // Set initial pickup address if available in store
  useEffect(() => {
    if (pickupAddress) {
      setSelectedPickupId(String(pickupAddress.id));
      setDeliveryType('pickup');
      setSelectedAddressId(null);
    }
  }, [pickupAddress, setDeliveryType]);

  // Recalculate totals when delivery type, cart, or tip amount changes
  useEffect(() => {
    console.log('Recalculating totals for delivery type:', deliveryType);
    const totals = getCartTotals();
    setCartTotals(totals);
  }, [deliveryType, cart, getCartTotals, tipAmount]);

  // Destructure totals from state
  const {
    subtotal,
    deliveryFee,
    taxAmount,
    taxPercentage,
    tipAmount: localTipAmount,
    total,
  } = cartTotals;

  // Set default selection for delivery/pickup when addresses are loaded
  useEffect(() => {
    // If user has manually selected an address, do not auto-select
    if (userSelectedAddress) return;

    // If pickup addresses are available and nothing is selected, select the first pickup address
    if (
      selectedStore?.pickupAddresses?.edges?.length > 0 &&
      !selectedPickupId &&
      !selectedAddressId
    ) {
      const firstPickupAddress = selectedStore.pickupAddresses.edges[0].node;
      setSelectedPickupId(String(firstPickupAddress.id));
      setActiveOption('pickup');
      setSelectedAddressId(null);
      return;
    }

    // If delivery addresses are available and nothing is selected, select the primary address
    if (addresses && addresses.length > 0 && !selectedPickupId && !selectedAddressId) {
      const primary = addresses.find((addr) => addr.isPrimary) || addresses[0];
      setSelectedAddressId(primary.id);
      setActiveOption('delivery');
      setSelectedPickupId(null);
      return;
    }

    // If neither is available, default to pickup but don't select anything
    if (
      (!selectedStore?.pickupAddresses?.edges?.length ||
        selectedStore?.pickupAddresses?.edges?.length === 0) &&
      (!addresses || addresses.length === 0) &&
      !selectedPickupId &&
      !selectedAddressId
    ) {
      setActiveOption('pickup');
    }
    // eslint-disable-next-line
  }, [selectedStore?.pickupAddresses?.edges, addresses, userSelectedAddress]);

  // When user selects a delivery address, mark as manual selection
  const handleAddressDropdownChange = (e) => {
    setSelectedAddressId(e.target.value);
    setActiveOption('delivery');
    setSelectedPickupId(null);
    setUserSelectedAddress(true);
  };

  const { mutate, isPending } = useMutation({
    mutationKey: ['createOrder'],
    mutationFn: async (variables) => {
      // Get the selected store from your store
      const selectedStore = useStore.getState().selectedStore;

      return fetchGraphQL(CREATE_ORDER_MUTATION, {
        ...variables,
        storeId: selectedStore.id, // Add the store ID
      });
    },
    onSuccess: (response) => {
      if (response.errors) {
        console.error('Order Placement Error:', response.errors);
        setError('Failed to place order. Please try again.');
        return;
      }
      console.log('Order placed successfully:', response);
      clearCart();
      setCustomOrder(''); // Clear the custom order
      setIsOrderPlaced(true);
      setTimeout(() => {
        setIsOrderPlaced(false);
        navigate('/');
      }, 2000);
      queryClient.invalidateQueries(['userAddresses', userProfile.id]);
    },
    onError: (error) => {
      console.error('GraphQL Order Placement Failed:', error);
      setError('Failed to place order. Please try again.');
    },
  });

  const handleOrderPlacement = async () => {
    setError(''); // Clear any previous errors

    // Validate that either pickup or delivery is selected
    if (!selectedPickupId && !selectedAddressId) {
      setError('Please select either a pickup location or delivery address');
      return;
    }

    const orderItems = Object.values(cart).map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));

    // Get the selected pickup address if pickup is selected
    let pickupAddress = null;
    if (selectedPickupId) {
      const addresses = selectedStore.pickupAddresses.edges.map((e) => e.node);
      pickupAddress = addresses.find((addr) => String(addr.id) === String(selectedPickupId));
    }

    // Get the selected delivery address if delivery is selected
    let deliveryAddress = null;
    if (selectedAddressId) {
      deliveryAddress = addresses.find((addr) => addr.id === selectedAddressId);
    }

    const variables = {
      userId: userProfile.id,
      addressId: selectedAddressId,
      pickupId: selectedPickupId ? parseInt(selectedPickupId, 10) : null,
      storeId: selectedStore.id,
      productItems: orderItems,
      totalAmount: subtotal,
      orderTotalAmount: total,
      pickupOrDelivery: deliveryType, // Use deliveryType from store
      deliveryFee: deliveryType === 'pickup' ? 0 : deliveryFee, // Use deliveryType to determine fee
      tipAmount: tipAmount, // Use tipAmount from store
      taxAmount: taxAmount,
      deliveryInstructions: deliveryType === 'pickup' ? null : deliveryInstructions, // Use deliveryType
      customOrder: customOrder,
    };

    mutate(variables);
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      setError('Please enter a valid address');
      return;
    }

    setIsAddingAddress(true);
    try {
      await createAddressMutation(newAddress, userProfile.id, isPrimary);
      setShowAddressForm(false);
      setNewAddress('');
      setIsPrimary(false);
      queryClient.invalidateQueries(['userAddresses', userProfile.id]);
    } catch (error) {
      console.error('Error adding address:', error);
      setError('Failed to add address. Please try again.');
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handlePhoneUpdate = () => {
    // After phone update, refetch the user profile
    const fetchProfile = async () => {
      const session = await fetchAuthSession();
      const cognitoId = session?.tokens?.idToken?.payload?.sub;
      if (cognitoId) {
        await fetchUserProfile(cognitoId);
      }
    };
    fetchProfile();
  };

  // Handle tip selection
  const handleTipChange = (event, newTipPercentage) => {
    if (newTipPercentage !== null) {
      setTipPercentage(newTipPercentage);
      setCustomTip('');
      const calculatedTipAmount = (subtotal * newTipPercentage) / 100;
      setTipAmount(calculatedTipAmount);
    }
  };

  // Handle custom tip input
  const handleCustomTipChange = (event) => {
    const value = event.target.value;
    setCustomTip(value);
    setTipPercentage(0);
    const calculatedTipAmount = parseFloat(value) || 0;
    setTipAmount(calculatedTipAmount);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: 'primary.main',
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ShoppingBag /> Your Shopping Cart
      </Typography>

      {isOrderPlaced ? (
        <Paper
          elevation={4}
          sx={{
            mb: 3,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #e0ffe8 0%, #f8fff8 100%)',
            boxShadow: 6,
            border: '2px solid #4caf50',
          }}
        >
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
            Order placed successfully!
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2, textAlign: 'center' }}>
            Thank you for your purchase. Your order is being processed and you'll receive an update
            soon!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Cart Items Section */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {Object.values(cart).length > 0 || customOrder ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    Cart Items
                  </Typography>
                  {Object.values(cart).map((item) => (
                    <Card key={item.id} sx={{ mb: 2, position: 'relative' }}>
                      <CardContent>
                        <Grid container alignItems="center" spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: 60,
                                  height: 60,
                                  objectFit: 'cover',
                                  borderRadius: 8,
                                }}
                              />
                              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                {item.name}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography color="text.secondary">
                              ${item.price.toFixed(2)} each
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => removeFromCart(item.id)}
                                sx={{ border: '1px solid', borderColor: 'divider' }}
                              >
                                <Remove fontSize="small" />
                              </IconButton>
                              <Typography sx={{ minWidth: 40, textAlign: 'center' }}>
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => addToCart(item)}
                                sx={{ border: '1px solid', borderColor: 'divider' }}
                              >
                                <Add fontSize="small" />
                              </IconButton>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, textAlign: 'right' }}
                            >
                              ${(item.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Custom Order Items */}
                  {customOrder && (
                    <Card sx={{ mb: 2, position: 'relative', bgcolor: 'primary.lighter' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <ShoppingBag color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            Custom Shopping List
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              whiteSpace: 'pre-line',
                              fontFamily: 'monospace',
                              lineHeight: 1.6,
                            }}
                          >
                            {customOrder}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => setCustomOrder('')}
                            startIcon={<Remove />}
                          >
                            Remove List
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ShoppingBag sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Your cart is empty
                  </Typography>
                  <Button variant="contained" component={Link} to="/" startIcon={<ShoppingBag />}>
                    Continue Shopping
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Order Summary Section */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 24 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                Order Summary
              </Typography>

              {/* Secondary Phone Section */}
              {userProfile && (
                <Box sx={{ mb: 3 }}>
                  <SecondaryPhoneInput
                    userProfile={userProfile}
                    onPhoneUpdate={handlePhoneUpdate}
                  />
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Subtotal</Typography>
                      <Typography>${subtotal.toFixed(2)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Delivery Fee</Typography>
                      <Typography>${deliveryFee.toFixed(2)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        bgcolor: 'grey.50',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tax Rate
                        </Typography>
                        <Typography>{taxPercentage.toFixed(1)}%</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          Tax Amount
                        </Typography>
                        <Typography>${taxAmount.toFixed(2)}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Add Tip
                      </Typography>
                      <ToggleButtonGroup
                        value={tipPercentage}
                        exclusive
                        onChange={handleTipChange}
                        aria-label="tip percentage"
                        size="small"
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        <ToggleButton value={0} aria-label="no tip">
                          No Tip
                        </ToggleButton>
                        <ToggleButton value={10} aria-label="10%">
                          10%
                        </ToggleButton>
                        <ToggleButton value={15} aria-label="15%">
                          15%
                        </ToggleButton>
                        <ToggleButton value={20} aria-label="20%">
                          20%
                        </ToggleButton>
                      </ToggleButtonGroup>
                      <TextField
                        fullWidth
                        size="small"
                        label="Custom Tip Amount"
                        type="number"
                        value={customTip}
                        onChange={handleCustomTipChange}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                        }}
                        placeholder="Enter custom amount"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        bgcolor: 'grey.50',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      <Typography>Tip Amount</Typography>
                      <Typography>${localTipAmount.toFixed(2)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Total</Typography>
                      <Typography variant="h6">${total.toFixed(2)}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Custom Order Details */}
              {customOrder && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <ShoppingBag /> Custom Order Details
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-line',
                        color: 'text.secondary',
                        fontFamily: 'monospace',
                      }}
                    >
                      {customOrder}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Delivery/Pickup Address Section */}
              {userProfile && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <LocalShipping /> Delivery/Pickup Options
                  </Typography>

                  {isProfileLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <LoadingSpinner size={24} />
                    </Box>
                  ) : (
                    <Stack spacing={3}>
                      {/* Pickup Address Section */}
                      {selectedStore?.pickupAddresses?.edges?.length > 0 && (
                        <Paper
                          elevation={deliveryType === 'pickup' ? 4 : 1}
                          sx={{
                            p: 2,
                            bgcolor: deliveryType === 'pickup' ? 'primary.lighter' : 'grey.50',
                            opacity: deliveryType === 'delivery' && selectedAddressId ? 0.5 : 1,
                            border:
                              deliveryType === 'pickup' ? '2px solid #1976d2' : '1px solid #eee',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              mb: 1,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Store fontSize="small" color="primary" /> Pickup Address
                          </Typography>
                          <RadioGroup
                            value={selectedPickupId || ''}
                            onChange={(e) => {
                              const pickupId = e.target.value;
                              setSelectedPickupId(pickupId);
                              setDeliveryType('pickup');
                              setSelectedAddressId(null);

                              // Find and set the selected pickup address in the store
                              const addresses = selectedStore.pickupAddresses.edges.map(
                                (e) => e.node
                              );
                              const selectedAddress = addresses.find(
                                (addr) => String(addr.id) === String(pickupId)
                              );
                              if (selectedAddress) {
                                setPickupAddress(selectedAddress);
                              }
                            }}
                          >
                            {selectedStore.pickupAddresses.edges.map(({ node: addr }) => (
                              <FormControlLabel
                                key={addr.id}
                                value={String(addr.id)}
                                control={<Radio color="primary" />}
                                label={addr.address}
                              />
                            ))}
                          </RadioGroup>
                        </Paper>
                      )}

                      {/* Home Delivery Section */}
                      <Paper
                        elevation={deliveryType === 'delivery' ? 4 : 1}
                        sx={{
                          p: 2,
                          bgcolor: deliveryType === 'delivery' ? 'secondary.lighter' : 'grey.50',
                          opacity: deliveryType === 'pickup' && selectedPickupId ? 0.5 : 1,
                          border:
                            deliveryType === 'delivery' ? '2px solid #9c27b0' : '1px solid #eee',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            mb: 1,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Home fontSize="small" color="secondary" /> Home Delivery Address
                        </Typography>
                        <Box>
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Select Address</InputLabel>
                            {isLoadingAddresses ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <LoadingSpinner size={24} />
                              </Box>
                            ) : (
                              <Select
                                value={selectedAddressId || ''}
                                onChange={handleAddressDropdownChange}
                                label="Select Address"
                                inputProps={{}}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <FilterIcon />
                                    </InputAdornment>
                                  ),
                                }}
                              >
                                {addresses && addresses.length > 0 ? (
                                  addresses.map((addr) => (
                                    <MenuItem key={addr.id} value={addr.id}>
                                      {addr.address} {addr.isPrimary ? '(Primary)' : ''}
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem disabled>No addresses available</MenuItem>
                                )}
                              </Select>
                            )}
                          </FormControl>

                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={showAddressForm ? <ExpandLess /> : <ExpandMore />}
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            sx={{ mb: 2 }}
                          >
                            {showAddressForm ? 'Cancel' : 'Add New Address'}
                          </Button>

                          <Collapse in={showAddressForm}>
                            <Box
                              sx={{
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                              }}
                            >
                              <Stack spacing={2}>
                                <AddressAutocomplete
                                  value={newAddress}
                                  onChange={setNewAddress}
                                  onValidAddress={setIsValidAddress}
                                />
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isPrimary}
                                      onChange={(e) => setIsPrimary(e.target.checked)}
                                    />
                                  }
                                  label="Set as Primary Address"
                                />
                                <Button
                                  variant="contained"
                                  onClick={handleAddAddress}
                                  disabled={
                                    !newAddress.trim() || isAddingAddress || !isValidAddress
                                  }
                                  startIcon={
                                    isAddingAddress ? <LoadingSpinner size={20} /> : <LocationOn />
                                  }
                                >
                                  {isAddingAddress ? 'Adding...' : 'Add Address'}
                                </Button>
                              </Stack>
                            </Box>
                          </Collapse>
                        </Box>
                      </Paper>
                    </Stack>
                  )}
                </Box>
              )}

              {/* Delivery Instructions */}
              {userProfile && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Delivery Instructions
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="Add any special instructions for delivery..."
                  />
                </Box>
              )}

              {/* Place Order Button */}
              {userProfile ? (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleOrderPlacement}
                  disabled={
                    isPending ||
                    isProfileLoading ||
                    (!selectedAddressId && !selectedPickupId) ||
                    (Object.values(cart).length === 0 && !customOrder?.trim())
                  }
                  startIcon={isPending ? <LoadingSpinner size={20} /> : <Payment />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  {isPending ? 'Processing...' : 'Place Order'}
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setModalOpen(true);
                    setCurrentForm('login');
                  }}
                  startIcon={<ShoppingBag />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  Login to Continue
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CartPage;
