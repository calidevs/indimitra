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
} from '@components';
import { Edit } from '@mui/icons-material';

const dummyUsers = [
  {
    id: 1,
    firstName: 'Abhishek',
    lastName: 'Gattineni',
    email: 'abhishek@example.com',
    type: 'USER',
  },
  {
    id: 2,
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi.kumar@example.com',
    type: 'DELIVERY',
  },
  {
    id: 3,
    firstName: 'Sara',
    lastName: 'Williams',
    email: 'sara.w@example.com',
    type: 'STORE_MANAGER',
  },
  {
    id: 4,
    firstName: 'Nina',
    lastName: 'Patel',
    email: 'nina.patel@example.com',
    type: 'ADMIN',
  },
];

const UserUpdateRole = () => {
  const [users, setUsers] = useState(dummyUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setNewRole(user.type);
    setModalOpen(true);
  };

  const handleConfirm = () => {
    const updatedUsers = users.map((user) =>
      user.id === selectedUser.id ? { ...user, type: newRole } : user
    );
    setUsers(updatedUsers);
    setModalOpen(false);
  };

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
              <TableCell>Full Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Current Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
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
        <DialogTitle>
          Update Role for {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>User Role</InputLabel>
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="USER">User</MenuItem>
              <MenuItem value="DELIVERY">Delivery</MenuItem>
              <MenuItem value="STORE_MANAGER">Store Manager</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={newRole === selectedUser?.type}>
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserUpdateRole;
