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
import { Close, Remove, Add } from '@mui/icons-material';
import useStore, { useAuthStore } from '@/store/useStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import fetchGraphQL from '../../config/graphql/graphqlService';
import { fetchAuthSession } from 'aws-amplify/auth';
import { CREATE_ORDER_MUTATION, GET_ADDRESSES_BY_USER } from '../../queries/operations';
import { DELIVERY_FEE, TAX_RATE } from '../../config/constants/constants';

const CartModal = ({ open, onClose }) => {
  const { cart, removeFromCart, addToCart, cartTotal, clearCart } = useStore();
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  // Store the address id instead of a string value
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [userId, setUserId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState('');
  const { userProfile } = useAuthStore();

  const subtotal = cartTotal() || 0;
  const tax = subtotal * TAX_RATE;
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const orderTotal = subtotal + tax + deliveryFee;

  useEffect(() => {
    const getUserId = async () => {
      const session = await fetchAuthSession();
      const id = session?.userSub;
      setUserId(id);
    };
    getUserId();
  }, []);

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

  const { data: addressData } = useQuery({
    queryKey: ['getAddressesByUser', userProfile?.id],
    queryFn: () => fetchGraphQL(GET_ADDRESSES_BY_USER, { userId: userProfile.id }),
    enabled: !!userProfile?.id,
    onSuccess: (res) => {
      console.log('Address data fetched:', res);
      setAddresses(res?.getAddressesByUser || []);
      if (res?.getAddressesByUser?.length > 0) {
        // Set the default selected address as the first address's ID
        setSelectedAddress(res.getAddressesByUser[0].id);
      }
    },
  });

  const handleOrderPlacement = async () => {
    setError(''); // Clear any previous errors

    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    const orderItems = Object.values(cart).map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));

    mutate({
      userId: userProfile.id,
      addressId: selectedAddress,
      productItems: orderItems,
    });
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

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Address</InputLabel>
              <Select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)}>
                {addressData?.getAddressesByUser?.map((addr) => (
                  <MenuItem key={addr.id} value={addr.id}>
                    {addr.address} {addr.isPrimary ? '(Primary)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
              disabled={Object.values(cart).length === 0 || isPending}
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
