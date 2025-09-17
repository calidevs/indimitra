import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import { NotificationsActive } from '@mui/icons-material';
import { useMutation, gql } from '@apollo/client';

const SEND_TEST_NOTIFICATION = gql`
  mutation SendTestNotification($title: String!, $message: String!) {
    sendTestNotification(title: $title, message: $message) {
      success
      title
      message
    }
  }
`;

const NotificationSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  const [sendTestNotification] = useMutation(SEND_TEST_NOTIFICATION);

  useEffect(() => {
    // Check if notifications are already enabled
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const checkNotificationPermission = () => {
    return Notification.permission === 'granted';
  };

  const handleNotificationToggle = async () => {
    if (!('Notification' in window)) {
      setAlertMessage('This browser does not support notifications');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }

    try {
      if (!notificationsEnabled) {
        // First request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          
          // Show an immediate test notification
          const notification = new Notification('Notifications Enabled', {
            body: 'You will now receive notifications from Indimitra',
            vibrate: [200, 100, 200]
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          setAlertMessage('Notifications enabled successfully');
          setAlertSeverity('success');
        } else {
          setAlertMessage('Permission denied for notifications. Please enable notifications in your browser settings.');
          setAlertSeverity('error');
        }
      } else {
        setNotificationsEnabled(false);
        setAlertMessage('Notifications disabled');
        setAlertSeverity('info');
      }
      setShowAlert(true);
    } catch (error) {
      console.error('Error handling notifications:', error);
      setAlertMessage('Error configuring notifications: ' + error.message);
      setAlertSeverity('error');
      setShowAlert(true);
    }
  };

  const handleTestNotification = async () => {
    try {
      if (!checkNotificationPermission()) {
        setAlertMessage('Please enable notifications first');
        setAlertSeverity('warning');
        setShowAlert(true);
        return;
      }

      // Create and show a test notification
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from Indimitra. Click to focus the window.',
        vibrate: [200, 100, 200],
        requireInteraction: true // Keep the notification visible until user interacts with it
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setAlertMessage('Test notification sent successfully');
      setAlertSeverity('success');
    } catch (error) {
      console.error('Error sending test notification:', error);
      setAlertMessage('Error sending test notification: ' + error.message);
      setAlertSeverity('error');
    }
    setShowAlert(true);
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <NotificationsActive sx={{ mr: 1 }} />
        <Typography variant="h6">Notification Settings</Typography>
      </Box>
      
      <FormControlLabel
        control={
          <Switch
            checked={notificationsEnabled}
            onChange={handleNotificationToggle}
            color="primary"
          />
        }
        label="Enable Push Notifications"
      />
      
      {notificationsEnabled && (
        <Box mt={2}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleTestNotification}
          >
            Send Test Notification
          </Button>
        </Box>
      )}

      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(false)}
      >
        <Alert
          onClose={() => setShowAlert(false)}
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default NotificationSettings;
