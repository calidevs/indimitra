// In js/src/pages/Products.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
    Button,
  TablePagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StoreIcon from '@mui/icons-material/Storefront';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_STORE_PRODUCTS } from '@/queries/operations';
import useStore from '@/store/useStore';
import { ProductGrid } from '@components';


function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

const Products = ({setStoreModalOpen}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12); // Default rows per page

  const { selectedStore, availableStores } = useStore();

  const debouncedSearch = useDebounce(search, 300);

  // Fetch store products when a store is selected
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery({
    queryKey: ['storeInventory', selectedStore?.id],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_STORE_PRODUCTS, {
        storeId: selectedStore.id,
      });
      return response;
    },
    enabled: !!selectedStore?.id,
  });

  // Process inventory data to create a products array for the ProductGrid
  const products = useMemo(() => {
    return (
      inventoryData?.store?.inventory?.edges?.map(({ node }) => ({
        id: node.product.id,
        name: node.product.name,
        image: node.product.image,
        price: node.price,
        description: node.product.description,
        categoryId: node.product.category.id,
        categoryName: node.product.category.name,
        inventoryId: node.id,
        quantity: node.quantity,
        measurement: node.measurement,
        unit: node.unit,
      })) || []
    );
  }, [inventoryData]);

  // Memoize the filtered products with debounced search (no min character check)
  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [products, debouncedSearch]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = useMemo(() => {
    return filteredProducts.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredProducts, page, rowsPerPage]);

  console.log({visibleRows})

  if (inventoryError)
    return <Typography>Error fetching products: {inventoryError.message}</Typography>;

  return (
    <Container>
       {/* Store Selection */}
      {/* Store Selection */}
      {selectedStore && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            mt: 2,
            p: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            borderRadius: 2,
          }}
        >
          <Box>
            <Typography variant="h6">{selectedStore.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedStore.address}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<StoreIcon  />}
            onClick={() => setStoreModalOpen(true)}
          >
            Change Store
          </Button>
        </Box>
      )}

      {/* Search Field */}
      <TextField
        label="Search Products"
        variant="outlined"
        fullWidth
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by product name or category..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Product Grid */}
      {inventoryLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          No products available in this store.
        </Typography>
      ) : (
        <ProductGrid products={visibleRows} />
        // <div></div>
      )}
      {/* Add pagination controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <TablePagination
          rowsPerPageOptions={[8, 12, 24]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Container>
  );
};

export default Products;
