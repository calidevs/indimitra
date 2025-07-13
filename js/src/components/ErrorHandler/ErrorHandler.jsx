import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

const ErrorHandler = ({ error, title = 'Error', severity = 'error' }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Alert severity={severity}>
        <AlertTitle sx={{ fontWeight: 'bold' }}>{title}</AlertTitle>

        {error}
      </Alert>
    </Box>
  );
};

export default ErrorHandler;
