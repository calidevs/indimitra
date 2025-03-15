import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography, Paper, CircularProgress } from '@mui/material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { useAuthStore } from '@/store/useStore';

const Profile = () => {
  const { user } = useAuthStore(); // Get logged-in user details

  const { data, isLoading, error } = useQuery({
    queryKey: ['getUserProfile', user?.id],
    queryFn: () => fetchGraphQL(GET_USER_PROFILE, { userId: user.id }),
    enabled: !!user?.id, // Only fetch if user is authenticated
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
