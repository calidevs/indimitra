import React from 'react';
import { Fab, Badge, useMediaQuery } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useStore from '@/store/useStore';
import { ROUTES } from '@/config/constants/routes';

const FloatingCartButton = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
        background: theme.palette.custom.gradientCoral,
        color: theme.palette.primary.contrastText,
        boxShadow: theme.palette.custom.primaryGlow,
        '&:hover': {
          background: theme.palette.custom.gradientCoralHover,
          boxShadow: theme.palette.custom.primaryGlowHover,
        },
      }}
    >
      <Badge
        badgeContent={cartCount}
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: 'background.paper',
            color: 'primary.main',
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
