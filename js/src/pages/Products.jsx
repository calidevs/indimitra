import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  ProductGrid,
  LoadingSpinner,
  TextField,
  InputAdornment,
} from '@components';
import SearchIcon from '@mui/icons-material/Search';
import fetchGraphQL from '../config/graphql/graphqlService';
import { PRODUCTS_QUERY } from '@/queries/operations';

const Products = () => {
  const [search, setSearch] = useState('');

  const {
    data: { products = [] } = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchGraphQL(PRODUCTS_QUERY),
  });

  if (error) return <Typography>Error fetching products!</Typography>;

  // Filter logic based on search input (min 3 characters)
  const filteredProducts =
    search.length >= 3
      ? products.filter((product) => product.name.toLowerCase().includes(search.toLowerCase()))
      : products;

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
        placeholder="Search by product name(minimum 3 characters)..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'primary.main' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Product Grid */}
      {isLoading ? <LoadingSpinner /> : <ProductGrid products={filteredProducts} />}
    </Container>
  );
};

export default Products;
