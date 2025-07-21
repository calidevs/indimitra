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

const GET_CATEGORIES = `
  query GetCategories {
    categories {
      id
      name
      createdAt
    }
  }
`;

const CREATE_CATEGORY = `
  mutation CreateCategory($name: String!) {
    createCategory(name: $name) {
      category {
        id
        name
      }
    }
  }
`;

const UPDATE_CATEGORY = `
  mutation UpdateCategory($categoryId: Int!, $name: String!) {
    updateCategory(categoryId: $categoryId, name: $name) {
      category {
        id
        name
      }
    }
  }
`;

const DELETE_CATEGORY = `
  mutation DeleteCategory($categoryId: Int!) {
    deleteCategory(categoryId: $categoryId) {
      success
    }
  }
`;

const CategoryManagement = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Fetch categories
  const { data: categoriesData, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await graphqlService(GET_CATEGORIES);
      return result.categories || [];
    },
    enabled: false,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (name) => graphqlService(CREATE_CATEGORY, { name }),
    onSuccess: () => {
      handleCloseDialog();
      refetch();
    },
    onError: (error) => {
      setError(error.message || 'Failed to create category');
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }) => graphqlService(UPDATE_CATEGORY, { categoryId: id, name }),
    onSuccess: (data, variables) => {
      // Update the category in-place in the categories list
      if (categoriesData) {
        categoriesData.forEach((cat) => {
          if (cat.id === variables.id) {
            cat.name = variables.name;
          }
        });
      }
      handleCloseDialog();
      setSuccessMessage('Category updated successfully');
    },
    onError: (error) => {
      setError(error.message || 'Failed to update category');
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (variables) => graphqlService(DELETE_CATEGORY, variables),
    onSuccess: () => {
      setSuccessMessage('Category deleted successfully');
      setOpenDeleteDialog(false);
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setCategoryName('');
    setError(null);
  };

  const handleSubmit = () => {
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        name: categoryName.trim(),
      });
    } else {
      createCategoryMutation.mutate(categoryName.trim());
    }
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate({ categoryId: selectedCategory.id });
    }
  };

  const handleFetchCategories = () => {
    setIsLoading(true);
    setError(null);

    refetch()
      .then(() => {
        setDataLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError('Failed to load categories. Please try again.');
        setIsLoading(false);
      });
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated data
  const paginatedCategories = categoriesData?.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AddIcon sx={{ mr: 1 }} />
          <Typography variant="h5">Category Management</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleFetchCategories}
              disabled={isLoading}
              sx={{ minWidth: 150 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Fetch Categories'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Category
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!dataLoaded ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Click "Fetch Categories" to load category information
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
                    <TableCell>Name</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCategories?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCategories?.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.id}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleOpenDialog(category)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(category)}>
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
                count={categoriesData?.length || 0}
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

      {/* Add/Edit Category Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            error={!!error}
            helperText={error}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
          >
            {createCategoryMutation.isLoading || updateCategoryMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : editingCategory ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this category?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManagement;
