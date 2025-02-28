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
} from '@mui/material';
import { Close, Remove, Add } from '@mui/icons-material';
import useStore from '@/store/useStore';

const CartModal = ({ open, onClose }) => {
  const { cart, removeFromCart, addToCart, cartTotal, clearCart } = useStore();
  const [coupon, setCoupon] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('Home');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const subtotal = cartTotal() || 0;
  const tax = subtotal * 0.08; // 8% tax
  const deliveryFee = subtotal > 0 ? 5.99 : 0; // No delivery fee if cart is empty
  const orderTotal = subtotal + tax + deliveryFee;

  const handleOrderPlacement = () => {
    setIsOrderPlaced(true);
    setTimeout(() => {
      clearCart();
      setIsOrderPlaced(false);
      onClose();
    }, 2000);
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

        {/* Show Success Message */}
        {isOrderPlaced ? (
          <Typography color="green" textAlign="center">
            🎉 Order placed successfully!
          </Typography>
        ) : (
          <>
            {/* Cart Items */}
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

            {/* Price Summary */}
            <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
            <Typography>Tax (8%): ${tax.toFixed(2)}</Typography>
            <Typography>Delivery Fee: ${deliveryFee.toFixed(2)}</Typography>
            <Typography fontWeight="bold">Order Total: ${orderTotal.toFixed(2)}</Typography>

            <Divider sx={{ my: 2 }} />

            {/* Delivery Instructions */}
            <TextField
              label="Delivery Instructions"
              fullWidth
              multiline
              rows={2}
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Apply Coupon */}
            <TextField
              label="Coupon Code"
              fullWidth
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Address Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Address</InputLabel>
              <Select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)}>
                <MenuItem value="Home">Home</MenuItem>
                <MenuItem value="Work">Work</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            {/* Checkout Button */}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleOrderPlacement}
              disabled={Object.values(cart).length === 0}
            >
              Place Order
            </Button>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default CartModal;
