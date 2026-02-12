import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { ErrorHandler } from '@/components';
import {
  People as PeopleIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
  ShoppingCart as OrdersIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_DASHBOARD_STATS, GET_ORDER_STATS, GET_ALL_STORES } from '@/queries/operations';

// GraphQL query for Square connection status
const ALL_STORES_SQUARE_STATUS = `
  query AllStoresSquareStatus {
    allStoresSquareStatus {
      storeId
      storeName
      isConnected
    }
  }
`;

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

  // Fetch dashboard statistics
  const {
    data: dashboardStats,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      return await fetchGraphQL(GET_DASHBOARD_STATS);
    },
  });

  // Fetch order statistics
  const {
    data: orderStats,
    isLoading: orderLoading,
    error: orderError,
  } = useQuery({
    queryKey: ['orderStats'],
    queryFn: async () => {
      return await fetchGraphQL(GET_ORDER_STATS);
    },
  });

  // Fetch store count
  const {
    data: storesData,
    isLoading: storesLoading,
    error: storesError,
  } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      return await fetchGraphQL(GET_ALL_STORES);
    },
  });

  // Fetch Square connection status
  const {
    data: squareStatusData,
    isLoading: squareStatusLoading,
    error: squareStatusError,
  } = useQuery({
    queryKey: ['allStoresSquareStatus'],
    queryFn: async () => {
      return await fetchGraphQL(ALL_STORES_SQUARE_STATUS);
    },
  });

  // Extract data
  const stats = dashboardStats?.getDashboardStats || {};
  const orders = orderStats?.getOrderStats || {};
  const stores = storesData?.stores || [];
  const squareStatuses = squareStatusData?.allStoresSquareStatus || [];

  // Calculate totals
  const totalUsers = stats.totalUsers || 0;
  const totalStores = stores.length || 0;
  const activeDrivers = stats.deliveryAgents || 0;
  const totalOrders = orders.totalOrders || 0;
  const connectedStores = squareStatuses.filter(s => s.isConnected).length;
  const totalStoresForSquare = squareStatuses.length || totalStores;
  const codEnabledCount = stores.filter(s => s.codEnabled).length;

  // Loading state
  if (dashboardLoading || orderLoading || storesLoading || squareStatusLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (dashboardError || orderError || storesError || squareStatusError) {
    const errorMessage =
      dashboardError?.message ||
      orderError?.message ||
      storesError?.message ||
      squareStatusError?.message ||
      'Error loading dashboard data. Please try again later.';

    return (
      <Box sx={{ p: isMobile ? 2 : 3 }}>
        <ErrorHandler error={errorMessage} title="Dashboard Error" severity="error" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={totalUsers.toLocaleString()}
            icon={<PeopleIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Stores"
            value={totalStores.toLocaleString()}
            icon={<StoreIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Square Connected"
            value={`${connectedStores} / ${totalStoresForSquare}`}
            icon={<PaymentIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cash on Delivery"
            value={`${codEnabledCount} / ${totalStores}`}
            icon={<PaymentIcon />}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Drivers"
              value={activeDrivers.toLocaleString()}
              icon={<ShippingIcon />}
              color={theme.palette.info.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Orders"
              value={totalOrders.toLocaleString()}
              icon={<OrdersIcon />}
              color={theme.palette.warning.main}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Additional Statistics */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Detailed Statistics
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Users"
              value={(stats.activeUsers || 0).toLocaleString()}
              icon={<PeopleIcon />}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Recent Orders (30 days)"
              value={(orders.recentOrders || 0).toLocaleString()}
              icon={<OrdersIcon />}
              color={theme.palette.info.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Delivery Orders"
              value={(orders.ordersByType?.DELIVERY || 0).toLocaleString()}
              icon={<ShippingIcon />}
              color={theme.palette.secondary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pickup Orders"
              value={(orders.ordersByType?.PICKUP || 0).toLocaleString()}
              icon={<StoreIcon />}
              color={theme.palette.warning.main}
            />
          </Grid>
        </Grid>
      </Box>

      {/* User Type Breakdown */}
      {stats.usersByType && Object.keys(stats.usersByType).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            User Type Breakdown
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(stats.usersByType).map(([userType, count]) => (
              <Grid item xs={12} sm={6} md={3} key={userType}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase()}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {count.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
