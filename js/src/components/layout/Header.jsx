import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  Button,
} from '@components';
import { ShoppingCart, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useMediaQuery } from '@mui/material';
import useStore from '@/store/useStore';
import { useAuthStore } from '@/store/useStore';
import { ROUTES } from '@/config/constants/routes';
import LoginModal from '@/pages/Login/LoginModal';
import { fetchAuthSession } from 'aws-amplify/auth';

const Logo = ({ navigate }) => {
  return (
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
  )
}


const Header = () => {
  const navigate = useNavigate();
  const cartCount = useStore((state) => state.cartCount());
  const isMobile = useMediaQuery('(max-width: 600px)');

  const { user, ability, logout } = useAuthStore();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentForm, setCurrentForm] = useState('login');
  const [cognitoId, setCognitoId] = useState(null);

  // Fetch user ID from Cognito
    const getUserId = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          const id = session.tokens.idToken.payload.sub;
          console.log('Fetched Cognito ID:', id);
          setCognitoId(id);
        } else {
          console.warn('No valid session tokens found.');
          setCognitoId(null);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    getUserId();

  console.log("CognitoId",cognitoId)

  const handleSignInClick = () => {
    setModalOpen(true);
    setCurrentForm('login');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleMenuOpen = (event) => setMenuAnchor(event.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);
  const handleLogout = async () => {
    try {
      await signOut();
      logout();
      navigate("/");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };



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
          <Logo navigate={navigate} />

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {!cognitoId && <Button
              onClick={handleSignInClick}
              sx={{ color: '#2A2F4F', textTransform: 'none', fontSize: '1rem', fontWeight: 500, px: 2, '&:hover': { backgroundColor: 'rgba(42, 47, 79, 0.08)' } }}
            >
              Sign In
            </Button>}

            <LoginModal open={modalOpen} onClose={handleCloseModal} currentForm={currentForm} setCurrentForm={setCurrentForm} />
            {/* Orders (Desktop) */}
            {!isMobile && cognitoId && ability?.can('view', 'orders') && (
             <Button
                onClick={() => navigate(ROUTES.ORDERS)}
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
                Orders
              </Button>
            )}

            {/* Cart */}
            <Tooltip title="Cart">
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
            </Tooltip>

            {/* Profile */}
            {cognitoId && <Tooltip title="Profile">
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
                  },
                }}
              >
                <Person />
              </IconButton>
            </Tooltip>}
          </Box>
        </Toolbar>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 2,
            minWidth: '200px',
            borderRadius: '12px',
            overflow: 'hidden',
          },
        }}
      >
        {/* Orders (Mobile) */}
        {isMobile && ability?.can('view', 'orders') && (
          <MenuItem
            onClick={() => {
              navigate(ROUTES.ORDERS);
              handleMenuClose();
            }}
            sx={{
              py: 1.5,
              px: 3,
              '&:hover': {
                backgroundColor: 'rgba(145, 127, 179, 0.1)',
              },
            }}
          >
            <Typography variant="body1">Orders</Typography>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            navigate(ROUTES.PROFILE);
            handleMenuClose();
          }}
          sx={{
            py: 1.5,
            px: 3,
            '&:hover': {
              backgroundColor: 'rgba(145, 127, 179, 0.1)',
            },
          }}
        >
          <Typography variant="body1">Profile</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleLogout();
            handleMenuClose();
          }}
          sx={{
            py: 1.5,
            px: 3,
            color: '#FF5757',
            '&:hover': {
              backgroundColor: 'rgba(255, 87, 87, 0.1)',
            },
          }}
        >
          <Typography variant="body1">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Spacer for fixed header */}
      <Box sx={{ height: { xs: '64px', sm: '70px' } }} />
    </>
  );
};

export default Header;
