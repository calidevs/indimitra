import React, { useState } from 'react';
import { AppBar, Box, Toolbar, Typography, Button, IconButton, Badge, Fab } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import useStore from '@/store/useStore';
import CartModal from '../Modal/CartModal';

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const cartCount = useStore((state) => state.cartCount());
  const isMobile = useMediaQuery('(max-width: 600px)');

  const [cartOpen, setCartOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Navbar visible on all devices */}
      <AppBar position="static" sx={{ background: theme.palette.custom.gradientPrimary }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Indimitra
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
          {/* Show cart icon in navbar only for tablets & desktops */}
          {!isMobile && (
            <IconButton color="inherit" onClick={() => setCartOpen(true)}>
              <Badge badgeContent={cartCount} color="error" invisible={cartCount === 0}>
                <ShoppingCart />
              </Badge>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Floating Cart Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="cart"
          onClick={() => setCartOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: theme.palette.custom.gradientPrimary,
            color: 'white',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
            '&:hover': {
              opacity: 0.9,
            },
          }}
        >
          <Badge badgeContent={cartCount} color="error" invisible={cartCount === 0}>
            <ShoppingCart />
          </Badge>
        </Fab>
      )}

      {/* Cart Modal */}
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </Box>
  );
};

export default Header;
