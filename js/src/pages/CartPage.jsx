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
    deliveryInstructions,
    setDeliveryInstructions,
  } = useStore();
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  const { userProfile, fetchUserProfile, isProfileLoading, setModalOpen, setCurrentForm } =
    useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tipPercentage, setTipPercentage] = useState(0);
  const [customTip, setCustomTip] = useState('');

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

  // Get all totals from the store
  const { subtotal, deliveryFee, taxAmount, taxPercentage, tipAmount, total } = getCartTotals();

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

    if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    const orderItems = Object.values(cart).map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));

    // Get all the totals from the store
    const { subtotal, deliveryFee, taxAmount, tipAmount, total } = getCartTotals();

    mutate({
      userId: userProfile.id,
      addressId: selectedAddressId,
      storeId: selectedStore.id,
      productItems: orderItems,
      totalAmount: subtotal,
      orderTotalAmount: total,
      deliveryFee: deliveryFee,
      tipAmount: tipAmount,
      taxAmount: taxAmount,
      deliveryInstructions: deliveryInstructions,
    });
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
      const tipAmount = (subtotal * newTipPercentage) / 100;
      setTipAmount(tipAmount);
    }
  };

  // Handle custom tip input
  const handleCustomTipChange = (event) => {
    const value = event.target.value;
    setCustomTip(value);
    setTipPercentage(0);
    const tipAmount = parseFloat(value) || 0;
    setTipAmount(tipAmount);
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
        <Alert severity="success" sx={{ mb: 3 }}>
          Order placed successfully!
        </Alert>
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

              {Object.values(cart).length > 0 ? (
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
                      <Typography>${tipAmount.toFixed(2)}</Typography>
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

              {/* Delivery Address Section */}
              {userProfile && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <LocalShipping /> Delivery Address
                  </Typography>

                  {isProfileLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <LoadingSpinner size={24} />
                    </Box>
                  ) : (
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
                            onChange={(e) => setSelectedAddressId(e.target.value)}
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
                              disabled={!newAddress.trim() || isAddingAddress || !isValidAddress}
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
                  )}
                </Box>
              )}

              {/* Delivery Instructions */}
              {userProfile && (
                <>
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

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Manually Added Items
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="Items added from the search field..."
                    />
                  </Box>
                </>
              )}

              {/* Place Order Button */}
              {userProfile ? (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleOrderPlacement}
                  disabled={
                    Object.values(cart).length === 0 ||
                    isPending ||
                    !selectedAddressId ||
                    isProfileLoading
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
