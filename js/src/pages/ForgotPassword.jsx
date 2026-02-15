import { useState } from 'react';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { Box, Paper, Typography, InputForm } from '../components';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = ({ onSuccess }) => {
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
      setTimeout(() => {
        if (onSuccess) {
          // If used in modal, switch to login form
          onSuccess();
        } else {
          // If used as standalone page, navigate to home
          navigate('/');
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        // minHeight: '100vh',
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
          background:
            'linear-gradient(135deg, rgba(255,107,107,0.1) 0%, rgba(255,107,107,0.05) 100%)',
          zIndex: 0,
        },
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
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            {step === 1
              ? 'Enter your email address to receive a reset code'
              : 'Enter the OTP sent to your email and your new password'}
          </Typography>
        </Box>

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
