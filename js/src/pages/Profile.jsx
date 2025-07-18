import React, { useState, useEffect } from 'react';
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
  Alert,
  Snackbar,
  Alert as MuiAlert,
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
import { useAuthStore, useAddressStore } from '@/store/useStore';
import { fetchAuthSession } from 'aws-amplify/auth';
import AddressAutocomplete from '@/components/AddressAutocomplete/AddressAutocomplete';

const Profile = () => {
  // Get zustand state and functions
  const { userProfile, setUserProfile, fetchUserProfile, isProfileLoading, profileError } =
    useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Function to get latest profile directly from store
  const getLatestProfile = () => useAuthStore.getState().userProfile || null;

  // Local backup state for profile data in case Zustand fails
  const [localUserProfile, setLocalUserProfile] = useState(null);
  const [cognitoId, setCognitoId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const baseUrl = window.location.origin;

  // Use the address store instead of local state
  const {
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    fetchAddresses,
    isLoading: isLoadingAddresses,
    createAddress: createAddressMutation,
    updateAddress: updateAddressMutation,
    deleteAddress: deleteAddressMutation,
  } = useAddressStore();

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  // Get Cognito ID from session
  useEffect(() => {
    const getCognitoIdAndProfile = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          const cognitoId = session.tokens.idToken.payload.sub;
          setCognitoId(cognitoId);
          await fetchUserProfile(cognitoId);
        }
      } catch (error) {
        console.error('Error fetching Cognito ID or profile:', error);
      }
    };

    getCognitoIdAndProfile();
  }, [fetchUserProfile]);

  // Create an effective profile using any available source
  const effectiveProfile = userProfile || localUserProfile;

  // Fetch addresses after profile data is available
  useEffect(() => {
    if (effectiveProfile?.id) {
      fetchAddresses(effectiveProfile.id);
    }
  }, [effectiveProfile?.id, fetchAddresses]);

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setNewAddress(addr.address);
    setIsPrimary(addr.isPrimary);
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = (id) => {
    setAddressToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAddress = async () => {
    try {
      await deleteAddressMutation(addressToDelete);
      setSnackbar({ open: true, message: 'Address deleted successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete address. Please try again.', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleSaveAddress = async () => {
    if (!effectiveProfile?.id) {
      setSnackbar({ open: true, message: 'Could not save address: user information not available', severity: 'error' });
      return;
    }

    setIsSavingAddress(true);
    try {
      // Only allow saving if a valid address is selected
      if (!isValidAddress) {
        return;
      }

      if (!editingAddress) {
        if (addresses.length === 0) {
          await createAddressMutation(newAddress, effectiveProfile.id, true);
          setSnackbar({ open: true, message: 'Address added successfully', severity: 'success' });
        } else {
          if (isPrimary) {
            for (const addr of addresses) {
              if (addr.isPrimary) {
                await updateAddressMutation(addr.id, addr.address, false);
              }
            }
            await createAddressMutation(newAddress, effectiveProfile.id, true);
            setSnackbar({ open: true, message: 'Address added as primary', severity: 'success' });
          } else {
            await createAddressMutation(newAddress, effectiveProfile.id, false);
            setSnackbar({ open: true, message: 'Address added as secondary', severity: 'success' });
          }
        }
      } else {
        if (isPrimary) {
          for (const addr of addresses) {
            if (addr.id !== editingAddress.id && addr.isPrimary) {
              await updateAddressMutation(addr.id, addr.address, false);
            }
          }
          await updateAddressMutation(editingAddress.id, newAddress, true);
          setSnackbar({ open: true, message: 'Address updated as primary', severity: 'success' });
        } else {
          const isOnlyPrimary = editingAddress.isPrimary && addresses.filter(a => a.isPrimary).length === 1;
          if (isOnlyPrimary) {
            await updateAddressMutation(editingAddress.id, newAddress, true);
            setSnackbar({ open: true, message: 'At least one address must be primary', severity: 'warning' });
          } else {
            await updateAddressMutation(editingAddress.id, newAddress, false);
            setSnackbar({ open: true, message: 'Address updated as secondary', severity: 'success' });
          }
        }
      }
      await fetchAddresses(effectiveProfile.id);
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setNewAddress('');
      setIsPrimary(false);
      setIsValidAddress(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save address. Please try again.', severity: 'error' });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
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

  if (isProfileLoading) {
    return (
      <Container>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading profile...</Typography>
        </Box>
      </Container>
    );
  }

  if (profileError) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Error loading profile: {profileError}
        </Alert>
        <Button variant="contained" onClick={() => fetchUserProfile()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!userProfile) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>
          No profile data available. Please try again.
        </Alert>
        <Button 
          variant="contained" 
          onClick={async () => {
            try {
              const session = await fetchAuthSession();
              if (session?.tokens?.idToken) {
                const cognitoId = session.tokens.idToken.payload.sub;
                await fetchUserProfile(cognitoId);
              }
            } catch (error) {
              console.error('Error loading profile:', error);
            }
          }} 
          sx={{ mt: 2 }}
        >
          Load Profile
        </Button>
      </Container>
    );
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

  const renderAddresses = () => {
    // Sort addresses: primary first, then others
    const sortedAddresses = [...addresses].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    return (
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
          {isLoadingAddresses ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : sortedAddresses.length > 0 ? (
            <Grid container spacing={2}>
              {sortedAddresses.map((addr) => (
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
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              You don't have any addresses yet. Add one to get started!
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

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
            <AddressAutocomplete
              value={newAddress}
              onChange={setNewAddress}
              onValidAddress={setIsValidAddress}
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
          <Button onClick={() => {
            setAddressDialogOpen(false);
            setNewAddress('');
            setIsValidAddress(false);
          }}>Cancel</Button>
          <Button
            onClick={handleSaveAddress}
            variant="contained"
            disabled={!newAddress || isSavingAddress || !isValidAddress}
          >
            {isSavingAddress ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Address</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this address? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteAddress} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
