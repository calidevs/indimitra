import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import graphqlService from '@/config/graphql/graphqlService';

const GET_MEAT_CUTS = `
  query GetMeatCuts {
    meatCuts {
      id
      label
      text
    }
  }
`;

const CREATE_MEAT_CUT = `
  mutation CreateMeatCut($label: String!, $text: String!) {
    createMeatCut(label: $label, text: $text) {
      meatCut {
        id
        label
        text
      }
      error {
        message
      }
    }
  }
`;

const UPDATE_MEAT_CUT = `
  mutation UpdateMeatCut($meatCutId: Int!, $label: String!, $text: String!) {
    updateMeatCut(meatCutId: $meatCutId, label: $label, text: $text) {
      meatCut {
        id
        label
        text
      }
      error {
        message
      }
    }
  }
`;

const DELETE_MEAT_CUT = `
  mutation DeleteMeatCut($meatCutId: Int!) {
    deleteMeatCut(meatCutId: $meatCutId) {
      success
      error {
        message
      }
    }
  }
`;

const MeatCutManagement = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMeatCut, setEditingMeatCut] = useState(null);
  const [label, setLabel] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedMeatCut, setSelectedMeatCut] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Fetch meat cuts
  const { data: meatCutsData, refetch } = useQuery({
    queryKey: ['meatCuts'],
    queryFn: async () => {
      const result = await graphqlService(GET_MEAT_CUTS);
      return result.meatCuts || [];
    },
    enabled: false,
  });

  // Create meat cut mutation
  const createMeatCutMutation = useMutation({
    mutationFn: (variables) => graphqlService(CREATE_MEAT_CUT, variables),
    onSuccess: (data) => {
      if (data?.createMeatCut?.error) {
        setError(data.createMeatCut.error.message);
        return;
      }
      handleCloseDialog();
      setSuccessMessage('Meat cut created successfully');
      refetch();
    },
    onError: (error) => {
      setError(error.message || 'Failed to create meat cut');
    },
  });

  // Update meat cut mutation
  const updateMeatCutMutation = useMutation({
    mutationFn: (variables) => graphqlService(UPDATE_MEAT_CUT, variables),
    onSuccess: (data) => {
      if (data?.updateMeatCut?.error) {
        setError(data.updateMeatCut.error.message);
        return;
      }
      handleCloseDialog();
      setSuccessMessage('Meat cut updated successfully');
      refetch();
    },
    onError: (error) => {
      setError(error.message || 'Failed to update meat cut');
    },
  });

  // Delete meat cut mutation
  const deleteMeatCutMutation = useMutation({
    mutationFn: (variables) => graphqlService(DELETE_MEAT_CUT, variables),
    onSuccess: (data) => {
      if (data?.deleteMeatCut?.error) {
        setError(data.deleteMeatCut.error.message);
        return;
      }
      setSuccessMessage('Meat cut deleted successfully');
      setOpenDeleteDialog(false);
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleOpenDialog = (meatCut = null) => {
    if (meatCut) {
      setEditingMeatCut(meatCut);
      setLabel(meatCut.label);
      setText(meatCut.text);
    } else {
      setEditingMeatCut(null);
      setLabel('');
      setText('');
    }
    setError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMeatCut(null);
    setLabel('');
    setText('');
    setError(null);
  };

  const handleSubmit = () => {
    if (!label.trim()) {
      setError('Label is required');
      return;
    }
    if (!text.trim()) {
      setError('Text is required');
      return;
    }

    if (editingMeatCut) {
      updateMeatCutMutation.mutate({
        meatCutId: editingMeatCut.id,
        label: label.trim(),
        text: text.trim(),
      });
    } else {
      createMeatCutMutation.mutate({
        label: label.trim(),
        text: text.trim(),
      });
    }
  };

  const handleDelete = (meatCut) => {
    setSelectedMeatCut(meatCut);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedMeatCut) {
      deleteMeatCutMutation.mutate({ meatCutId: selectedMeatCut.id });
    }
  };

  const handleFetchMeatCuts = () => {
    setIsLoading(true);
    setError(null);

    refetch()
      .then(() => {
        setDataLoaded(true);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Failed to load meat cuts. Please try again.');
        setIsLoading(false);
      });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedMeatCuts = meatCutsData?.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AddIcon sx={{ mr: 1 }} />
          <Typography variant="h5">Meat Cut Management</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleFetchMeatCuts}
              disabled={isLoading}
              sx={{ minWidth: 150 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Fetch Meat Cuts'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Meat Cut
            </Button>
          </Grid>
        </Grid>

        {error && !openDialog && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {!dataLoaded ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Click "Fetch Meat Cuts" to load meat cut information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This helps save resources by only loading data when needed
            </Typography>
          </Box>
        ) : isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Label</TableCell>
                    <TableCell>Text</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMeatCuts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No meat cuts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMeatCuts?.map((meatCut) => (
                      <TableRow key={meatCut.id}>
                        <TableCell>{meatCut.id}</TableCell>
                        <TableCell>{meatCut.label}</TableCell>
                        <TableCell>{meatCut.text}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleOpenDialog(meatCut)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(meatCut)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={meatCutsData?.length || 0}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </TableContainer>
          </>
        )}
      </Paper>

      {/* Add/Edit Meat Cut Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingMeatCut ? 'Edit Meat Cut' : 'Add New Meat Cut'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Label"
            fullWidth
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Text"
            fullWidth
            multiline
            minRows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMeatCutMutation.isPending || updateMeatCutMutation.isPending}
          >
            {createMeatCutMutation.isPending || updateMeatCutMutation.isPending ? (
              <CircularProgress size={24} />
            ) : editingMeatCut ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Meat Cut Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Meat Cut</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this meat cut?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            disabled={deleteMeatCutMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteMeatCutMutation.isPending}
            startIcon={
              deleteMeatCutMutation.isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : null
            }
          >
            {deleteMeatCutMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeatCutManagement;
