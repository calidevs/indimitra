import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Chip,
  Divider,
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/useStore';
import Layout from '@/components/StoreManager/Layout';
import fetchGraphQL from '@/config/graphql/graphqlService';
import graphqlService from '@/config/graphql/graphqlService';
import {
  GET_ORDERS_BY_STORE,
  GET_USER_PROFILE,
} from '@/queries/operations';
import { ORDER_STATUSES } from '@/config/constants/constants';
import { fetchUserAttributes } from 'aws-amplify/auth';

// Define the GraphQL query for getting drivers by store
const GET_DRIVERS_BY_STORE = `
  query GetStoreDrivers($storeId: Int!) {
    getStoreDrivers(storeId: $storeId) {
      id
      userId
      driver {
      id
      email
      mobile
      active
      referralId
      referredBy
    }
    }
  }
`;

const DRIVER_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const DeliveryPartners = () => {
  const { userProfile, setUserProfile } = useAuthStore();
  const [cognitoId, setCognitoId] = useState('');
  const [expandedDriver, setExpandedDriver] = useState(null);
  const [filters, setFilters] = useState({
    driverStatus: '',
    orderStatus: '',
    dateRange: 'all', // all, today, week, month
  });
  const [shouldFetch, setShouldFetch] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Cognito ID on component mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
        setCognitoId(userAttributes.sub);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    getUserInfo();
  }, []);

  // Fetch user profile using Cognito ID
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['getUserProfile', cognitoId],
    queryFn: async () => {
      const response = await graphqlService(GET_USER_PROFILE, { userId: cognitoId });
      if (response?.getUserProfile) {
        setUserProfile(response.getUserProfile);
      }
      return response;
    },
    enabled: !!cognitoId,
  });

  // Extract store ID from user profile
  const storeId = profileData?.getUserProfile?.stores?.edges?.[0]?.node?.id;

  // Fetch drivers for the store
  const {
    data: driversData,
    isLoading: driversLoading,
    error: driversError,
    refetch: refetchDrivers,
  } = useQuery({
    queryKey: ['driversByStore', storeId],
    queryFn: () => fetchGraphQL(GET_DRIVERS_BY_STORE, { storeId }),
    enabled: !!storeId && shouldFetch,
  });

  // Fetch all orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['storeOrders', storeId],
    queryFn: async () => {
      const result = await graphqlService(GET_ORDERS_BY_STORE, { storeId });
      return result.getOrdersByStore || [];
    },
    enabled: !!storeId,
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFetchData = () => {
    setShouldFetch(true);
    refetchDrivers();
    refetchOrders();
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      PROCESSING: 'info',
      READY_FOR_DELIVERY: 'primary',
      OUT_FOR_DELIVERY: 'secondary',
      DELIVERED: 'success',
      CANCELLED: 'error',
      ACTIVE: 'success',
      INACTIVE: 'error',
      BUSY: 'warning',
    };
    return colors[status] || 'default';
  };

  const filterOrders = (orders, driverId) => {
    if (!orders) return [];

    let filtered = orders.filter((order) => order?.delivery?.driverId === driverId);

    if (filters.orderStatus) {
      filtered = filtered.filter((order) => order.status === filters.orderStatus);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);

        switch (filters.dateRange) {
          case 'today':
            return orderDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filterDrivers = (drivers) => {
    if (!drivers) return [];

    if (filters.driverStatus) {
      return drivers.filter((driver) => driver.status === filters.driverStatus);
    }

    return drivers;
  };

  const isLoading = driversLoading || ordersLoading || profileLoading;
  const hasError = driversError || ordersError || error;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Delivery Partners
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {profileLoading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loading user profile...
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Driver Status"
                value={filters.driverStatus}
                onChange={(e) => handleFilterChange('driverStatus', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {DRIVER_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Order Status"
                value={filters.orderStatus}
                onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {ORDER_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Date Range"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={handleFetchData}
                disabled={!storeId || profileLoading}
              >
                {profileLoading ? 'Loading Profile...' : 'Get Data'}
              </Button>
              {!storeId && !profileLoading && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Store ID not available. Please check if you have a store assigned.
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : hasError ? (
          <Alert severity="error">
            {driversError?.message ||
              ordersError?.message ||
              'An error occurred while fetching data'}
          </Alert>
        ) : !shouldFetch ? (
          <Alert severity="info">
            Click the "Get Data" button to fetch delivery partners and their orders.
          </Alert>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Delivery Partners ({filterDrivers(driversData?.getStoreDrivers || []).length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Driver ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Orders</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterDrivers(driversData?.getStoreDrivers || []).map((driver) => (
                    <React.Fragment key={driver?.userId}>
                      <TableRow>
                        <TableCell>{driver?.userId}</TableCell>
                        <TableCell>{driver.name}</TableCell>
                        <TableCell>{driver?.driver?.email}</TableCell>
                        <TableCell>{driver?.driver?.mobile}</TableCell>
                        <TableCell>
                          <Chip
                            label={driver?.driver?.active ? 'Active' : 'Inactive'}
                            color={getStatusColor(driver?.driver?.active)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {filterOrders(ordersData || [], driver?.userId).length}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setExpandedDriver(expandedDriver === driver?.userId ? null : driver?.userId)
                            }
                          >
                            {expandedDriver === driver?.userId ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {expandedDriver === driver?.userId && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <Box sx={{ p: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Orders for {driver.name}:
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Order ID</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {filterOrders(ordersData || [], driver?.userId).length >
                                  0 ? (
                                    filterOrders(ordersData || [], driver?.userId).map(
                                      (order) => (
                                        <TableRow key={order.id}>
                                          <TableCell>{order.id}</TableCell>
                                          <TableCell>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell>{order.user?.name}</TableCell>
                                          <TableCell>₹{order.totalAmount}</TableCell>
                                          <TableCell>
                                            <Chip
                                              label={
                                                ORDER_STATUSES.find((s) => s.value === order.status)
                                                  ?.label || order.status
                                              }
                                              color={getStatusColor(order.status)}
                                              size="small"
                                            />
                                          </TableCell>
                                        </TableRow>
                                      )
                                    )
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} align="center">
                                        No orders found for this driver with the current filters.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                  {filterDrivers(driversData?.getStoreDrivers || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No delivery partners found with the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </Layout>
  );
};

export default DeliveryPartners;
