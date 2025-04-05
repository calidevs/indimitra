import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { LoadingSpinner } from '@components';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthStore } from '../store/useStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          const userId = session.tokens.idToken.payload.sub;
          const userRole = session.tokens.idToken.payload['custom:role']?.toLowerCase();

          setUser({ id: userId, role: userRole });
          navigate(`/${userRole}`);
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
            Welcome Back
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            Sign in to continue your journey with us
          </Typography>
        </Box>

        <LoginForm />

        <Box
          sx={{
            mt: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Link
            to="/forgot-password"
            style={{
              textDecoration: 'none',
              color: theme.palette.primary.main,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              '&:hover': {
                textDecoration: 'underline',
                opacity: 0.8,
              },
            }}
          >
            Forgot Password?
          </Link>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                textDecoration: 'none',
                color: theme.palette.primary.main,
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  textDecoration: 'underline',
                  opacity: 0.8,
                },
              }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
