import React from 'react';
import { Box, Typography } from '@mui/material';
import { Store as StoreIcon } from '@mui/icons-material';

const StoreSelectorTitle = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
      <StoreIcon />
      <Typography variant="h5" fontWeight={600}>
        Select a Store
      </Typography>
    </Box>
  );
};

export default StoreSelectorTitle;
