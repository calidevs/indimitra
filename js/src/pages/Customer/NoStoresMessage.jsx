import React from 'react';
import { Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

const NoStoresMessage = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        textAlign: 'center',
        backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
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
