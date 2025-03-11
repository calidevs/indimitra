import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Fab,
  Menu,
  MenuItem,
} from '@mui/material';
import { ShoppingCart, Menu as MenuIcon } from '@mui/icons-material';
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
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

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
      {/* Navbar */}
      <AppBar position="static" sx={{ background: theme.palette.custom.gradientPrimary }}>
        <Toolbar>
          {/* App Title (Clickable) */}
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Indimitra
          </Typography>

          {/* Cart Icon (remains the same) */}
          <IconButton color="inherit" onClick={() => setCartOpen(true)}>
            <Badge badgeContent={cartCount} color="error" invisible={cartCount === 0}>
              <ShoppingCart />
            </Badge>
          </IconButton>

          {/* Burger Menu Icon (moved to the right) */}
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MenuIcon />
          </IconButton>

          {/* Dropdown Menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            keepMounted
            sx={{ mt: 1 }}
          >
            <MenuItem
              onClick={() => {
                navigate('/orders');
                handleMenuClose();
              }}
            >
              Orders
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleLogout();
                handleMenuClose();
              }}
            >
              Logout
            </MenuItem>
          </Menu>
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
