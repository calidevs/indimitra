import React, { useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { CreditCard, LocalShipping } from '@mui/icons-material';

const PaymentMethodSelector = ({ paymentConfig, selectedMethod, onMethodChange }) => {
  // Determine availability
  const squareAvailable =
    paymentConfig?.isSquareConnected &&
    paymentConfig?.squareApplicationId &&
    paymentConfig?.squareLocationId;
  const codAvailable = paymentConfig?.codEnabled;

  // Auto-select first available method on mount
  useEffect(() => {
    if (!selectedMethod) {
      if (squareAvailable) {
        onMethodChange('square');
      } else if (codAvailable) {
        onMethodChange('cod');
      }
    }
  }, [squareAvailable, codAvailable, selectedMethod, onMethodChange]);

  // If neither payment method is available
  if (!squareAvailable && !codAvailable) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Store payment system unavailable. Please contact store or try again later.
      </Alert>
    );
  }

  return (
    <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
      <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
        Select Payment Method
      </FormLabel>
      <RadioGroup value={selectedMethod || ''} onChange={(e) => onMethodChange(e.target.value)}>
        {squareAvailable && (
          <FormControlLabel
            value="square"
            control={<Radio color="primary" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCard color="primary" />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Pay with Card
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Credit/Debit, Apple Pay, Google Pay
                  </Typography>
                </Box>
              </Box>
            }
            sx={{
              border: '1px solid',
              borderColor: selectedMethod === 'square' ? 'primary.main' : 'divider',
              borderRadius: 1,
              px: 2,
              py: 1.5,
              mb: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          />
        )}
        {codAvailable && (
          <FormControlLabel
            value="cod"
            control={<Radio color="primary" />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping color="primary" />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Cash on Delivery
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pay when you receive your order
                  </Typography>
                </Box>
              </Box>
            }
            sx={{
              border: '1px solid',
              borderColor: selectedMethod === 'cod' ? 'primary.main' : 'divider',
              borderRadius: 1,
              px: 2,
              py: 1.5,
              mb: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          />
        )}
      </RadioGroup>
    </FormControl>
  );
};

export default PaymentMethodSelector;
