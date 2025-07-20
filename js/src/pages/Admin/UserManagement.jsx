import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import fetchGraphQL from '@/config/graphql/graphqlService';
import {
  GET_ALL_USERS,
  GET_STORES,
  UPDATE_USER_TYPE,
  ASSIGN_DRIVER_TO_STORE,
} from '@/queries/operations';

const UserManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [adminCognitoId, setAdminCognitoId] = useState(null);

  // New state for store assignment
  const [storeAssignmentModalOpen, setStoreAssignmentModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState([]);

  // Fetch all users using React Query
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_ALL_USERS);
      return response?.getAllUsers || [];
    },
    enabled: true, // Fetch data immediately when component mounts
  });

  // Fetch all stores using React Query
  const {
    data: storesData,
    isLoading: isLoadingStores,
    error: storesError,
    refetch: refetchStores,
  } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_STORES);
      return response?.stores || [];
    },
    enabled: true,
  });

  // Update user type mutation
  const updateUserTypeMutation = useMutation({
    mutationFn: (variables) => fetchGraphQL(UPDATE_USER_TYPE, variables),
    onSuccess: (response, variables) => {
      const result = response?.updateUserType;
      if (result?.user) {
        // Update the user in-place in the usersData array
        if (usersData) {
          usersData.forEach((user) => {
            if (user.cognitoId === variables.targetUserId) {
              user.type = variables.newType;
            }
          });
        }
        setSnackbar({
          open: true,
          message: `Successfully updated user role to ${result.user.type}`,
          severity: 'success',
        });
      }
      setRoleModalOpen(false);
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: 'Error updating user role: ' + error.message,
        severity: 'error',
      });
    },
  });

  // Assign driver to store mutation
  const assignDriverToStoreMutation = useMutation({
    mutationFn: (variables) => fetchGraphQL(ASSIGN_DRIVER_TO_STORE, variables),
    onSuccess: (response) => {
      const result = response?.assignDriverToStore;

      if (result) {
        setSnackbar({
          open: true,
          message: `Successfully assigned driver to ${result.store.name}`,
          severity: 'success',
        });
        refetchStores(); // Refresh the stores list
      }
      setStoreAssignmentModalOpen(false);
    },
    onError: (error) => {
      console.error('Error assigning driver to store:', error);
      setSnackbar({
        open: true,
        message: 'Error assigning driver to store: ' + error.message,
        severity: 'error',
      });
    },
  });

  // Get current admin's cognitoId
  useEffect(() => {
    const getAdminId = async () => {
      try {
        // In a real app, you would get this from your auth context
        // For now, we'll find the admin user from the fetched data
        if (usersData) {
          const adminUser = usersData.find((user) => user.type === 'ADMIN');
          if (adminUser) {
            setAdminCognitoId(adminUser.cognitoId);
          }
        }
      } catch (error) {
        console.error('Error fetching admin ID:', error);
      }
    };

    if (usersData) {
      getAdminId();
    }
  }, [usersData]);

  // Update stores state when storesData changes
  useEffect(() => {
    if (storesData) {
      setStores(storesData);
    }
  }, [storesData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleRoleUpdate = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.type);
    setRoleModalOpen(true);
  };

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  const handleRoleSubmit = () => {
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
      USER: 'USER',
      ADMIN: 'ADMIN',
      DELIVERY: 'DELIVERY_AGENT',
      STORE_MANAGER: 'STORE_MANAGER',
    };

    updateUserTypeMutation.mutate({
      requesterId: adminCognitoId,
      targetUserId: selectedUser.cognitoId,
      newType: roleMapping[selectedRole] || selectedRole,
    });
  };

  // New handlers for store assignment
  const handleAssignToStore = (user) => {
    setSelectedUser(user);
    setSelectedStore('');
    setStoreAssignmentModalOpen(true);
  };

  const handleStoreChange = (event) => {
    setSelectedStore(event.target.value);
  };

  const handleStoreAssignmentSubmit = () => {
    if (!selectedStore || !selectedUser) {
      setSnackbar({
        open: true,
        message: 'Please select a store',
        severity: 'error',
      });
      return;
    }

    assignDriverToStoreMutation.mutate({
      storeId: parseInt(selectedStore),
      userId: parseInt(selectedUser.id),
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getFilteredData = () => {
    if (!usersData) return [];

    // Filter based on active tab
    let filteredData = usersData;

    if (activeTab === 1) {
      // Users tab
      filteredData = usersData.filter((user) => user.type === 'USER');
    } else if (activeTab === 2) {
      // Delivery Partners tab
      filteredData = usersData.filter((user) => user.type === 'DELIVERY');
    } else if (activeTab === 3) {
      // Store Managers tab
      filteredData = usersData.filter((user) => user.type === 'STORE_MANAGER');
    }

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.mobile && user.mobile.includes(searchTerm)) ||
          (user.referralId && user.referralId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filteredData;
  };

  const renderAllUsersTable = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Mobile</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Referral ID</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getFilteredData()
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.mobile || 'N/A'}</TableCell>
                <TableCell>{user.type}</TableCell>
                <TableCell>
                  <Chip
                    label={user.active ? 'Active' : 'Inactive'}
                    color={user.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.referralId || 'N/A'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => handleRoleUpdate(user)}>
                    <EditIcon />
                  </IconButton>
                  {user.type === 'DELIVERY' && (
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleAssignToStore(user)}
                      title="Assign to Store"
                    >
                      <LocalShippingIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderUsersTable = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Mobile</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Referral ID</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getFilteredData()
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.mobile || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.active ? 'Active' : 'Inactive'}
                    color={user.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.referralId || 'N/A'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => handleRoleUpdate(user)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDeliveryPartnersTable = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Mobile</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Referral ID</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getFilteredData()
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>{partner.id}</TableCell>
                <TableCell>{partner.email}</TableCell>
                <TableCell>{partner.mobile || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={partner.active ? 'Active' : 'Inactive'}
                    color={partner.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{partner.referralId || 'N/A'}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleRoleUpdate(partner)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => handleAssignToStore(partner)}
                    title="Assign to Store"
                  >
                    <LocalShippingIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderStoreManagersTable = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Mobile</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Referral ID</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getFilteredData()
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((manager) => (
              <TableRow key={manager.id}>
                <TableCell>{manager.id}</TableCell>
                <TableCell>{manager.email}</TableCell>
                <TableCell>{manager.mobile || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={manager.active ? 'Active' : 'Inactive'}
                    color={manager.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{manager.referralId || 'N/A'}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleRoleUpdate(manager)}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          User Management
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
          variant={isMobile ? 'fullWidth' : 'standard'}
        >
          <Tab label="All" />
          <Tab label="Users" />
          <Tab label="Delivery Partners" />
          <Tab label="Store Managers" />
        </Tabs>

        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
        </Box>

        {usersError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading users: {usersError.message}
          </Alert>
        )}

        {isLoadingUsers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 0 && renderAllUsersTable()}
            {activeTab === 1 && renderUsersTable()}
            {activeTab === 2 && renderDeliveryPartnersTable()}
            {activeTab === 3 && renderStoreManagersTable()}

            <TablePagination
              component="div"
              count={getFilteredData().length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ mt: 2 }}
            />
          </>
        )}
      </Paper>

      {/* Role Update Modal */}
      <Dialog
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '600px',
            m: { xs: 2, sm: 3, md: 4 },
            p: { xs: 2, sm: 3 },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Update User Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                User: {selectedUser.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                ID: {selectedUser.id}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={handleRoleChange}
                  label="Role"
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="USER">User</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="DELIVERY">Delivery Partner</MenuItem>
                  <MenuItem value="STORE_MANAGER">Store Manager</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setRoleModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRoleSubmit}
            variant="contained"
            color="primary"
            disabled={updateUserTypeMutation.isPending}
          >
            {updateUserTypeMutation.isPending ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Store Assignment Modal */}
      <Dialog
        open={storeAssignmentModalOpen}
        onClose={() => setStoreAssignmentModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '600px',
            m: { xs: 2, sm: 3, md: 4 },
            p: { xs: 2, sm: 3 },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Assign Driver to Store</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Driver: {selectedUser.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                ID: {selectedUser.id}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Select Store
              </Typography>

              {isLoadingStores ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : storesError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Error loading stores: {storesError.message}
                </Alert>
              ) : stores.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No stores available
                </Alert>
              ) : (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Store</InputLabel>
                  <Select
                    value={selectedStore}
                    onChange={handleStoreChange}
                    label="Store"
                    sx={{ mb: 2 }}
                  >
                    {stores.map((store) => (
                      <MenuItem key={store.id} value={store.id}>
                        {store.name} - {store.address}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {selectedStore && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Drivers
                  </Typography>
                  {stores.find((s) => s.id === parseInt(selectedStore))?.drivers?.edges?.length >
                  0 ? (
                    <Box sx={{ mt: 1 }}>
                      {stores
                        .find((s) => s.id === parseInt(selectedStore))
                        ?.drivers?.edges?.map((edge, index) => (
                          <Chip
                            key={index}
                            label={edge.node.driver.email}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No drivers assigned to this store yet
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStoreAssignmentModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStoreAssignmentSubmit}
            variant="contained"
            color="primary"
            disabled={!selectedStore || assignDriverToStoreMutation.isPending}
          >
            {assignDriverToStoreMutation.isPending ? 'Assigning...' : 'Assign to Store'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
