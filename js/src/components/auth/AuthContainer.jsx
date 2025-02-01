import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, Divider } from '../index'; // e.g. ../components/index
import { useNavigate, Link } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import SignUpForm from './SignUpForm';
import OtpVerificationForm from './OtpVerificationForm';

const AuthContainer = () => {
  const [activeTab, setActiveTab] = useState(0); // 0 => Login, 1 => Sign Up
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setIsOtpStep(false);
  };

  const handleOtpStep = (email) => {
    setOtpEmail(email);
    setIsOtpStep(true);
  };

  const handleOtpComplete = () => {
    setIsOtpStep(false);
    setActiveTab(0); // Switch to login
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
        {/* Tabs with Orange Active Color */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          TabIndicatorProps={{ style: { backgroundColor: '#FF6B6B', height: '4px' } }} // Orange Active Tab
          sx={{
            mb: 1,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              color: '#666', // Default grey
            },
            '& .Mui-selected': {
              color: '#FF6B6B',
            },
          }}
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
        </Tabs>

        {/* Light Grey Divider between Tabs and Form */}
        <Divider sx={{ backgroundColor: '#ddd', mb: 2 }} />

        {/* Fixed-height container to prevent layout jumps */}
        <Box sx={{ minHeight: 300, transition: 'all 0.3s ease-in-out' }}>
          {isOtpStep ? (
            <OtpVerificationForm
              email={otpEmail}
              onComplete={handleOtpComplete}
              onError={() => {}}
              onSuccess={() => {}}
            />
          ) : activeTab === 0 ? (
            <LoginPage navigate={navigate} onSuccess={() => {}} onError={() => {}} />
          ) : (
            <SignUpForm onOtpStep={handleOtpStep} onSuccess={() => {}} onError={() => {}} />
          )}
        </Box>

        {/* Forgot Password Link - Always Rendered but Controlled via Visibility */}
        <Box
          sx={{ minHeight: 40, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <Link
            to="/forgot-password"
            style={{
              visibility: activeTab === 0 && !isOtpStep ? 'visible' : 'hidden',
              opacity: activeTab === 0 && !isOtpStep ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
              color: 'black',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            <span style={{ textDecoration: 'underline' }}>Forgot Password?</span>
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthContainer;
