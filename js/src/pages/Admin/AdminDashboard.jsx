import React, { useState } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ShoppingCart as OrdersIcon,
  Inventory as InventoryIcon,
  Payment as PaymentIcon,
  Storefront as StorefrontIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Header from '@/components/layout/Header';

// Import the page components
import UserManagement from './UserManagement';
import StoreManagement from './StoreManagement';
import ProductManagement from './ProductManagement';
import Orders from './Orders';
import PaymentOnboarding from './PaymentOnboarding';
import Dashboard from './Dashboard';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 65;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Stores', icon: <StoreIcon />, path: '/admin/stores' },
  { text: 'Product Management', icon: <InventoryIcon />, path: '/admin/products' },
  { text: 'Orders', icon: <OrdersIcon />, path: '/admin/orders' },
  { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Payment Onboarding', icon: <PaymentIcon />, path: '/admin/payment-onboarding' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
];

const AdminDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          minHeight: 64,
        }}
      >
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" noWrap component="div">
              Admin Panel
            </Typography>
          </Box>
        )}
        <IconButton onClick={handleSidebarToggle}>
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                  opacity: 0.9,
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
                color: location.pathname === item.path ? 'white' : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
          </ListItem>
        ))}
        <Divider sx={{ my: 2 }} />
        <ListItem
          button
          onClick={() => handleNavigation('/logout')}
          sx={{
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 3 : 'auto',
              justifyContent: 'center',
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ opacity: open ? 1 : 0 }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header />
      <Box
        component="nav"
        sx={{
          width: { sm: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH },
          flexShrink: { sm: 0 },
          position: 'fixed',
          top: { xs: '64px', sm: '70px' },
          bottom: 0,
          left: 0,
          zIndex: 1000,
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
              top: { xs: '64px', sm: '70px' },
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px)` },
          ml: { sm: `${open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px` },
          mt: { xs: '64px', sm: '70px' },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users/*" element={<UserManagement />} />
          <Route path="stores/*" element={<StoreManagement />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="orders" element={<Orders />} />
          <Route path="payment-onboarding" element={<PaymentOnboarding />} />
          {/* Add more routes as needed */}
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
