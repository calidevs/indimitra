import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const OrderSuccessModal = ({ open, onClose, orderCode, onNavigate, onViewOrder }) => {
  const [countdown, setCountdown] = useState(3);

  // Reset countdown when modal opens
  useEffect(() => {
    if (open) {
      setCountdown(3);
    }
  }, [open]);

  const handleClose = () => {
    onClose();
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleViewOrder = () => {
    onClose();
    if (onViewOrder) {
      onViewOrder();
    }
  };

  // Countdown timer for auto-dismiss
  useEffect(() => {
    if (open && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (open && countdown === 0) {
      // Auto-dismiss after countdown - navigate to dashboard
      handleClose();
    }
  }, [open, countdown, onClose, onNavigate]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 2,
            gap: 2,
          }}
        >
          <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
          <Typography variant="h5" fontWeight="bold" color="success.main" textAlign="center">
            Order Placed Successfully!
          </Typography>
          {orderCode && (
            <Typography variant="body1" color="text.secondary">
              Order #{orderCode}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
            Thank you for your purchase. Your order is being processed and you'll receive an update soon!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {countdown > 0 ? `Redirecting in ${countdown} seconds...` : 'Redirecting...'}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 3, width: '100%', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleViewOrder}
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                flex: 1,
                maxWidth: 200,
              }}
            >
              View Order
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleClose}
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                flex: 1,
                maxWidth: 200,
              }}
            >
              OK
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OrderSuccessModal;
