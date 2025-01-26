import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const LoadingSpinner = ({ size = 40, thickness = 3.6, sx = {} }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', ...sx }}>
      <CircularProgress size={size} thickness={thickness} />
    </Box>
  );
};

export default LoadingSpinner;
