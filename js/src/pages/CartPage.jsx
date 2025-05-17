import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  LoadingSpinner,
  Alert,
  Divider,
} from '@components';
import { FormControlLabel, Checkbox, Collapse, Stack, TextField } from '@mui/material';
import { Remove, Add, LocationOn, ExpandMore, ExpandLess } from '@mui/icons-material';
import useStore, { useAuthStore, useAddressStore } from './../store/useStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import fetchGraphQL from '../config/graphql/graphqlService';
import { CREATE_ORDER_MUTATION } from '../queries/operations';
import { DELIVERY_FEE, TAX_RATE } from '../config/constants/constants';
import { useNavigate, Link } from 'react-router-dom';
import LoginModal from './Login/LoginModal'; // Import the LoginModal
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';

const CartPage = () => {
  const { cart, removeFromCart, addToCart, cartTotal, clearCart } = useStore();
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  const { userProfile, fetchUserProfile, isProfileLoading, setModalOpen, setCurrentForm } =
    useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
  const subtotal = cartTotal() || 0;
  const tax = 0;

  const calculateDeliveryFee = (boxCount) => {
    if (boxCount === 0) return 0;
    if (boxCount === 1) return 5;
    return 10; // For 2 or more boxes
  };

  const boxCount = Object.values(cart).reduce((acc, item) => acc + (item.quantity || 0), 0);
  const deliveryFee = calculateDeliveryFee(boxCount);

  const orderTotal = subtotal + tax + deliveryFee;

  // Fetch user profile when modal opens
  useEffect(() => {
    if (!userProfile) {
      fetchUserProfile();
    }
  }, [userProfile, fetchUserProfile]);

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

    mutate({
      userId: userProfile.id,
      addressId: selectedAddressId,
      productItems: orderItems,
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

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Cart
      </Typography>

      {isOrderPlaced ? (
        <Alert severity="success">Order placed successfully!</Alert>
      ) : (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {Object.values(cart).length > 0 ? (
            Object.values(cart).map((item) => (
              <Box
                key={item.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2, py: 1, borderBottom: '1px solid #ccc' }}
              >
                <Typography>{item.name}</Typography>
                <Typography>${item.price.toFixed(2)}</Typography>
                <Box display="flex" alignItems="center">
                  <Button onClick={() => removeFromCart(item.id)}>
                    <Remove />
                  </Button>
                  <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                  <Button onClick={() => addToCart(item)}>
                    <Add />
                  </Button>
                </Box>
                <Typography sx={{ fontWeight: 'bold' }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography textAlign="center">Your cart is empty!</Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <Typography>Subtotal:</Typography>
            <Typography>${subtotal.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <Typography>Tax:</Typography>
            <Typography>${tax.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <Typography>Delivery Fee:</Typography>
            <Typography>${deliveryFee.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', mt: 1 }}>
            <Typography>Order Total:</Typography>
            <Typography>${orderTotal.toFixed(2)}</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {userProfile && (
            <TextField
              label="Delivery Instructions"
              fullWidth
              multiline
              rows={2}
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}

          {userProfile &&
            (isProfileLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <LoadingSpinner size={24} />
                <Typography sx={{ ml: 2 }}>Loading user profile...</Typography>
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth sx={{ mb: 1 }}>
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

                {/* Toggle button for address form */}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={showAddressForm ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  sx={{ mt: 1 }}
                >
                  {showAddressForm ? 'Cancel Adding Address' : 'Add New Address'}
                </Button>

                {/* Inline address form */}
                {userProfile && (
                  <Collapse in={showAddressForm}>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Add New Delivery Address
                      </Typography>
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
                )}
              </Box>
            ))}

          {userProfile ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2, minWidth: '200px' }}
                onClick={handleOrderPlacement}
                disabled={
                  Object.values(cart).length === 0 ||
                  isPending ||
                  !selectedAddressId ||
                  isProfileLoading
                }
              >
                {isPending ? (
                  <>
                    <LoadingSpinner size={20} sx={{ color: 'white' }} /> Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2, minWidth: '200px' }}
                onClick={() => {
                  setModalOpen(true);
                  setCurrentForm('login');
                }}
              >
                Login
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CartPage;
