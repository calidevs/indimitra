import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/constants/routes';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 5,
            borderRadius: 2,
            maxWidth: 600,
            width: '100%',
          }}
        >
          <Typography variant="h1" color="primary" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The page you are looking for does not exist or is not available.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate(ROUTES.STORE_MANAGER)}
          >
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;
