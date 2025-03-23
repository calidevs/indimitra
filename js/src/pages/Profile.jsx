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
  const { user } = useAuthStore();
  const [userId, setUserId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const baseUrl = window.location.origin;

  const [addresses, setAddresses] = useState([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

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
    queryFn: () => fetchGraphQL(GET_USER_PROFILE, { userId }),
    enabled: !!userId,
  });

  const fetchAddresses = async () => {
    const res = await fetchGraphQL(GET_ADDRESSES_BY_USER, { userId });
    setAddresses(res?.getAddressesByUser || []);
  };

  useEffect(() => {
    if (userId) {
      fetchAddresses();
    }
  }, [userId]);

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setNewAddress(addr.address);
    setIsPrimary(addr.isPrimary);
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (id) => {
    await fetchGraphQL(DELETE_ADDRESS, { addressId: id });
    fetchAddresses();
  };

  const handleSaveAddress = async () => {
    if (editingAddress) {
      await fetchGraphQL(UPDATE_ADDRESS, {
        addressId: parseInt(editingAddress.id),
        address: newAddress,
        isPrimary,
      });
    } else {
      await fetchGraphQL(CREATE_ADDRESS, {
        address: newAddress,
        userId,
        isPrimary,
      });
    }
    setAddressDialogOpen(false);
    setEditingAddress(null);
    setNewAddress('');
    setIsPrimary(false);
    fetchAddresses();
  };

  const profile = data?.getUserProfile;
  const referralLink = `${baseUrl}/signup?referredby=${profile?.referralId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy referral link:', err);
    }
  };

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

        {/* Address Section */}
        <Typography variant="h6" sx={{ mt: 4 }}>
          Addresses
        </Typography>
        {addresses.length === 0 ? (
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

        <Button variant="contained" sx={{ mt: 2 }} onClick={() => setAddressDialogOpen(true)}>
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
          <Button onClick={handleSaveAddress} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
