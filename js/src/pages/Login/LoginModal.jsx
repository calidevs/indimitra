import React, { useState, useEffect, useRef } from 'react';
import { Modal, Box, Paper, Typography, useTheme, Button, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LoginForm from '../../components/auth/LoginForm';
import SignUpForm from '../../components/auth/SignUpForm';
import ForgotPassword from '../ForgotPassword';
import OtpVerificationForm from '../../components/auth/OtpVerificationForm';

const LoginModal = ({ open, onClose, initialForm = 'login' }) => {
  const [currentForm, setCurrentForm] = useState(initialForm);
  const [email, setEmail] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const formKeyRef = useRef(0);
  const theme = useTheme();

  // Reset to login form when modal opens
  useEffect(() => {
    if (open) {
      setCurrentForm('login');
      setVerificationSuccess(false);
      setEmail('');
      formKeyRef.current += 1; // Increment key to force form remount
    }
  }, [open]);

  const switchForm = (formType) => {
    setCurrentForm(formType);
    setVerificationSuccess(false);
  };

  const handleSignUpSuccess = (userEmail) => {
    setEmail(userEmail);
    setCurrentForm('otp');
  };

  const handleOtpSuccess = () => {
    setVerificationSuccess(true);
    setCurrentForm('login');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 560,
          borderRadius: 4,
          p: { xs: 3, sm: 4, md: 5 },
          bgcolor: 'background.paper',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            minWidth: 0,
            p: 0.5,
          }}
        >
          <CloseIcon />
        </Button>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 1,
              textAlign: 'center',
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
            }}
          >
            {currentForm === 'login'
              ? 'Welcome Back'
              : currentForm === 'signup'
                ? 'Create Account'
                : currentForm === 'otp'
                  ? 'Verify Email'
                  : ''}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            {currentForm === 'login'
              ? 'Sign in to continue your journey with us'
              : currentForm === 'signup'
                ? 'Join us and start your adventure'
                : currentForm === 'otp'
                  ? 'Enter the OTP sent to your email'
                  : ''}
          </Typography>
        </Box>

        {verificationSuccess && currentForm === 'login' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Email verified successfully! Please login to continue.
          </Alert>
        )}

        {currentForm === 'login' ? (
          <LoginForm key={`login-form-${formKeyRef.current}`} onSuccess={onClose} />
        ) : currentForm === 'signup' ? (
          <SignUpForm onSuccess={handleSignUpSuccess} />
        ) : currentForm === 'otp' ? (
          <OtpVerificationForm email={email} onSuccess={handleOtpSuccess} />
        ) : (
          <ForgotPassword onSuccess={() => switchForm('login')} />
        )}

        <Box
          sx={{
            mt: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {currentForm === 'login' && (
            <Button
              onClick={() => switchForm('forgotPassword')}
              sx={{ color: theme.palette.primary.main, textTransform: 'none' }}
            >
              Forgot Password?
            </Button>
          )}
          {currentForm !== 'otp' && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {currentForm === 'login'
                ? "Don't have an account?"
                : currentForm === 'signup'
                  ? 'Already have an account?'
                  : 'Remember your password?'}
              <Button
                color="primary"
                onClick={() => switchForm(currentForm === 'login' ? 'signup' : 'login')}
                sx={{ textTransform: 'none' }}
              >
                {currentForm === 'login' ? 'Sign Up' : 'Login'}
              </Button>
            </Typography>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default LoginModal;
