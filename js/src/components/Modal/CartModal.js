import React, { useState } from 'react';
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
} from '../index';
import { Close, Remove, Add } from '@mui/icons-material';
import useStore from '@/store/useStore';
import { useMutation } from '@tanstack/react-query';
import fetchGraphQL from '../../config/graphql/graphqlService';
import { fetchAuthSession } from 'aws-amplify/auth';
import { CREATE_ORDER_MUTATION } from '../../queries/operations';

const CartModal = ({ open, onClose }) => {
  const { cart, removeFromCart, addToCart, cartTotal, clearCart } = useStore();
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('Home');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const subtotal = cartTotal() || 0;
  const tax = subtotal * 0.08;
  const deliveryFee = subtotal > 0 ? 5.99 : 0;
  const orderTotal = subtotal + tax + deliveryFee;

  // Use React Query mutation
  const mutation = useMutation({
    mutationKey: ['createOrder'],
    mutationFn: async (variables) => fetchGraphQL(CREATE_ORDER_MUTATION, variables),
    onSuccess: (response) => {
      if (response.errors) {
        console.error('Order Placement Error:', response.errors);
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
    },
  });

  const handleOrderPlacement = async () => {
    try {
      const session = await fetchAuthSession();

      const userId = session.userSub;
      if (!userId) {
        console.error('User ID not found. Ensure user is authenticated.');
        return;
      }

      const productItems = Object.values(cart).map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const variables = {
        userId,
        address: selectedAddress,
        productItems,
      };

      mutation.mutate(variables);
    } catch (error) {
      console.error('Error fetching user ID:', error);
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
                <MenuItem value="Home">Home</MenuItem>
                <MenuItem value="Work">Work</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleOrderPlacement}
              disabled={Object.values(cart).length === 0 || mutation.isLoading}
            >
              {mutation.isLoading ? 'Placing Order...' : 'Place Order'}
            </Button>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default CartModal;
