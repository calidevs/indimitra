import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import { fetchAuthSession } from 'aws-amplify/auth';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_USER_ORDERS } from '@/queries/operations';

const Orders = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          setUserId(session.tokens.idToken.payload.sub);
        } else {
          console.warn('No valid session tokens found.');
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    getUserId();
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['userOrders', userId],
    queryFn: () => fetchGraphQL(GET_USER_ORDERS, { userId }),
    enabled: !!userId, // Only run query when userId is available
  });

  if (isLoading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (error) return <Typography color="error">Error fetching orders!</Typography>;

  const orders = data?.getOrdersByUser || [];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>

      {orders.length === 0 ? (
        <Typography>No orders found!</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Delivery Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.address}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={
                        order.status === 'COMPLETE'
                          ? 'success'
                          : order.status === 'PENDING'
                            ? 'warning'
                            : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default Orders;
