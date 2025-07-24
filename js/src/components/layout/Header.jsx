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
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { ShoppingCart, Person, Storefront, ShoppingBag } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useMediaQuery } from '@mui/material';
import useStore from '@/store/useStore';
import { useAuthStore } from '@/store/useStore';
import { ROUTES } from '@/config/constants/routes';
import LoginModal from '@/pages/Login/LoginModal';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { defineUserAbility } from '@/ability/defineAbility';
import StoreSelector from '@/pages/Customer/StoreSelector';
import MenuIcon from '@mui/icons-material/Menu';

const Logo = ({ navigate, userRole }) => {
  const { setUser } = useAuthStore();

  const handleLogoClick = async () => {
    let roleToUse = userRole;

    // If role is undefined, fetch it from the session
    if (!roleToUse) {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          roleToUse = session.tokens.idToken.payload['custom:role']?.toLowerCase();
          // Store the role in the auth store
          setUser({ role: roleToUse });
        }
      } catch (error) {
        console.error('Error fetching role from session:', error);
      }
    }

    // Navigate based on the role
    if (roleToUse) {
      navigate(`/${roleToUse}`);
    } else {
      navigate(`/`);
    }
  };

  return (
    <Typography
      onClick={handleLogoClick}
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
  );
};

const Header = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const isMobile = useMediaQuery('(max-width: 600px)');
  const cartCount = useStore((state) => state.cartCount());
  const { user, ability, logout } = useAuthStore();
  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const { modalOpen, setModalOpen, currentForm, setCurrentForm } = useAuthStore();
  const [cognitoId, setCognitoId] = useState(null);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const session = await fetchAuthSession();
        const attributes = await fetchUserAttributes();
        if (session?.tokens?.idToken) {
          const id = session.tokens.idToken.payload.sub;
          setCognitoId(id);
        }
        const role = attributes['custom:role']?.toLowerCase();
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    getUserInfo();
  }, []);

  const handleSignInClick = () => {
    setModalOpen(true);
    setCurrentForm('login');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      logout();
      setCognitoId(null);
      setUserRole(null);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCloseModal = () => setModalOpen(false);
  const handleMenuOpen = (event) => setMenuAnchor(event.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  // Get ability directly from the ability file
  const userAbility = defineUserAbility(user?.role || 'user');

  // Close Drawer if switching to desktop while open
  useEffect(() => {
    if (!isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [isMobile, drawerOpen]);

  // Drawer content for mobile
  const mobileMenu = (
    <Box
      sx={{
        width: 270,
        height: '100%',
        bgcolor: 'background.paper',
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
      role="presentation"
      onClick={() => setDrawerOpen(false)}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'primary.main',
          color: '#fff',
          px: 2,
          py: 2.5,
          minHeight: 64,
          boxShadow: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            letterSpacing: 1,
            fontSize: '1.35rem',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          Menu
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
        {!cognitoId && (
          <ListItem button onClick={handleSignInClick} sx={{ py: 2 }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}><Person /></ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Sign In</Typography>} />
          </ListItem>
        )}
        {(!cognitoId || (cognitoId && user?.role === 'user')) && (
          <ListItem button onClick={() => setStoreModalOpen(true)} sx={{ py: 2 }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}><Storefront /></ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Change Store</Typography>} />
          </ListItem>
        )}
        <ListItem button onClick={() => navigate(ROUTES.CART)} sx={{ py: 2 }}>
          <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}><ShoppingCart /></ListItemIcon>
          <ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Cart</Typography>} />
        </ListItem>
        {cognitoId && userAbility?.can('view', 'orders') && (
          <ListItem button onClick={() => navigate(ROUTES.ORDERS)} sx={{ py: 2 }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}><ShoppingBag /></ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Orders</Typography>} />
          </ListItem>
        )}
        {cognitoId && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <ListItem button onClick={() => { navigate(ROUTES.PROFILE); }} sx={{ py: 2 }}>
              <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}><Person /></ListItemIcon>
              <ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Profile</Typography>} />
            </ListItem>
            <ListItem button onClick={handleLogout} sx={{ py: 2 }}>
              <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}><Person /></ListItemIcon>
              <ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'error.main' }}>Logout</Typography>} />
            </ListItem>
          </>
        )}
      </List>
      <Divider />
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.95rem' }}>
        &copy; {new Date().getFullYear()} Indimitra
      </Box>
    </Box>
  );

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
            minHeight: { xs: '56px', sm: '64px', md: '70px' },
            px: { xs: 1, sm: 2, md: 4 },
          }}
        >
          {/* Logo */}
          <Logo navigate={navigate} userRole={user?.role} />

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Hamburger for mobile */}
          {isMobile ? (
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            // Desktop actions
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 1, md: 2 },
                flexDirection: { xs: 'row', sm: 'row' },
                position: 'relative',
              }}
            >
            {!cognitoId && (
              <Button
                onClick={handleSignInClick}
                sx={{
                  color: '#2A2F4F',
                  textTransform: 'none',
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                  fontWeight: 500,
                    px: { xs: 1, sm: 2 },
                    py: { xs: 0.5, sm: 1 },
                    minWidth: { xs: 0, sm: 64 },
                  '&:hover': { backgroundColor: 'rgba(42, 47, 79, 0.08)' },
                }}
              >
                Sign In
              </Button>
            )}
            {/* Orders (Desktop) */}
            {!isMobile && cognitoId && userAbility && userAbility.can('view', 'orders') && (
              <Button
                onClick={() => navigate(ROUTES.ORDERS)}
                sx={{
                  color: '#2A2F4F',
                  textTransform: 'none',
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                  fontWeight: 500,
                    px: { xs: 1, sm: 2 },
                    py: { xs: 0.5, sm: 1 },
                    minWidth: { xs: 0, sm: 64 },
                  '&:hover': {
                    backgroundColor: 'rgba(42, 47, 79, 0.08)',
                  },
                }}
              >
                Orders
              </Button>
            )}
            {(!cognitoId || (cognitoId && user?.role === 'user')) && (
              <Button
                variant="outlined"
                  startIcon={<Storefront sx={{ fontSize: { xs: 18, sm: 22 } }} />}
                onClick={() => setStoreModalOpen(true)}
                sx={{
                  color: '#2A2F4F',
                  borderColor: '#2A2F4F',
                  textTransform: 'none',
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                  fontWeight: 500,
                    px: { xs: 1, sm: 2 },
                    py: { xs: 0.5, sm: 1 },
                    minWidth: { xs: 0, sm: 64 },
                    mr: { xs: 0.5, sm: 1 },
                  '&:hover': { backgroundColor: 'rgba(42, 47, 79, 0.08)' },
                }}
              >
                Change Store
              </Button>
            )}
            {user ? (
              userAbility?.can('view', 'cart') && (
                <Tooltip title="Cart">
                  <IconButton
                    onClick={() => navigate(ROUTES.CART)}
                    sx={{
                      background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                      color: 'white',
                        p: { xs: 0.75, sm: 1 },
                      '&:hover': {
                        background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
                      },
                    }}
                  >
                    <Badge
                      badgeContent={cartCount}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#FF6B6B',
                          color: 'white',
                          fontWeight: 'bold',
                            fontSize: { xs: '0.7rem', sm: '0.8rem' },
                            minWidth: { xs: 18, sm: 20 },
                            height: { xs: 18, sm: 20 },
                        },
                      }}
                    >
                        <ShoppingCart sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )
            ) : (
              <Tooltip title="Cart">
                <IconButton
                  onClick={() => navigate(ROUTES.CART)}
                  sx={{
                    background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                    color: 'white',
                      p: { xs: 0.75, sm: 1 },
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
                    },
                  }}
                >
                  <Badge
                    badgeContent={cartCount}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#FF6B6B',
                        color: 'white',
                        fontWeight: 'bold',
                          fontSize: { xs: '0.7rem', sm: '0.8rem' },
                          minWidth: { xs: 18, sm: 20 },
                          height: { xs: 18, sm: 20 },
                      },
                    }}
                  >
                      <ShoppingCart sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
            {cognitoId && (
              <Tooltip title="Profile">
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{
                    background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                    color: 'white',
                      p: { xs: 0.75, sm: 1 },
                      ml: { xs: 0.5, sm: 1 },
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)',
                    },
                  }}
                >
                    <Person sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          )}
        </Toolbar>
      </Box>
      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {mobileMenu}
      </Drawer>

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
        {isMobile && userAbility?.can('view', 'orders') && (
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

      {/* Store Selector Modal */}
      <StoreSelector open={storeModalOpen} onClose={() => setStoreModalOpen(false)} />

      {/* Spacer for fixed header */}
      <Box sx={{ height: { xs: '56px', sm: '64px', md: '70px' } }} />
      <LoginModal
        open={modalOpen}
        onClose={handleCloseModal}
        currentForm={currentForm}
        setCurrentForm={setCurrentForm}
      />
    </>
  );
};

export default Header;
