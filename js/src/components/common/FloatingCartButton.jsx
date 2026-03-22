import React from 'react';
import { Fab, Badge, useMediaQuery } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useStore from '@/store/useStore';
import { ROUTES } from '@/config/constants/routes';

const FloatingCartButton = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 600px)');
  const cartCount = useStore((state) => state.cartCount());

  if (!isMobile) return null;

  return (
    <Fab
      aria-label="Cart"
      onClick={() => navigate(ROUTES.CART)}
      sx={{
        position: 'fixed',
        bottom: 84,
        right: 20,
        zIndex: 1000,
        width: 52,
        height: 52,
        background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
        color: '#fff',
        boxShadow: '0 4px 14px rgba(255,107,107,0.4)',
        '&:hover': {
          background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
          boxShadow: '0 6px 20px rgba(255,107,107,0.5)',
        },
      }}
    >
      <Badge
        badgeContent={cartCount}
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: '#fff',
            color: '#FF6B6B',
            fontWeight: 700,
            fontSize: '0.7rem',
            minWidth: 18,
            height: 18,
            top: -4,
            right: -4,
          },
        }}
      >
        <ShoppingCart sx={{ fontSize: 26 }} />
      </Badge>
    </Fab>
  );
};

export default FloatingCartButton;
