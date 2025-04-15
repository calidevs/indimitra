import React from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Button,
} from '@components';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useStore from '@/store/useStore';
import { ROUTES } from '@/config/constants/routes';

const Navbar = () => {
  const navigate = useNavigate();
  const cartCount = useStore((state) => state.cartCount());

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: '64px', sm: '70px' },
            px: { xs: 2, sm: 4 },
          }}
        >
          {/* Logo */}
          <Typography
            variant="h5"
            onClick={() => navigate('/')}
            sx={{
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
            }}
          >
            Indimitra
          </Typography>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            {/* Login Button */}
            <Button
              onClick={() => navigate(ROUTES.LOGIN)}
              sx={{
                color: '#2A2F4F',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(42, 47, 79, 0.08)',
                },
              }}
            >
              Login
            </Button>

            {/* Cart */}
            <IconButton
              onClick={() => navigate(ROUTES.CART)}
              sx={{
                background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
                },
              }}
            >
              <Badge badgeContent={cartCount}>
                <ShoppingCart />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </Box>

      {/* Spacer for fixed header */}
      <Box sx={{ height: { xs: '64px', sm: '70px' } }} />
    </>
  );
};

export default Navbar;