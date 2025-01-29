import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Tabs,
  Tab,
  LoadingSpinner,
} from '../components';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setIsOtpStep(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn({
        username: email,
        password: password,
      });
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signUp({
        username: email,
        password: password,
      });
      setIsOtpStep(true);
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmSignUp({ username: email, confirmationCode: otp });
      alert('Account verified successfully! You can now log in.');
      setActiveTab(0);
      setIsOtpStep(false);
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          boxShadow: 3,
          textAlign: 'center',
        }}
      >
        <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ marginBottom: 2 }}>
          <Tab label="Login" />
          <Tab label="Sign Up" />
        </Tabs>

        {!isOtpStep ? (
          <form onSubmit={activeTab === 0 ? handleSignIn : handleSignUp}>
            <Typography variant="h4" component="h1" gutterBottom>
              {activeTab === 0 ? 'Login' : 'Sign Up'}
            </Typography>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
              sx={{ mt: 2 }}
            >
              {loading ? (
                <LoadingSpinner size={24} sx={{ color: '#fff' }} />
              ) : activeTab === 0 ? (
                'Login'
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpVerification}>
            <Typography variant="h4" component="h1" gutterBottom>
              Verify OTP
            </Typography>
            <TextField
              label="Enter OTP"
              variant="outlined"
              fullWidth
              margin="normal"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
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
              sx={{ mt: 2 }}
            >
              {loading ? <LoadingSpinner size={24} sx={{ color: '#fff' }} /> : 'Verify OTP'}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default LoginPage;
