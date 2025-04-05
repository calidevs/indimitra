import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SignUpForm from '../../components/auth/SignUpForm';
import OtpVerificationForm from '../../components/auth/OtpVerificationForm';
import { Box, Paper, Typography } from '@mui/material';

const SignUp = () => {
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [searchParams] = useSearchParams();
  const referredBy = searchParams.get('referredby') || '';

  const handleOtpStep = (email) => {
    setOtpEmail(email);
    setIsOtpStep(true);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,107,107,0.1) 0%, rgba(255,107,107,0.05) 100%)',
          zIndex: 0,
        }
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 560,
          borderRadius: 4,
          p: { xs: 3, sm: 4, md: 6 },
          bgcolor: 'background.paper',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 1,
              textAlign: 'center',
              fontSize: { xs: '1.75rem', sm: '2rem' },
            }}
          >
            {isOtpStep ? 'Verify OTP' : 'Create Account'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            {isOtpStep
              ? 'Enter the OTP sent to your email to verify your account'
              : 'Join us and start your journey today'}
          </Typography>
        </Box>

        <Box sx={{ minHeight: 300 }}>
          {isOtpStep ? (
            <OtpVerificationForm email={otpEmail} onComplete={() => setIsOtpStep(false)} />
          ) : (
            <SignUpForm referredBy={referredBy} onOtpStep={handleOtpStep} />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SignUp;
