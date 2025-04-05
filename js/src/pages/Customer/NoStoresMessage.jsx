import React from 'react';
import { Paper, Typography } from '@mui/material';

const NoStoresMessage = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        textAlign: 'center',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderRadius: 2,
      }}
    >
      <Typography sx={{ fontWeight: 500, color: 'info.main' }}>
        No stores available at the moment.
      </Typography>
    </Paper>
  );
};

export default NoStoresMessage;
