import React, { useEffect, useState } from 'react';
import { Box, Paper, Divider, Typography } from '@mui/material';
import { LoadingSpinner } from '@components';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthStore } from '../store/useStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          const userId = session.tokens.idToken.payload.sub;
          const userRole = session.tokens.idToken.payload['custom:role']?.toLowerCase(); // Fetch role

          setUser({ id: userId, role: userRole });
          navigate(`/${userRole}`); // Redirect to the role-based dashboard
        } else {
          console.warn('No valid session tokens found.');
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, [setUser, navigate]);

  if (loading) return <LoadingSpinner />;

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
        <Box sx={{ marginBottom: 2 }}>
          <LoginForm />
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

export default LoginPage;
