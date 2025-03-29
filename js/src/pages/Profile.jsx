import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_USER_PROFILE } from '../queries/operations';
import { useAuthStore } from '@/store/useStore';
import { fetchAuthSession } from 'aws-amplify/auth';

const Profile = () => {
  const { user } = useAuthStore(); // Get logged-in user details
  const [userId, setUserId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const baseUrl = window.location.origin; // Get the base URL dynamically

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
  const referralLink = `${baseUrl}/signup?referredby=${profile?.referralId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset success message
    } catch (err) {
      console.error('Failed to copy referral link:', err);
    }
  };

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

        {/* Copyable Referral Link */}
        <Typography sx={{ mt: 2, mb: 1 }}>
          <strong>Referral Link:</strong>
        </Typography>
        <TextField
          fullWidth
          value={referralLink}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Tooltip title={copySuccess ? 'Copied!' : 'Copy referral link'}>
                <IconButton onClick={copyToClipboard}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            ),
          }}
        />
      </Paper>
    </Container>
  );
};

export default Profile;
