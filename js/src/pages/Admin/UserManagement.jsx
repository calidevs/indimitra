import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Mock data - replace with actual data from your API
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Customer',
    status: 'Active',
    joinDate: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Customer',
    status: 'Active',
    joinDate: '2024-02-01',
  },
];

const mockDeliveryPartners = [
  {
    id: 1,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '+1234567890',
    status: 'Active',
    joinDate: '2024-01-10',
  },
  {
    id: 2,
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    phone: '+1234567891',
    status: 'Inactive',
    joinDate: '2024-02-05',
  },
];

const mockStoreManagers = [
  {
    id: 1,
    name: 'Tom Brown',
    email: 'tom@example.com',
    phone: '+1234567892',
    store: 'Store A',
    status: 'Active',
    joinDate: '2024-01-20',
  },
  {
    id: 2,
    name: 'Lisa Davis',
    email: 'lisa@example.com',
    phone: '+1234567893',
    store: 'Store B',
    status: 'Active',
    joinDate: '2024-02-10',
  },
];

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearchTerm('');
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

  const handleFetchData = () => {
    setIsLoading(true);
    setError(null);

    // Simulate API call with setTimeout
    setTimeout(() => {
      try {
        // In a real app, this would be an API call
        setDataLoaded(true);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        setIsLoading(false);
      }
    }, 1000);
  };

  const getFilteredData = () => {
    if (!dataLoaded) return [];

    if (activeTab === 0) {
      // All tab - combine all data
      const allData = [
        ...mockUsers.map((user) => ({ ...user, type: 'User' })),
        ...mockDeliveryPartners.map((partner) => ({ ...partner, type: 'Delivery Partner' })),
        ...mockStoreManagers.map((manager) => ({ ...manager, type: 'Store Manager' })),
      ];
      return allData.filter((item) =>
        Object.values(item).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else if (activeTab === 1) {
      return mockUsers.filter((item) =>
        Object.values(item).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else if (activeTab === 2) {
      return mockDeliveryPartners.filter((item) =>
        Object.values(item).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      return mockStoreManagers.filter((item) =>
        Object.values(item).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  };

  const renderAllUsersTable = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Details</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Join Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getFilteredData()
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((user) => (
              <TableRow key={`${user.type}-${user.id}`}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.type}</TableCell>
                <TableCell>
                  {user.type === 'User' && user.role}
                  {user.type === 'Delivery Partner' && user.phone}
                  {user.type === 'Store Manager' && user.store}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    color={user.status === 'Active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.joinDate}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
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
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Join Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getFilteredData()
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    color={user.status === 'Active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.joinDate}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
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
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Join Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getFilteredData()
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>{partner.name}</TableCell>
                <TableCell>{partner.email}</TableCell>
                <TableCell>{partner.phone}</TableCell>
                <TableCell>
                  <Chip
                    label={partner.status}
                    color={partner.status === 'Active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{partner.joinDate}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
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
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Store</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Join Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {getFilteredData()
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((manager) => (
              <TableRow key={manager.id}>
                <TableCell>{manager.name}</TableCell>
                <TableCell>{manager.email}</TableCell>
                <TableCell>{manager.phone}</TableCell>
                <TableCell>{manager.store}</TableCell>
                <TableCell>
                  <Chip
                    label={manager.status}
                    color={manager.status === 'Active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{manager.joinDate}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
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
          <Button variant="contained" startIcon={<AddIcon />} sx={{ minWidth: 150 }}>
            Add New
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!dataLoaded ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Click "Fetch Data" to load user information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This helps save resources by only loading data when needed
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleFetchData}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Fetch Data'}
            </Button>
          </Box>
        ) : isLoading ? (
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
    </Box>
  );
};

export default UserManagement;
