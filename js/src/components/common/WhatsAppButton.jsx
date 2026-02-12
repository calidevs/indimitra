import React from 'react';
import { Fab } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import useStore from '@/store/useStore';

const WhatsAppButton = () => {
  const selectedStore = useStore((state) => state.selectedStore);

  const handleWhatsAppClick = () => {
    const phoneNumber = selectedStore?.whatsappNumber || '+15627872535';
    const message = `Hello! I have a question about ${selectedStore?.name || 'your services'}.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Fab
      color="success"
      aria-label="WhatsApp"
      onClick={handleWhatsAppClick}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        backgroundColor: '#25D366',
        '&:hover': {
          backgroundColor: '#128C7E',
        },
      }}
    >
      <WhatsAppIcon sx={{ fontSize: 32 }} />
    </Fab>
  );
};

export default WhatsAppButton;
