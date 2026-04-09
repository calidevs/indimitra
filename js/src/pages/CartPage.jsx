import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
} from '@mui/material';
import { ErrorHandler, PaymentModal, PaymentMethodSelector } from '@/components';
import OrderSuccessModal from '@/components/OrderSuccessModal/OrderSuccessModal';
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
  DeleteOutline,
  InfoOutlined,
} from '@mui/icons-material';
import useStore, { useAuthStore, useAddressStore, cartKeyFor } from './../store/useStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import fetchGraphQL from '../config/graphql/graphqlService';
import { CREATE_ORDER_MUTATION, GET_USER_PROFILE, STORE_PAYMENT_CONFIG, CREATE_ORDER_WITH_COD_MUTATION, DELETE_SAVED_CART } from '../queries/operations';
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
    deleteCartLine,
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
    setListInputAnswers,
    setCartItemInstructions,
    setCartItemAllowSubstitute,
  } = useStore();
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [orderSuccessModalOpen, setOrderSuccessModalOpen] = useState(false);
  const [orderCode, setOrderCode] = useState(null);
  const [error, setError] = useState('');
  const { user, userProfile, fetchUserProfile, isProfileLoading, setModalOpen, setCurrentForm, setSkipNavigateOnLogin } =
    useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tipPercentage, setTipPercentage] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [selectedPickupId, setSelectedPickupId] = useState(
    pickupAddress ? String(pickupAddress.id) : null
  );
  const [isDuplicateAddress, setIsDuplicateAddress] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Track if user has already made a selection (from modal or manually)
  const [userSelectedAddress, setUserSelectedAddress] = useState(
    !!(pickupAddress || (deliveryType === 'delivery'))
  );

  // Comprehensive cart clearing function that handles:
  // 1. Zustand state (cart, customOrder, listInputAnswers) - Zustand persist will auto-save empty state
  // 2. Per-store localStorage snapshot (for current store only)
  // 3. Database cart (immediate deletion for logged-in users)
  // Note: We DON'T remove 'indimitra-cart-storage' to preserve persistence across reloads/logout
  const clearCartCompletely = useCallback(async () => {
    // 1. Clear Zustand state
    // Zustand persist will automatically save the empty state to localStorage
    // This preserves persistence across page reloads and logout/login
    clearCart();
    setCustomOrder('');
    setListInputAnswers({});

    // 2. Clear per-store localStorage snapshot for current store
    // This ensures the store-specific snapshot is cleared after order
    if (selectedStore?.id) {
      try {
        localStorage.removeItem(`indimitra-cart-store-${selectedStore.id}`);
      } catch (e) {
        console.error('Failed to clear per-store localStorage:', e);
      }
    }

    // 3. Delete database cart immediately (if user is logged in)
    // Wait for this to complete to prevent race condition with useCartSync
    if (userProfile?.id && selectedStore?.id) {
      try {
        await fetchGraphQL(DELETE_SAVED_CART, {
          userId: userProfile.id,
          storeId: selectedStore.id,
        });
        // Small delay to ensure database deletion propagates
        // This prevents useCartSync from restoring stale data
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        // Log but don't fail - the useCartSync hook will eventually clean it up
        console.error('Failed to delete database cart:', err);
      }
    }
  }, [clearCart, setCustomOrder, setListInputAnswers, selectedStore, userProfile]);

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
  }, [fetchUserProfile, user]);

  // Use the address store instead of local state
  const {
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    fetchAddresses,
    isLoading: isLoadingAddresses,
    createAddress: createAddressMutation,
  } = useAddressStore();

  // Fetch store payment config
  const { data: paymentConfigData, isLoading: paymentConfigLoading } = useQuery({
    queryKey: ['storePaymentConfig', selectedStore?.id],
    queryFn: async () => fetchGraphQL(STORE_PAYMENT_CONFIG, { storeId: selectedStore.id }),
    enabled: !!selectedStore?.id,
  });
  const paymentConfig = paymentConfigData?.storePaymentConfig || null;

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

  // Sync pickup address from Zustand when it changes (e.g., from StoreSelector modal)
  useEffect(() => {
    if (pickupAddress) {
      setSelectedPickupId(String(pickupAddress.id));
      setDeliveryType('pickup');
      setSelectedAddressId(null);
      setUserSelectedAddress(true);
    }
  }, [pickupAddress, setDeliveryType, setSelectedAddressId]);

  // Recalculate totals when delivery type, cart, or tip amount changes
  useEffect(() => {
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
      setDeliveryType('pickup');
      setSelectedAddressId(null);
      return;
    }

    // If delivery addresses are available and nothing is selected, select the primary address
    if (addresses && addresses.length > 0 && !selectedPickupId && !selectedAddressId) {
      const primary = addresses.find((addr) => addr.isPrimary) || addresses[0];
      setSelectedAddressId(primary.id);
      setDeliveryType('delivery');
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
      setDeliveryType('delivery');
    }
    // eslint-disable-next-line
  }, [selectedStore?.pickupAddresses?.edges, addresses, userSelectedAddress]);

  // When user selects a delivery address, mark as manual selection
  const handleAddressDropdownChange = (e) => {
    setSelectedAddressId(e.target.value);
    setDeliveryType('delivery');
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
    onSuccess: async (response) => {
      // Only clear cart if order was successfully created
      // graphql-request returns data directly: { createOrder: { id, ... } }
      const order = response?.createOrder;
      if (order && order.id) {
        try {
          // Clear cart from Zustand, localStorage, and database
          await clearCartCompletely();
          setOrderCode(order.displayCode || `#${order.id}`);
          setOrderSuccessModalOpen(true);
          setError(''); // Clear any previous errors
          queryClient.invalidateQueries(['userAddresses', userProfile.id]);
        } catch (clearError) {
          // If cart clearing fails, still show success but log error
          console.error('Failed to clear cart after order success:', clearError);
          setOrderCode(order.displayCode || `#${order.id}`);
          setOrderSuccessModalOpen(true);
        }
      } else {
        // If order creation failed, don't clear cart
        setError('Order creation failed. Your cart has been preserved. Please try again.');
      }
    },
    onError: (error) => {
      // Don't clear cart on error - preserve items for retry
      // Extract error message from GraphQL error response
      const errorMessage = error?.message || 
                          error?.response?.errors?.[0]?.message ||
                          error?.graphQLErrors?.[0]?.message ||
                          'Failed to place order. Please try again.';
      setError(errorMessage);
    },
  });

  // COD order mutation
  const { mutate: createCodOrder, isPending: isCodPending } = useMutation({
    mutationFn: async (variables) => fetchGraphQL(CREATE_ORDER_WITH_COD_MUTATION, variables),
    onSuccess: async (data) => {
      // Only clear cart if order was successfully created
      // graphql-request returns data directly: { createOrderWithCod: { id, ... } }
      const order = data?.createOrderWithCod;
      if (order && order.id) {
        try {
          // Clear cart from Zustand, localStorage, and database
          await clearCartCompletely();
          setOrderCode(order.displayCode || `#${order.id}`);
          setOrderSuccessModalOpen(true);
          setError(''); // Clear any previous errors
        } catch (clearError) {
          // If cart clearing fails, still show success but log error
          console.error('Failed to clear cart after order success:', clearError);
          setOrderCode(order.displayCode || `#${order.id}`);
          setOrderSuccessModalOpen(true);
        }
      } else {
        // If order creation failed, don't clear cart
        setError('Order creation failed. Your cart has been preserved. Please try again.');
      }
    },
    onError: (err) => {
      // Don't clear cart on error - preserve items for retry
      // Extract error message from GraphQL error response
      const errorMessage = err?.message || 
                          err?.response?.errors?.[0]?.message ||
                          err?.graphQLErrors?.[0]?.message ||
                          'Failed to place order. Please try again.';
      setError(errorMessage);
    },
  });

  const checkDuplicateAddress = (addressValue) => {
    if (!addressValue.trim() || !addresses) {
      setIsDuplicateAddress(false);
      return;
    }

    const normalizedNew = addressValue.toLowerCase().trim();
    const duplicate = addresses.some((addr) => addr.address.toLowerCase().trim() === normalizedNew);

    setIsDuplicateAddress(duplicate);
  };

  const handleOrderPlacement = async () => {
    setError(''); // Clear any previous errors

    // Validate user is logged in
    if (!userProfile || !userProfile.id) {
      setError('Please log in to place an order');
      setSkipNavigateOnLogin(true);
      setModalOpen(true);
      setCurrentForm('login');
      return;
    }

    // Validate store is selected
    if (!selectedStore || !selectedStore.id) {
      setError('Please select a store');
      return;
    }

    // Validate cart is not empty
    if (Object.values(cart).length === 0 && !customOrder) {
      setError('Your cart is empty. Please add items before placing an order');
      return;
    }

    // Validate that either pickup or delivery is selected
    if (!selectedPickupId && !selectedAddressId) {
      setError('Please select either a pickup location or delivery address');
      return;
    }

    const orderItems = Object.values(cart).map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      meatCutId: item.selectedCut?.id ?? null,
      instructions: item.instructions?.trim() ? item.instructions.trim() : null,
      allowSubstitute: !!item.allowSubstitute,
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

  const handleCodOrder = () => {
    setError('');

    // Validate user is logged in
    if (!userProfile || !userProfile.id) {
      setError('Please log in to place an order');
      setSkipNavigateOnLogin(true);
      setModalOpen(true);
      setCurrentForm('login');
      return;
    }

    // Validate store is selected
    if (!selectedStore || !selectedStore.id) {
      setError('Please select a store');
      return;
    }

    // Validate cart is not empty
    if (Object.values(cart).length === 0 && !customOrder) {
      setError('Your cart is empty. Please add items before placing an order');
      return;
    }

    // Validate that either pickup or delivery is selected
    if (!selectedPickupId && !selectedAddressId) {
      setError('Please select either a pickup location or delivery address');
      return;
    }
    const orderItems = Object.values(cart).map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      meatCutId: item.selectedCut?.id ?? null,
      instructions: item.instructions?.trim() ? item.instructions.trim() : null,
      allowSubstitute: !!item.allowSubstitute,
    }));
    createCodOrder({
      userId: userProfile.id,
      storeId: selectedStore.id,
      productItems: orderItems,
      pickupOrDelivery: deliveryType,
      addressId: selectedAddressId,
      pickupId: selectedPickupId ? parseInt(selectedPickupId, 10) : null,
      tipAmount: tipAmount || 0,
      deliveryInstructions: deliveryType === 'pickup' ? null : deliveryInstructions,
      customOrder: customOrder || null,
    });
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      setError('Please enter a valid address');
      return;
    }

    // ✅ Check for duplicate addresses
    const trimmedAddress = newAddress.trim().toLowerCase();
    const isDuplicate = addresses?.some(
      (addr) => addr.address.toLowerCase().trim() === trimmedAddress
    );

    if (isDuplicate) {
      setError('This address already exists in your address book');
      return;
    }

    setIsAddingAddress(true);
    setError(''); // Clear any previous errors

    try {
      await createAddressMutation(newAddress, userProfile.id, isPrimary);
      setShowAddressForm(false);
      setNewAddress('');
      setIsPrimary(false);
      queryClient.invalidateQueries(['userAddresses', userProfile.id]);
    } catch (error) {
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

  // Payment modal handlers
  const openPaymentModal = () => {
    setPaymentModalOpen(true);
  };

  const closePaymentModal = useCallback(() => {
    setPaymentModalOpen(false);
  }, []);

  const handlePaymentSuccess = useCallback(async (orderResult) => {
    // Validate order result
    if (!orderResult) {
      setError('Order creation failed. Your cart has been preserved. Please try again.');
      return;
    }

    // Only clear cart if order was successfully created with valid ID
    if (orderResult.id) {
      try {
        // Clear cart from Zustand, localStorage, and database
        await clearCartCompletely();
        // Show success modal
        setOrderCode(orderResult.displayCode || `#${orderResult.id}`);
        setOrderSuccessModalOpen(true);
        // Clear any previous errors
        setError('');
      } catch (clearError) {
        // If cart clearing fails, still show success but log error
        console.error('Failed to clear cart after order success:', clearError);
        setOrderCode(orderResult.displayCode || `#${orderResult.id}`);
        setOrderSuccessModalOpen(true);
      }
    } else {
      // If order creation failed, don't clear cart
      // Check if it's an orphaned payment scenario
      const errorMsg = orderResult.error || 
        'Order creation failed. Your cart has been preserved. Please try again.';
      setError(errorMsg);
    }
  }, [clearCartCompletely]);

  // Prepare order items array for mutation
  const orderItems = Object.values(cart).map((item) => ({
    productId: item.id,
    quantity: item.quantity,
    meatCutId: item.selectedCut?.id ?? null,
    selectedCut: item.selectedCut ?? null,
  }));

  return (
    <Box sx={{ padding: 3 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'flex-end' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '1.6rem', sm: '1.9rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Your Cart
          </Typography>
          {(Object.values(cart).length > 0 || customOrder) && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 0.5, fontSize: '0.9rem' }}
            >
              {Object.values(cart).reduce((n, i) => n + (i.quantity || 0), 0)}{' '}
              {Object.values(cart).reduce((n, i) => n + (i.quantity || 0), 0) === 1
                ? 'item'
                : 'items'}
              {selectedStore?.name ? ` · ${selectedStore.name}` : ''}
            </Typography>
          )}
        </Box>
        <Button
          component={Link}
          to="/"
          variant="text"
          size="small"
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            '&:hover': { color: 'primary.main', backgroundColor: 'transparent' },
          }}
        >
          ← Continue shopping
        </Button>
      </Box>

      <Grid container spacing={3}>
          {/* Cart Items Section */}
          <Grid item xs={12} md={8}>
            {error && (
              <Box sx={{ mb: 2 }}>
                <ErrorHandler error={error} title="Order Error" severity="error" />
              </Box>
            )}

            {Object.values(cart).length > 0 || customOrder ? (
              <Paper
                variant="outlined"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  overflow: 'hidden',
                  borderColor: 'divider',
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                    Cart Items
                  </Typography>
                  {Object.values(cart).length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {Object.values(cart).reduce((n, i) => n + (i.quantity || 0), 0)}{' '}
                      {Object.values(cart).reduce((n, i) => n + (i.quantity || 0), 0) === 1
                        ? 'item'
                        : 'items'}
                    </Typography>
                  )}
                </Box>

                {/* Rows */}
                {Object.values(cart).map((item, idx, arr) => {
                  const itemKey = cartKeyFor(item);
                  return (
                  <Box
                    key={itemKey}
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 2.25 },
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      transition: 'background-color 120ms ease',
                      '&:hover': { backgroundColor: 'action.hover' },
                      '&:hover .cart-row-delete': { opacity: 1 },
                    }}
                  >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1.5, sm: 2.5 },
                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      rowGap: { xs: 1.25, sm: 0 },
                    }}
                  >
                    {/* Thumbnail */}
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.name}
                      sx={{
                        width: { xs: 56, sm: 64 },
                        height: { xs: 56, sm: 64 },
                        objectFit: 'cover',
                        borderRadius: 1.25,
                        border: '1px solid',
                        borderColor: 'divider',
                        flexShrink: 0,
                        backgroundColor: 'background.default',
                      }}
                    />

                    {/* Name + variant + unit price */}
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          lineHeight: 1.3,
                          color: 'text.primary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: { xs: 'normal', sm: 'nowrap' },
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        {item.selectedCut && (
                          <Chip
                            label={item.selectedCut.label}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              borderColor: 'grey.300',
                              color: 'text.secondary',
                              backgroundColor: 'background.default',
                              '& .MuiChip-label': { px: 0.9 },
                            }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary', fontSize: '0.82rem' }}
                        >
                          ${item.price.toFixed(2)} each
                        </Typography>
                      </Box>
                    </Box>

                    {/* Controls: qty pill + total + delete. On mobile this
                        block takes full width and drops to its own line below
                        the thumbnail+name; on larger screens it sits inline. */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 1.5, sm: 2.5 },
                        flex: { xs: '1 1 100%', sm: '0 0 auto' },
                        justifyContent: { xs: 'space-between', sm: 'flex-end' },
                        order: { xs: 3, sm: 'initial' },
                      }}
                    >
                      {/* Quantity pill */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 9999,
                          px: 0.25,
                          height: 36,
                          flexShrink: 0,
                          backgroundColor: 'background.paper',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(item)}
                          sx={{
                            width: 28,
                            height: 28,
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main', backgroundColor: 'transparent' },
                          }}
                        >
                          <Remove sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Typography
                          sx={{
                            minWidth: 24,
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: 'text.primary',
                            userSelect: 'none',
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => addToCart(item)}
                          sx={{
                            width: 28,
                            height: 28,
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main', backgroundColor: 'transparent' },
                          }}
                        >
                          <Add sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>

                      {/* Line total */}
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          minWidth: { xs: 'auto', sm: 80 },
                          textAlign: 'right',
                          color: 'text.primary',
                          flexShrink: 0,
                        }}
                      >
                        ${(item.price * item.quantity).toFixed(2)}
                      </Typography>

                      {/* Delete (always visible on mobile, hover-revealed on desktop) */}
                      <Tooltip title="Remove item">
                        <IconButton
                          className="cart-row-delete"
                          size="small"
                          onClick={() => deleteCartLine(item)}
                          sx={{
                            opacity: { xs: 1, sm: 0 },
                            transition: 'opacity 120ms ease, color 120ms ease',
                            color: 'text.disabled',
                            '&:hover': { color: 'error.main', backgroundColor: 'transparent' },
                          }}
                        >
                          <DeleteOutline sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Per-item instructions + substitution preference */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'flex-start' },
                      gap: { xs: 1, sm: 2 },
                      pl: { xs: 0, sm: 9 }, // align under the name column, past the thumbnail
                    }}
                  >
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      maxRows={3}
                      placeholder="Instructions for this item (optional)"
                      value={item.instructions || ''}
                      onChange={(e) => setCartItemInstructions(itemKey, e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      sx={{ flex: 1 }}
                    />
                    <FormControlLabel
                      sx={{
                        m: 0,
                        whiteSpace: 'nowrap',
                        alignSelf: { xs: 'flex-start', sm: 'center' },
                      }}
                      control={
                        <Checkbox
                          size="small"
                          checked={!!item.allowSubstitute}
                          onChange={(e) =>
                            setCartItemAllowSubstitute(itemKey, e.target.checked)
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Replace if unavailable
                          </Typography>
                          <Tooltip
                            title="If checked, the store will replace this item with a similar product of a different brand when unavailable. If unchecked, the item will be cancelled."
                            placement="top"
                            arrow
                          >
                            <InfoOutlined
                              sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }}
                            />
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Box>
                  </Box>
                  );
                })}

                {/* Custom Order Items */}
                {customOrder && (
                  <Box
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: 2.5,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'primary.lighter',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                      <ShoppingBag sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.95rem' }}>
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        onClick={() => setCustomOrder('')}
                        startIcon={<DeleteOutline />}
                      >
                        Remove List
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  borderColor: 'divider',
                  px: 3,
                  py: 6,
                  textAlign: 'center',
                }}
              >
                <ShoppingBag sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Your cart is empty
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Browse items and add them to your cart to get started.
                </Typography>
                <Button variant="contained" component={Link} to="/" startIcon={<ShoppingBag />}>
                  Continue Shopping
                </Button>
              </Paper>
            )}
          </Grid>

          {/* Order Summary Section */}
          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{
                position: 'sticky',
                top: 24,
                borderRadius: 2,
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                  Order Summary
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                {/* Secondary Phone Section */}
                {userProfile && (
                  <Box sx={{ mb: 3 }}>
                    <SecondaryPhoneInput
                      userProfile={userProfile}
                      onPhoneUpdate={handlePhoneUpdate}
                    />
                  </Box>
                )}

                {/* Line items */}
                <Stack spacing={1.25}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>
                      Subtotal
                    </Typography>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.92rem' }}>
                      ${subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>
                      Delivery Fee
                    </Typography>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.92rem' }}>
                      ${deliveryFee.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>
                      Tax{taxPercentage > 0 ? ` (${taxPercentage.toFixed(1)}%)` : ''}
                    </Typography>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.92rem' }}>
                      ${taxAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  {localTipAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>
                        Tip
                      </Typography>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.92rem' }}>
                        ${localTipAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Tip picker */}
                <Box
                  sx={{
                    mt: 2.5,
                    pt: 2.5,
                    borderTop: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      mb: 1.25,
                    }}
                  >
                    Add a tip
                  </Typography>
                  <ToggleButtonGroup
                    value={tipPercentage}
                    exclusive
                    onChange={handleTipChange}
                    aria-label="tip percentage"
                    size="small"
                    fullWidth
                    sx={{
                      mb: 1.25,
                      '& .MuiToggleButton-root': {
                        borderColor: 'divider',
                        color: 'text.secondary',
                        fontWeight: 500,
                        fontSize: '0.82rem',
                        textTransform: 'none',
                        py: 0.75,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'common.white',
                          borderColor: 'primary.main',
                          '&:hover': { backgroundColor: 'primary.dark' },
                        },
                      },
                    }}
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
                    placeholder="Custom amount"
                    type="number"
                    value={customTip}
                    onChange={handleCustomTipChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography sx={{ color: 'text.secondary' }}>$</Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Total */}
                <Box
                  sx={{
                    mt: 2.5,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>Total</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.35rem' }}>
                    ${total.toFixed(2)}
                  </Typography>
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
                            border: (theme) =>
                              deliveryType === 'pickup'
                                ? `2px solid ${theme.palette.info.main}`
                                : `1px solid ${theme.palette.divider}`,
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
                              setUserSelectedAddress(true);

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
                          border: (theme) =>
                            deliveryType === 'delivery'
                              ? `2px solid ${theme.palette.secondary.main}`
                              : `1px solid ${theme.palette.divider}`,
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
                                <Box>
                                  <AddressAutocomplete
                                    value={newAddress}
                                    onChange={(value) => {
                                      setNewAddress(value);
                                      checkDuplicateAddress(value);
                                    }}
                                    onValidAddress={setIsValidAddress}
                                  />

                                  {/* ✅ External error message display */}
                                  {isDuplicateAddress && (
                                    <Typography
                                      variant="body2"
                                      color="error"
                                      sx={{ mt: 0.5, fontSize: '0.875rem' }}
                                    >
                                      ⚠️ This address already exists in your address book
                                    </Typography>
                                  )}
                                </Box>

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
                                    !newAddress.trim() ||
                                    isAddingAddress ||
                                    !isValidAddress ||
                                    isDuplicateAddress // ✅ Disable if duplicate
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

              {/* Payment Method Selection */}
              {userProfile && (
                <>
                  {paymentConfigLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <PaymentMethodSelector
                      paymentConfig={paymentConfig}
                      selectedMethod={paymentMethod}
                      onMethodChange={setPaymentMethod}
                    />
                  )}
                </>
              )}

              {/* Place Order Button */}
              {userProfile ? (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={paymentMethod === 'cod' ? handleCodOrder : openPaymentModal}
                  disabled={
                    isProfileLoading ||
                    paymentConfigLoading ||
                    !paymentMethod ||
                    (!selectedAddressId && !selectedPickupId) ||
                    (Object.values(cart).length === 0 && !customOrder?.trim()) ||
                    isCodPending
                  }
                  startIcon={paymentMethod === 'cod' ? <LocalShipping /> : <Payment />}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  {paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setSkipNavigateOnLogin(true);
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
              </Box>
            </Paper>
          </Grid>
        </Grid>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={closePaymentModal}
        cartTotal={total}
        orderItems={orderItems}
        deliveryType={deliveryType}
        selectedAddressId={selectedAddressId}
        selectedPickupId={selectedPickupId ? parseInt(selectedPickupId, 10) : null}
        userProfile={userProfile}
        selectedStore={selectedStore}
        tipAmount={tipAmount}
        deliveryInstructions={deliveryInstructions}
        customOrder={customOrder}
        onSuccess={handlePaymentSuccess}
        paymentConfig={paymentConfig}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        open={orderSuccessModalOpen}
        onClose={() => setOrderSuccessModalOpen(false)}
        orderCode={orderCode}
        onNavigate={() => navigate('/')}
        onViewOrder={() => navigate('/orders')}
      />
    </Box>
  );
};

export default CartPage;
