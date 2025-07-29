import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Inventory as InventoryIcon,
  People as CustomersIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  LocalShipping as DeliveryIcon,
  Payments as PaymentsIcon,
  LocationOn as LocationIcon,
  LocalShipping as PickupIcon,
} from '@mui/icons-material';
import { ROUTES } from '@/config/constants/routes';
import { DrawerContext } from './Layout';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 65;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: ROUTES.STORE_MANAGER },
  { text: 'Orders', icon: <OrdersIcon />, path: ROUTES.STORE_ORDERS },
  { text: 'Delivery Partners', icon: <DeliveryIcon />, path: '/store_manager/delivery-partners' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/store_manager/inventory' },
  { text: 'Delivery Fees', icon: <PaymentsIcon />, path: '/store_manager/delivery-fees' },
  { text: 'Location Codes', icon: <LocationIcon />, path: '/store_manager/location-codes' },
  { text: 'Pickup Addresses', icon: <PickupIcon />, path: '/store_manager/pickup-addresses' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/store_manager/settings' },
];

const SideNav = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { open, setOpen } = React.useContext(DrawerContext);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (path) => {
    navigate(path);
    // No overlay/temporary drawer logic
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open && !isMobile ? 'space-between' : 'center',
          p: 2,
          minHeight: 64,
        }}
      >
        {open && !isMobile && (
          <Typography variant="h6" noWrap component="div">
            Store Manager
          </Typography>
        )}
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        )}
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
              justifyContent: open && !isMobile ? 'initial' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open && !isMobile ? 3 : 'auto',
                justifyContent: 'center',
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} sx={{ opacity: open && !isMobile ? 1 : 0 }} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: isMobile ? COLLAPSED_DRAWER_WIDTH : open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
        flexShrink: 0,
        position: 'fixed',
        top: { xs: '64px', sm: '70px' },
        bottom: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      <Drawer
        variant="persistent"
        open={true}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: isMobile ? COLLAPSED_DRAWER_WIDTH : open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
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
  );
};

export default SideNav;
