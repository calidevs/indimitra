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
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ContentCopy,
  Edit,
  Delete,
  Add,
  Person,
  LocationOn,
  Settings,
  Share,
  Logout,
  Email,
  Phone,
  Badge,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const referralLink = `${baseUrl}/signup?referredby=${userProfile?.referralId}`;

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

  const renderProfileInfo = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2.5rem',
              mr: 3,
            }}
          >
            {userProfile?.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" gutterBottom>
              {userProfile?.firstName} {userProfile?.lastName}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Email sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography color="text.secondary">{userProfile?.email}</Typography>
              </Box>
              {userProfile?.mobile && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography color="text.secondary">{userProfile.mobile}</Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Referral Program
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            value={referralLink}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Tooltip title={copySuccess ? 'Copied!' : 'Copy referral link'}>
                  <IconButton onClick={copyToClipboard}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />
          <Button variant="contained" startIcon={<Share />} onClick={copyToClipboard}>
            Share
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderAddresses = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">My Addresses</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddressDialogOpen(true)}
          >
            Add Address
          </Button>
        </Box>
        <Grid container spacing={2}>
          {addresses.map((addr) => (
            <Grid item xs={12} sm={6} key={addr.id}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  position: 'relative',
                  border: addr.isPrimary ? '2px solid' : '1px solid',
                  borderColor: addr.isPrimary ? 'primary.main' : 'divider',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" color="primary">
                    {addr.isPrimary ? 'Primary Address' : 'Secondary Address'}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleEditAddress(addr)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteAddress(addr.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2">{addr.address}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSettings = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Account Settings
        </Typography>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Notification Preferences
            </Typography>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Email notifications for orders"
            />
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="SMS notifications for delivery updates"
            />
          </Box>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Privacy Settings
            </Typography>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Share order history with delivery partners"
            />
          </Box>
          <Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ mt: 2 }}
            >
              Logout
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Side Navigation */}
        <Grid item xs={12} md={3}>
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6">My Account</Typography>
            </Box>
            <List component="nav" sx={{ pt: 0 }}>
              <ListItemButton
                selected={activeTab === 0}
                onClick={() => setActiveTab(0)}
                sx={{
                  borderRadius: '0 0 0 0',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <ListItemIcon>
                  <Person color={activeTab === 0 ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
              <ListItemButton
                selected={activeTab === 1}
                onClick={() => setActiveTab(1)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <ListItemIcon>
                  <LocationOn color={activeTab === 1 ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText primary="Addresses" />
              </ListItemButton>
              <ListItemButton
                selected={activeTab === 2}
                onClick={() => setActiveTab(2)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <ListItemIcon>
                  <Settings color={activeTab === 2 ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </List>
          </Paper>
        </Grid>

        {/* Content Area */}
        <Grid item xs={12} md={9}>
          <Box sx={{ height: '100%' }}>
            {activeTab === 0 && renderProfileInfo()}
            {activeTab === 1 && renderAddresses()}
            {activeTab === 2 && renderSettings()}
          </Box>
        </Grid>
      </Grid>

      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} fullWidth>
        <DialogTitle>{editingAddress ? 'Edit Address' : 'Add Address'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={3}
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
              }
              label="Set as Primary Address"
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
