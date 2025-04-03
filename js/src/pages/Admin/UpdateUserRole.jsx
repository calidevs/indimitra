import React, { useState } from 'react';
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
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  LoadingSpinner,
  Alert,
  Snackbar,
} from '@components';
import { Edit } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_ALL_USERS, UPDATE_USER_TYPE } from '@/queries/operations';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthStore } from '@/store/useStore';

const UserUpdateRole = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { userProfile } = useAuthStore();

  // Get current admin's cognitoId
  const [adminCognitoId, setAdminCognitoId] = useState(null);

  React.useEffect(() => {
    const getAdminId = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          const id = session.tokens.idToken.payload.sub;
          setAdminCognitoId(id);
        }
      } catch (error) {
        console.error('Error fetching admin ID:', error);
      }
    };
    getAdminId();
  }, []);

  // Fetch all users
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['getAllUsers'],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_ALL_USERS);
      return response?.getAllUsers || [];
    },
  });

  // Update user type mutation
  const mutation = useMutation({
    mutationFn: (variables) => fetchGraphQL(UPDATE_USER_TYPE, variables),
    onSuccess: (response) => {
      const result = response?.updateUserType;

      if (result?.error) {
        setSnackbar({
          open: true,
          message: result.error.message || 'Failed to update user role',
          severity: 'error',
        });
      } else if (result?.user) {
        setSnackbar({
          open: true,
          message: `Successfully updated user role to ${result.user.type}`,
          severity: 'success',
        });
        refetch(); // Refresh the user list
      }
      setModalOpen(false);
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      setSnackbar({
        open: true,
        message: 'Error updating user role: ' + error.message,
        severity: 'error',
      });
    },
  });

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setNewRole(user.type);
    setModalOpen(true);
  };

  const handleConfirm = () => {
    if (!adminCognitoId) {
      setSnackbar({
        open: true,
        message: 'Admin ID not available. Please try again.',
        severity: 'error',
      });
      return;
    }

    // Map frontend role values to backend expected values
    const roleMapping = {
      ADMIN: 'ADMIN',
      USER: 'USER',
      DELIVERY: 'DELIVERY_AGENT',
      STORE_MANAGER: 'STORE_MANAGER',
    };

    mutation.mutate({
      requesterId: adminCognitoId,
      targetUserId: selectedUser.cognitoId,
      newType: roleMapping[newRole],
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (isLoading) return <LoadingSpinner sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  if (error)
    return (
      <Container>
        <Alert severity="error">Error loading users: {error.message}</Alert>
      </Container>
    );

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Role Management
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Current Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.type}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(user)}>
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update Role for {selectedUser?.email}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>User Role</InputLabel>
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="USER">User</MenuItem>
              <MenuItem value="DELIVERY">Delivery Agent</MenuItem>
              <MenuItem value="STORE_MANAGER">Store Manager</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={newRole === selectedUser?.type || mutation.isPending}
            color="primary"
            variant="contained"
          >
            {mutation.isPending ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserUpdateRole;
