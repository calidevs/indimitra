import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography, Paper, CircularProgress } from '@mui/material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_USER_PROFILE } from '../queries/operations';
import { useAuthStore } from '@/store/useStore';
import { fetchAuthSession } from 'aws-amplify/auth';

const Profile = () => {
  const { user } = useAuthStore(); // Get logged-in user details
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
    queryKey: ['getUserProfile', userId],
    queryFn: () => fetchGraphQL(GET_USER_PROFILE, { userId: userId }),
    enabled: !!userId, // Only fetch if user is authenticated
  });

  if (isLoading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return <Typography color="error">Error fetching profile data</Typography>;
  }

  const profile = data?.getUserProfile;

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 3, mt: 5, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          User Profile
        </Typography>
        <Typography>
          <strong>Name:</strong> {profile?.firstName} {profile?.lastName}
        </Typography>
        <Typography>
          <strong>Email:</strong> {profile?.email}
        </Typography>
        <Typography>
          <strong>Mobile:</strong> {profile?.mobile || 'N/A'}
        </Typography>
        <Typography>
          <strong>Status:</strong> {profile?.active ? 'Active' : 'Inactive'}
        </Typography>
        <Typography>
          <strong>Role:</strong> {profile?.type}
        </Typography>
        <Typography>
          <strong>Referral ID:</strong> {profile?.referralId}
        </Typography>
        <Typography>
          <strong>Referred By:</strong> {profile?.referredBy || 'N/A'}
        </Typography>
      </Paper>
    </Container>
  );
};

export default Profile;
