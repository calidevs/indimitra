import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Stack
} from '@mui/material';
import { CheckCircle, Payment, Close } from '@mui/icons-material';
import { PaymentForm, CreditCard, GooglePay, ApplePay } from 'react-square-web-payments-sdk';
import { useMutation } from '@tanstack/react-query';
import fetchGraphQL from '../../config/graphql/graphqlService';
import { CREATE_ORDER_WITH_PAYMENT_MUTATION } from '../../queries/operations';

const PaymentModal = ({
  open,
  onClose,
  cartTotal,
  orderItems,
  deliveryType,
  selectedAddressId,
  selectedPickupId,
  userProfile,
  selectedStore,
  tipAmount,
  deliveryInstructions,
  customOrder,
  onSuccess,
  paymentConfig
}) => {
  // Generate idempotency key once on mount
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [orderResult, setOrderResult] = useState(null);

  // Determine if Square is configured from paymentConfig
  const squareConfigured = paymentConfig?.isSquareConnected && paymentConfig?.squareApplicationId && paymentConfig?.squareLocationId;

  // Create order mutation
  const { mutate: createOrder, isPending, isSuccess } = useMutation({
    mutationFn: async (variables) => {
      return await fetchGraphQL(CREATE_ORDER_WITH_PAYMENT_MUTATION, variables);
    },
    onSuccess: (data) => {
      setOrderResult(data.createOrderWithPayment);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || 'Payment failed. Please try again.');
    }
  });

  // Countdown timer for success auto-dismiss
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      // Auto-dismiss after countdown
      onClose();
      if (onSuccess) {
        onSuccess(orderResult);
      }
    }
  }, [isSuccess, countdown, onClose, onSuccess, orderResult]);

  // Handle tokenization from Square SDK
  const handleTokenReceived = async (token, buyer) => {
    setError(null);

    // Prepare order items in GraphQL format
    const productItems = orderItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    // Call mutation
    createOrder({
      userId: userProfile.id,
      storeId: selectedStore.id,
      productItems,
      payment: {
        paymentToken: token.token,
        idempotencyKey,
        clientCalculatedAmount: cartTotal
      },
      pickupOrDelivery: deliveryType,
      addressId: selectedAddressId,
      pickupId: selectedPickupId,
      tipAmount: tipAmount || 0,
      deliveryInstructions: deliveryInstructions || null,
      customOrder: customOrder || null
    });
  };

  // Create payment request for digital wallets
  const createPaymentRequest = () => ({
    countryCode: 'US',
    currencyCode: 'USD',
    total: {
      amount: cartTotal.toFixed(2),
      label: 'Total'
    }
  });

  // Calculate item count
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog
      open={open}
      onClose={isPending || isSuccess ? undefined : onClose}
      disableEscapeKeyDown={isPending || isSuccess}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          background: (theme) => theme.palette.custom?.gradientPrimary || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 2.5,
          mb: 2,
          position: 'relative',
        }}
      >
        <Payment sx={{ mr: 1, verticalAlign: 'middle' }} />
        Complete Payment
        {!isPending && !isSuccess && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        {isSuccess ? (
          // Success state with countdown
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              gap: 2
            }}
          >
            <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
            <Typography variant="h5" fontWeight="bold" color="success.main">
              Payment Successful!
            </Typography>
            {orderResult && (
              <Typography variant="body1" color="text.secondary">
                Order #{orderResult.displayCode}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Redirecting in {countdown} seconds...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Order summary */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} • {deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}
              </Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                ${cartTotal.toFixed(2)}
              </Typography>
            </Box>

            {/* Error display */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Payment form */}
            {squareConfigured ? (
              <PaymentForm
                applicationId={paymentConfig?.squareApplicationId}
                locationId={paymentConfig?.squareLocationId}
                cardTokenizeResponseReceived={handleTokenReceived}
                createPaymentRequest={createPaymentRequest}
              >
                <Stack spacing={2}>
                  {/* Digital wallets */}
                  <Box>
                    <GooglePay />
                    <Box sx={{ mt: 1 }}>
                      <ApplePay />
                    </Box>
                  </Box>

                  {/* Divider */}
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      OR
                    </Typography>
                  </Divider>

                  {/* Card input */}
                  <CreditCard />

                  {/* Processing indicator */}
                  {isPending && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        py: 2
                      }}
                    >
                      <CircularProgress size={24} />
                      <Typography variant="body2" color="text.secondary">
                        Processing payment...
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </PaymentForm>
            ) : (
              <Stack spacing={2}>
                {/* Preview mode warning */}
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Preview Mode:</strong> Square credentials not configured. This is a UI preview only.
                  <br />
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Configure REACT_APP_SQUARE_APPLICATION_ID and REACT_APP_SQUARE_LOCATION_ID to enable payments.
                  </Typography>
                </Alert>

                {/* Preview: Digital wallet placeholders */}
                <Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    sx={{
                      py: 1.5,
                      borderColor: 'grey.300',
                      color: 'text.secondary',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    <img
                      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234285F4'%3E%3Cpath d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E"
                      alt="Google"
                      style={{ width: 20, height: 20, marginRight: 8 }}
                    />
                    Google Pay
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    sx={{
                      mt: 1,
                      py: 1.5,
                      borderColor: 'grey.300',
                      color: 'text.secondary',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#000"/>
                    </svg>
                    Apple Pay
                  </Button>
                </Box>

                {/* Divider */}
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                {/* Preview: Card input placeholders */}
                <Box sx={{ border: '1px solid', borderColor: 'grey.300', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Card Number
                  </Typography>
                  <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      •••• •••• •••• ••••
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Expiration
                      </Typography>
                      <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          MM/YY
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        CVV
                      </Typography>
                      <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          •••
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Postal Code
                  </Typography>
                  <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      12345
                    </Typography>
                  </Box>
                </Box>

                {/* Preview note */}
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                  Payment form will be interactive once Square credentials are configured
                </Typography>
              </Stack>
            )}
          </>
        )}
      </DialogContent>

      {!isSuccess && !isPending && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default PaymentModal;
