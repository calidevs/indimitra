// src/components/auth/OtpVerificationForm.jsx
import React, { useState } from 'react';
import { confirmSignUp } from 'aws-amplify/auth';
import { Box, TextField, Button, Typography, Alert, LoadingSpinner } from '../index';

const OtpVerificationForm = ({ email, onComplete, onError, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await confirmSignUp({ username: email, confirmationCode: otp });
      setSuccess('Account verified successfully! You can now log in.');
      if (onSuccess) onSuccess();
      if (onComplete) onComplete(); // e.g., switch tab to login
    } catch (err) {
      console.error('OTP verification error:', err);
      const errMsg = err.message || 'OTP verification failed. Please try again.';
      setError(errMsg);
      if (onError) onError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleOtpVerification}>
      <Typography variant="h4" component="h1" gutterBottom>
        Verify OTP
      </Typography>
      <TextField
        label="Enter OTP"
        variant="outlined"
        fullWidth
        margin="normal"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        required
      />
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{
          mt: 2,
          py: 1.2,
          borderRadius: '8px',
          textTransform: 'none',
          fontSize: '1rem',
        }}
      >
        {loading ? <LoadingSpinner size={24} sx={{ color: '#fff' }} /> : 'Verify OTP'}
      </Button>
    </form>
  );
};

export default OtpVerificationForm;
