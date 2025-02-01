// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import { Box, TextField, Button, Typography, Alert, LoadingSpinner } from '../components/index';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';

const LoginPage = ({ onSuccess, onError, navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn({ username: email, password });
      if (onSuccess) onSuccess();
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.message || 'Login failed. Please try again.';
      setError(errMsg);
      if (onError) onError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn}>
      {/* <Typography variant="h4" component="h1" gutterBottom>
        Sign In
      </Typography> */}

      {/* Email Field with Icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mt: 2,
          backgroundColor: '#fff',
          borderRadius: 2,
          border: '1px solid #ccc',
          px: 2,
          py: 1,
        }}
      >
        <Box sx={{ color: '#FF6B6B', mr: 1 }}>
          <AccountCircleIcon />
        </Box>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiOutlinedInput-root': { fontSize: '0.95rem' },
          }}
          required
        />
      </Box>

      {/* Password Field with Icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mt: 2,
          backgroundColor: '#fff',
          borderRadius: 2,
          border: '1px solid #ccc',
          px: 2,
          py: 1,
        }}
      >
        <Box sx={{ color: '#FF6B6B', mr: 1 }}>
          <LockIcon />
        </Box>
        <TextField
          label="Password"
          variant="outlined"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '& .MuiOutlinedInput-root': { fontSize: '0.95rem' },
          }}
          required
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{
          mt: 3,
          py: 1.2,
          borderRadius: '8px',
          textTransform: 'none',
          fontSize: '1rem',
        }}
      >
        {loading ? <LoadingSpinner size={24} sx={{ color: '#fff' }} /> : 'Login'}
      </Button>
    </form>
  );
};

export default LoginPage;
