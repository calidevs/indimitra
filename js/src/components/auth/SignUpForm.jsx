import React, { useState } from 'react';
import { signUp } from 'aws-amplify/auth';
import { Box, TextField, Button, Typography, Alert, InputAdornment } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import { Link } from 'react-router-dom';

const SignUpForm = ({ referredBy = '', onOtpStep, onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(referredBy); // Editable if no URL param
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signUp({
        username: email,
        password,
        attributes: {
          given_name: firstName,
          family_name: lastName,
          'custom:referred_by': referralCode, // Store referral
        },
      });

      setSuccess('Signup successful! Enter the OTP sent to your email.');
      if (onOtpStep) onOtpStep(email);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please try again.');
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      {/* First Name */}
      <TextField
        label="First Name"
        variant="outlined"
        fullWidth
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon sx={{ color: '#FF6B6B' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Last Name */}
      <TextField
        label="Last Name"
        variant="outlined"
        fullWidth
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon sx={{ color: '#FF6B6B' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Email */}
      <TextField
        label="Email"
        variant="outlined"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AccountCircleIcon sx={{ color: '#FF6B6B' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Password */}
      <TextField
        label="Password"
        variant="outlined"
        type="password"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon sx={{ color: '#FF6B6B' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Referred By (Editable if no URL param) */}
      <TextField
        label="Referred By"
        variant="outlined"
        fullWidth
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
        disabled={!!referredBy} // Disable only if referredBy param is present
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AccountCircleIcon sx={{ color: '#FF6B6B' }} />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Sign Up Button */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{ mt: 1, mb: 2 }}
      >
        {loading ? 'Processing...' : 'Sign Up'}
      </Button>

      {/* Login Link */}
      <Typography variant="body2" sx={{ textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ textDecoration: 'underline', color: '#FF6B6B' }}>
          Login
        </Link>
      </Typography>
    </form>
  );
};

export default SignUpForm;
