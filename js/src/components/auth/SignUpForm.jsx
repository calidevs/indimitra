import React, { useState } from 'react';
import { signUp, resendSignUpCode } from 'aws-amplify/auth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import { Link } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const SignUpForm = ({ referredBy = '', onOtpStep, onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(''); // Optional Phone Number
  const [referralCode, setReferralCode] = useState(referredBy); // Editable if no URL param
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            'custom:given_name': firstName,
            'custom:family_name': lastName,
            'custom:phone_number': phone, // Optional
            'custom:referredBy': referralCode, // Optional
          },
        },
      });

      setSuccess('Signup successful! Enter the OTP sent to your email.');
      if (onOtpStep) onOtpStep(email);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Signup error:', err);

      if (err.message.includes('User already exists')) {
        console.warn('⚠️ User exists but may not be confirmed.');

        try {
          // 🔄 Resend OTP if user is unconfirmed
          await resendSignUpCode({ username: email });
          setSuccess('OTP resent. Please check your email.');
          if (onOtpStep) onOtpStep(email);
        } catch (resendError) {
          console.error('❌ Error resending OTP:', resendError);
          setError(resendError.message || 'Error resending OTP.');
        }
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
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
        type={showPassword ? 'text' : 'password'}
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
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Phone Number (Optional) */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label="Country Code"
          variant="outlined"
          value="+1"
          disabled
          sx={{ width: '120px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon sx={{ color: '#FF6B6B' }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Phone Number"
          variant="outlined"
          fullWidth
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon sx={{ color: '#FF6B6B' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Referral Code (Editable if no URL param) */}
      <TextField
        label="Referral Code"
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
    </form>
  );
};

export default SignUpForm;
