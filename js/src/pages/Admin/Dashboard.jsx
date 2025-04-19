import React from 'react';
import { Box, Grid, Card, CardContent, Typography, useTheme, useMediaQuery } from '@mui/material';
import {
  People as PeopleIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  ShoppingCart as OrdersIcon,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: '50%',
              p: 1,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { sx: { color: color } })}
          </Box>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="div" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Mock data - replace with actual data from your API
  const stats = {
    totalUsers: '1,234',
    totalStores: '56',
    activeDrivers: '89',
    totalOrders: '2,345',
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Stores"
            value={stats.totalStores}
            icon={<StoreIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Drivers"
            value={stats.activeDrivers}
            icon={<ShippingIcon />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<OrdersIcon />}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Add more dashboard content here */}
    </Box>
  );
};

export default Dashboard;
