import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  Divider,
  InputLabel,
  FormControl,
  LoadingSpinner,
  Alert,
} from '@components';
import { FormControlLabel, Checkbox, Collapse, Stack } from '@mui/material';
import { Close, Remove, Add, LocationOn, ExpandMore, ExpandLess } from '@mui/icons-material';
import useStore, { useAuthStore, useAddressStore } from '@/store/useStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import fetchGraphQL from '../../config/graphql/graphqlService';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  CREATE_ORDER_MUTATION,
  GET_ADDRESSES_BY_USER,
  CREATE_ADDRESS,
} from '../../queries/operations';
import { DELIVERY_FEE, TAX_RATE } from '../../config/constants/constants';

const CartModal = ({ open, onClose }) => {
  const { cart, removeFromCart, addToCart, cartTotal, clearCart } = useStore();
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  const { userProfile, fetchUserProfile, isProfileLoading } = useAuthStore();

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

  const subtotal = cartTotal() || 0;
  const tax = subtotal * TAX_RATE;
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const orderTotal = subtotal + tax + deliveryFee;

  // Fetch user profile when modal opens
  useEffect(() => {
    if (open && !userProfile) {
      fetchUserProfile();
    }
  }, [open, userProfile, fetchUserProfile]);

  // Fetch addresses when modal opens and user profile is available
  useEffect(() => {
    if (open && userProfile?.id) {
      fetchAddresses(userProfile.id);
    }
  }, [open, userProfile?.id, fetchAddresses]);

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
        onClose();
      }, 2000);
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
    } catch (error) {
      console.error('Error adding address:', error);
      setError('Failed to add address. Please try again.');
    } finally {
      setIsAddingAddress(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '500px',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: '10px',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Your Cart</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        {isOrderPlaced ? (
          <Typography color="green" textAlign="center">
            🎉 Order placed successfully!
          </Typography>
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
                  sx={{ mb: 2 }}
                >
                  <Typography>{item.name}</Typography>
                  <Typography>${item.price.toFixed(2)}</Typography>
                  <Box display="flex" alignItems="center">
                    <IconButton onClick={() => removeFromCart(item.id)}>
                      <Remove />
                    </IconButton>
                    <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                    <IconButton onClick={() => addToCart(item)}>
                      <Add />
                    </IconButton>
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

            <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
            <Typography>Tax (8%): ${tax.toFixed(2)}</Typography>
            <Typography>Delivery Fee: ${deliveryFee.toFixed(2)}</Typography>
            <Typography fontWeight="bold">Order Total: ${orderTotal.toFixed(2)}</Typography>

            <Divider sx={{ my: 2 }} />

            <TextField
              label="Delivery Instructions"
              fullWidth
              multiline
              rows={2}
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              sx={{ mb: 2 }}
            />

            {isProfileLoading ? (
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
                      <TextField
                        label="Address"
                        fullWidth
                        multiline
                        rows={3}
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
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
                        disabled={!newAddress.trim() || isAddingAddress}
                        startIcon={isAddingAddress ? <LoadingSpinner size={20} /> : <LocationOn />}
                      >
                        {isAddingAddress ? 'Adding...' : 'Add Address'}
                      </Button>
                    </Stack>
                  </Box>
                </Collapse>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                mt: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
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
          </>
        )}
      </Box>
    </Modal>
  );
};

export default CartModal;
