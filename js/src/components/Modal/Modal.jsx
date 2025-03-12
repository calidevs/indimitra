import React from 'react';
import { Modal as MuiModal, Box } from '@mui/material';

const Modal = ({ open, onClose, children }) => {
  return (
    <MuiModal
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-modal"
      aria-describedby="confirmation-modal-description"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '400px', // Set a proper width
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
          outline: 'none', // Prevent default modal outline
        }}
      >
        {children}
      </Box>
    </MuiModal>
  );
};

export default Modal;
