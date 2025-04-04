import React, { useState, useEffect, useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import fetchGraphQL from '@/config/graphql/graphqlService';
import {
  GET_ADDRESSES_BY_USER,
  CREATE_ADDRESS,
  UPDATE_ADDRESS,
  DELETE_ADDRESS,
  GET_USER_PROFILE,
} from '../queries/operations';
import { useAuthStore } from '@/store/useStore';
import { fetchAuthSession } from 'aws-amplify/auth';

const Profile = () => {
  // Get zustand state and functions
  const { userProfile, setUserProfile } = useAuthStore();

  // Function to get latest profile directly from store
  const getLatestProfile = () => useAuthStore.getState().userProfile || null;

  // Local backup state for profile data in case Zustand fails
  const [localUserProfile, setLocalUserProfile] = useState(null);

  const [cognitoId, setCognitoId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const baseUrl = window.location.origin;

  const [addresses, setAddresses] = useState([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // Get Cognito ID from session
  useEffect(() => {
    const getCognitoId = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          setCognitoId(session.tokens.idToken.payload.sub);
        }
      } catch (error) {
        console.error('Error fetching Cognito ID:', error);
      }
    };

    getCognitoId();
  }, []);

  // Fetch user profile with Cognito ID and store in both Zustand and local state
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['getUserProfile', cognitoId],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_USER_PROFILE, { userId: cognitoId });

      // Important: Set profile data immediately when we get it
      if (response?.getUserProfile) {
        setLocalUserProfile(response.getUserProfile);
        setUserProfile(response.getUserProfile);
      }

      return response;
    },
    enabled: !!cognitoId,
    onSuccess: (data) => {
      if (data?.getUserProfile) {
        // Set in Zustand again to be sure
        setUserProfile(data.getUserProfile);

        // Force re-render after a small delay
        setTimeout(() => {
          forceUpdate();
        }, 200);
      } else {
        console.warn('No profile data found in API response');
      }
    },
    onError: (error) => {
      console.error('Error in profile query:', error);
    },
  });

  // useEffect to grab profile data directly from the query result
  useEffect(() => {
    if (profileData?.getUserProfile && !userProfile) {
      setUserProfile(profileData.getUserProfile);
      setLocalUserProfile(profileData.getUserProfile);
    }
  }, [profileData, userProfile, setUserProfile]);

  // Create an effective profile using any available source,
  // with preference for direct store access, then hook, then local state, then API
  const directStoreProfile = getLatestProfile();
  const effectiveProfile = directStoreProfile;

  // Fetch addresses after profile data is available
  useEffect(() => {
    const fetchAddresses = async () => {
      if (effectiveProfile?.id) {
        try {
          const numericId = parseInt(effectiveProfile.id);
          console.log('Fetching addresses with user ID:', numericId);
          const res = await fetchGraphQL(GET_ADDRESSES_BY_USER, {
            userId: numericId, // Always use numeric ID
          });
          setAddresses(res?.getAddressesByUser || []);
        } catch (error) {
          console.error('Error fetching addresses:', error);
        }
      }
    };

    fetchAddresses();
  }, [effectiveProfile?.id]);

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setNewAddress(addr.address);
    setIsPrimary(addr.isPrimary);
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      await fetchGraphQL(DELETE_ADDRESS, { addressId: id });

      // Refetch addresses after deletion
      if (effectiveProfile?.id) {
        const numericId = parseInt(effectiveProfile.id);
        const res = await fetchGraphQL(GET_ADDRESSES_BY_USER, { userId: numericId });
        setAddresses(res?.getAddressesByUser || []);
      }
    }
  };

  const handleSaveAddress = async () => {
    if (!effectiveProfile?.id) {
      alert('Could not save address: user information not available');
      return;
    }

    try {
      const numericId = parseInt(effectiveProfile.id);

      if (editingAddress) {
        await fetchGraphQL(UPDATE_ADDRESS, {
          addressId: parseInt(editingAddress.id),
          address: newAddress,
          isPrimary,
        });
      } else {
        await fetchGraphQL(CREATE_ADDRESS, {
          address: newAddress,
          userId: numericId,
          isPrimary,
        });
      }

      setAddressDialogOpen(false);
      setEditingAddress(null);
      setNewAddress('');
      setIsPrimary(false);

      // Refetch addresses after creating/updating
      const res = await fetchGraphQL(GET_ADDRESSES_BY_USER, { userId: numericId });
      setAddresses(res?.getAddressesByUser || []);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  const referralLink = `${baseUrl}/signup?referredby=${effectiveProfile?.referralId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  if (profileLoading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (profileError) {
    return <Typography color="error">Error fetching profile data</Typography>;
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 3, mt: 5, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          User Profile
        </Typography>
        {effectiveProfile ? (
          <>
            <Typography>
              <strong>Name:</strong> {effectiveProfile.firstName} {effectiveProfile.lastName}
            </Typography>
            <Typography>
              <strong>Email:</strong> {effectiveProfile.email}
            </Typography>
            <Typography>
              <strong>Mobile:</strong> {effectiveProfile.mobile || 'N/A'}
            </Typography>
            <Typography>
              <strong>Status:</strong> {effectiveProfile.active ? 'Active' : 'Inactive'}
            </Typography>
            <Typography>
              <strong>Role:</strong> {effectiveProfile.type}
            </Typography>
            <Typography>
              <strong>User ID:</strong> {effectiveProfile.id}
            </Typography>
            <Typography>
              <strong>Cognito ID:</strong> {effectiveProfile.cognitoId || cognitoId}
            </Typography>
            <Typography>
              <strong>Data Source:</strong>{' '}
              {userProfile ? 'Zustand Store' : localUserProfile ? 'Local State' : 'API Response'}
            </Typography>

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
          </>
        ) : (
          <Typography>No profile data available</Typography>
        )}

        {/* Address Section */}
        <Typography variant="h6" sx={{ mt: 4 }}>
          Addresses
        </Typography>
        {!effectiveProfile?.id ? (
          <CircularProgress size={20} sx={{ mt: 1 }} />
        ) : addresses.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            No addresses found.
          </Typography>
        ) : (
          addresses.map((addr) => (
            <Paper
              key={addr.id}
              sx={{ p: 2, mt: 1, display: 'flex', justifyContent: 'space-between' }}
            >
              <div>
                <Typography>{addr.address}</Typography>
                <Typography variant="caption" color={addr.isPrimary ? 'primary' : 'textSecondary'}>
                  {addr.isPrimary ? 'Primary Address' : ''}
                </Typography>
              </div>
              <div>
                <Button size="small" onClick={() => handleEditAddress(addr)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => handleDeleteAddress(addr.id)}>
                  Delete
                </Button>
              </div>
            </Paper>
          ))
        )}

        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => setAddressDialogOpen(true)}
          disabled={!effectiveProfile?.id}
        >
          Add Address
        </Button>
      </Paper>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} fullWidth>
        <DialogTitle>{editingAddress ? 'Edit Address' : 'Add Address'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Address"
              fullWidth
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
              }
              label="Set as Primary"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAddress} variant="contained" disabled={!newAddress}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
