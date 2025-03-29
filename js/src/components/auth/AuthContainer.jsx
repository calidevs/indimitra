import React from 'react';
import { Box, Paper, Divider, Typography } from '../index'; // Adjust import paths if needed
import { Link } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';

const AuthContainer = () => {
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
        {/* Login Title */}
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FF6B6B' }}>
          Sign In
        </Typography>

        {/* Grey Divider */}
        <Divider sx={{ backgroundColor: '#ddd', mt: 1, mb: 2 }} />

        {/* Login Form */}
        <Box sx={{ minHeight: 300 }}>
          <LoginPage />
        </Box>

        {/* Forgot Password & Sign Up Link */}
        <Box
          sx={{
            minHeight: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Link to="/forgot-password" style={{ textDecoration: 'underline', color: 'black' }}>
            Forgot Password?
          </Link>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link to="/signup" style={{ textDecoration: 'underline', color: '#FF6B6B' }}>
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthContainer;
