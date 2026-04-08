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
import {
  ShoppingCart,
  Person,
  Storefront,
  ShoppingBag,
  KeyboardArrowDown,
} from '@mui/icons-material';
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
import { ROLES } from '@/config/constants/roles';

// Clickable store-switcher pill (multi-store). Serves as both the brand
// anchor (current store) and the store switcher trigger. Hidden for staff
// roles that don't shop (admin / store_manager / delivery_agent).
const StoreSwitcher = ({ storeName, canSwitch, onSwitch }) => {
  const label = storeName || 'Select a store';

  const baseSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
    maxWidth: { xs: 200, sm: 320, md: 'none' },
    px: { xs: 1.25, sm: 1.75 },
    py: 0.75,
    borderRadius: 9999,
    border: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.paper',
    color: 'text.primary',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: { xs: '0.92rem', sm: '1rem' },
    letterSpacing: 0,
    transition: 'border-color 120ms ease, background-color 120ms ease',
  };

  // Non-clickable variant (staff who can't switch)
  if (!canSwitch) {
    return (
      <Box sx={baseSx}>
        <Storefront sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 'inherit',
            color: storeName ? 'text.primary' : 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  }

  return (
    <Button
      onClick={onSwitch}
      disableRipple={false}
      sx={{
        ...baseSx,
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'text.primary',
          backgroundColor: 'action.hover',
        },
      }}
    >
      <Storefront sx={{ fontSize: 18, color: 'text.secondary' }} />
      <Typography
        component="span"
        sx={{
          fontWeight: 600,
          fontSize: 'inherit',
          color: storeName ? 'text.primary' : 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
      <KeyboardArrowDown sx={{ fontSize: 18, color: 'text.secondary', ml: -0.25 }} />
    </Button>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const isMobile = useMediaQuery('(max-width: 600px)');
  const cartCount = useStore((state) => state.cartCount());
  const selectedStore = useStore((state) => state.selectedStore);
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
        // User not authenticated — clear local state
        setCognitoId(null);
        setUserRole(null);
      }
    };

    getUserInfo();
  }, [user]);

  const handleSignInClick = () => {
    setModalOpen(true);
    setCurrentForm('login');
  };

  const handleHomeClick = async () => {
    let roleToUse = userRole;
    if (!roleToUse) {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          roleToUse = session.tokens.idToken.payload['custom:role']?.toLowerCase();
        }
      } catch (error) {
        /* not signed in — fall through to '/' */
      }
    }
    navigate(roleToUse ? `/${roleToUse}` : '/');
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
        <ListItem button onClick={handleHomeClick} sx={{ py: 2 }}>
          <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
            <Storefront />
          </ListItemIcon>
          <ListItemText
            primary={<Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Home</Typography>}
          />
        </ListItem>
        {!cognitoId && (
          <ListItem button onClick={handleSignInClick} sx={{ py: 2 }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
              <Person />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Sign In</Typography>
              }
            />
          </ListItem>
        )}
        {/* Only show Change Store for regular users or guests, not for admin/store_manager/delivery_agent */}
        {userRole !== ROLES.ADMIN &&
          userRole !== ROLES.STORE_MANAGER &&
          userRole !== ROLES.DELIVERY_AGENT && (
            <ListItem button onClick={() => setStoreModalOpen(true)} sx={{ py: 2 }}>
              <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                <Storefront />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                    {selectedStore ? 'Change Store' : 'Select Store'}
                  </Typography>
                }
              />
            </ListItem>
          )}
        <ListItem button onClick={() => navigate(ROUTES.CART)} sx={{ py: 2 }}>
          <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
            <ShoppingCart />
          </ListItemIcon>
          <ListItemText
            primary={<Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Cart</Typography>}
          />
        </ListItem>
        {cognitoId && userAbility?.can('view', 'orders') && (
          <ListItem button onClick={() => navigate(ROUTES.ORDERS)} sx={{ py: 2 }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
              <ShoppingBag />
            </ListItemIcon>
            <ListItemText
              primary={<Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Orders</Typography>}
            />
          </ListItem>
        )}
        {cognitoId && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <ListItem
              button
              onClick={() => {
                navigate(ROUTES.PROFILE);
              }}
              sx={{ py: 2 }}
            >
              <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                <Person />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Profile</Typography>
                }
              />
            </ListItem>
            <ListItem button onClick={handleLogout} sx={{ py: 2 }}>
              <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
                <Person />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'error.main' }}>
                    Logout
                  </Typography>
                }
              />
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
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: '56px', sm: '64px', md: '68px' },
            px: { xs: 1.5, sm: 3, md: 4 },
            gap: { xs: 1, sm: 2 },
          }}
        >
          {/* Store switcher (brand anchor + switcher for multi-store) */}
          <StoreSwitcher
            storeName={selectedStore?.name}
            canSwitch={
              userRole !== ROLES.ADMIN &&
              userRole !== ROLES.STORE_MANAGER &&
              userRole !== ROLES.DELIVERY_AGENT
            }
            onSwitch={() => setStoreModalOpen(true)}
          />

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Hamburger for mobile */}
          {isMobile ? (
            <IconButton
              edge="end"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ ml: 1, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            // Desktop actions
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { sm: 0.5, md: 1 },
              }}
            >
              <Button
                onClick={handleHomeClick}
                sx={{
                  color: 'text.primary',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  px: 2,
                  py: 1,
                  borderRadius: 1.5,
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                Home
              </Button>

              {!cognitoId && (
                <Button
                  onClick={handleSignInClick}
                  sx={{
                    color: 'text.primary',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    px: 2,
                    py: 1,
                    borderRadius: 1.5,
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  Sign In
                </Button>
              )}

              {/* Orders (Desktop) */}
              {cognitoId && userAbility && userAbility.can('view', 'orders') && (
                <Button
                  onClick={() => navigate(ROUTES.ORDERS)}
                  sx={{
                    color: 'text.primary',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    px: 2,
                    py: 1,
                    borderRadius: 1.5,
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  Orders
                </Button>
              )}

              {/* Cart (ghost icon with neutral badge) */}
              {(!user || userAbility?.can('view', 'cart')) && (
                <Tooltip title="Cart">
                  <IconButton
                    onClick={() => navigate(ROUTES.CART)}
                    sx={{
                      color: 'text.primary',
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <Badge
                      badgeContent={cartCount}
                      color="primary"
                      overlap="circular"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          minWidth: 18,
                          height: 18,
                          padding: '0 5px',
                        },
                      }}
                    >
                      <ShoppingCart sx={{ fontSize: 22 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}

              {/* Profile (ghost) */}
              {cognitoId && (
                <Tooltip title="Profile">
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{
                      color: 'text.primary',
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <Person sx={{ fontSize: 22 }} />
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
      <Box sx={{ height: { xs: '56px', sm: '64px', md: '68px' } }} />
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
