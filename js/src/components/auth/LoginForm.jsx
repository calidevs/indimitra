import React, { useState } from 'react';
import { signIn, resendSignUpCode, fetchUserAttributes } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import { useAuthStore } from '../../store/useStore';
import OtpVerificationForm from './OtpVerificationForm';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { defineUserAbility } from '../../ability/defineAbility';

const LoginForm = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  const { setUser, setAbility, setModalOpen } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await signIn({ username: email, password });

      // Check if user needs to confirm signup
      if (user.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        console.warn('⚠️ User needs to confirm sign-up. Redirecting to OTP...');
        await resendSignUpCode({ username: email }); // Resend OTP
        setIsOtpStep(true); // Switch to OTP verification step
        return;
      }

      const attributes = await fetchUserAttributes();
      const userRole = attributes['custom:role'].toLowerCase();

      setUser({ email: attributes.email, role: userRole });

      const newAbility = defineUserAbility(userRole);
      setAbility(newAbility);

      setModalOpen(false);
      if (onSuccess) {
        onSuccess();
      }
      // Always navigate to role-specific dashboard after login
      navigate(`/${userRole}`);
    } catch (err) {
      console.error('❌ Login error:', err);

      if (err.message.includes('User is not confirmed')) {
        console.warn('⚠️ User not verified. Resending OTP...');
        try {
          await resendSignUpCode({ username: email });
          setIsOtpStep(true); // Show OTP form
        } catch (resendError) {
          console.error('❌ Error resending OTP:', resendError);
          setError(resendError.message || 'Error resending OTP.');
        }
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Show OTP form if user is unconfirmed */}
      {isOtpStep ? (
        <OtpVerificationForm
          email={email}
          onSuccess={() => navigate('/')} // Redirect after successful verification
          onComplete={() => setIsOtpStep(false)}
        />
      ) : (
        <form onSubmit={handleSignIn}>
          {/* Email Field */}
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

          {/* Password Field */}
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

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{
              py: 1.2,
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Login'}
          </Button>
        </form>
      )}
    </Box>
  );
};

export default LoginForm;
