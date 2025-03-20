import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SignUpForm from '../../components/auth/SignUpForm';
import OtpVerificationForm from '../../components/auth/OtpVerificationForm';
import { Box, Paper, Typography, Divider } from '@mui/material';

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
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 2, md: 4 },
      }}
    >
      <Paper
        elevation={5}
        sx={{
          width: '100%',
          maxWidth: { xs: 340, sm: 420, md: 480 },
          borderRadius: 3,
          overflow: 'hidden',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 3, sm: 4 },
          boxShadow: '0 20px 45px rgba(0,0,0,0.1)',
        }}
      >
        {/* Title */}
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FF6B6B' }}>
          {isOtpStep ? 'Verify OTP' : 'Sign Up'}
        </Typography>

        {/* Grey Divider */}
        <Divider sx={{ backgroundColor: '#ddd', mt: 1, mb: 2 }} />

        {/* Show OTP form if in OTP Step */}
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
