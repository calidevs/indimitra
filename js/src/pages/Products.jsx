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
  TablePagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_STORE_PRODUCTS } from '@/queries/operations';
import useStore from '@/store/useStore';
import { ProductGrid } from '@components';
import banginapalli from '@/assets/images/products/banginapalli.jpg';
import himayat from '@/assets/images/products/himayat.jpg';
import kesar from '@/assets/images/products/kesar.jpg';
import chinnaRasalu from '@/assets/images/products/chinna-rasalu.png';
import alphonso from '@/assets/images/products/alphonso.png';
import malgova from '@/assets/images/products/malgova.jpg';

// Store-specific product images mapping
const STORE_PRODUCT_IMAGES = {
  1: {
    // Store ID 1
    2: banginapalli, // Banginapalli
    3: himayat, // Himayat / Imam Pasand
    4: kesar, // Kesar
    5: chinnaRasalu, // Chinna Rasalu
    6: alphonso, // Alphonso
    7: malgova, // Malgova
  },
};

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

const Products = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12); // Default rows per page

  const { selectedStore } = useStore();

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
        isListed: true, // Only show listed products
      });
      return response;
    },
    enabled: !!selectedStore?.id,
  });

  // Process inventory data to create a products array for the ProductGrid
  const products = useMemo(() => {
    return (
      inventoryData?.getInventoryByStore?.map((item) => {
        const storeId = selectedStore?.id;
        const productId = item.productId;
        const storeImages = STORE_PRODUCT_IMAGES[storeId] || {};

        return {
          id: item.productId,
          name: item.product.name,
          image: item.product.image || storeImages[productId] || 'https://picsum.photos/200',
          price: item.price,
          description: item.product.description,
          categoryId: item.product.category.id,
          categoryName: item.product.category.name,
          inventoryId: item.id,
          quantity: item.quantity,
          measurement: item.measurement,
          unit: item.unit,
          isAvailable: item.isAvailable,
          isListed: item.isListed,
        };
      }) || []
    );
  }, [inventoryData, selectedStore?.id]);

  // Memoize the filtered products with debounced search (no min character check)
  const filteredProducts = useMemo(() => {
    // First filter by search, then sort by isAvailable
    return products
      .filter((product) =>
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
      .sort((a, b) => {
        // Sort available products (isAvailable true) to the top
        if (a.isAvailable === b.isAvailable) return 0;
        return a.isAvailable ? -1 : 1;
      });
  }, [products, debouncedSearch]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = useMemo(() => {
    return filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  if (inventoryError)
    return <Typography>Error fetching products: {inventoryError.message}</Typography>;

  return (
    <Container>
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
