import { useState } from 'react';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { Box, Paper, Typography, InputForm } from '../components';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await resetPassword({ username: email });
      setStep(2);
      setSuccess('OTP sent successfully! Check your email.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: otp,
        newPassword,
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Try again.');
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
        <Typography variant="h4" component="h1" gutterBottom>
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </Typography>

        {step === 1 ? (
          <InputForm
            fields={[{ label: 'Email', type: 'email', value: email, onChange: setEmail }]}
            onSubmit={handleSendOtp}
            buttonLabel="Send OTP"
            loading={loading}
            error={error}
            success={success}
          />
        ) : (
          <InputForm
            fields={[
              { label: 'OTP', type: 'text', value: otp, onChange: setOtp },
              {
                label: 'New Password',
                type: 'password',
                value: newPassword,
                onChange: setNewPassword,
              },
            ]}
            onSubmit={handleResetPassword}
            buttonLabel="Reset Password"
            loading={loading}
            error={error}
            success={success}
          />
        )}
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
