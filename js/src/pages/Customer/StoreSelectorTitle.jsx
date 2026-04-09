import React from 'react';
import { Box, Typography } from '@mui/material';

const StoreSelectorTitle = ({ subtitle }) => {
  return (
    <Box>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '1.1rem',
          color: 'text.primary',
          lineHeight: 1.3,
        }}
      >
        Select a store
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            mt: 0.5,
            fontSize: '0.82rem',
            color: 'text.secondary',
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default StoreSelectorTitle;
