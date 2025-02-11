import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography } from '@mui/material';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/products/ProductGrid';

// GraphQL query
const PRODUCTS_QUERY = `
  {
    products {
      id
      name
      price
      description
      category
    }
  }
`;

// Fetch function for GraphQL
const fetchProducts = async () => {
  const response = await fetch('http://localhost:8000/graphql', {
    // Update the URL if needed
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: PRODUCTS_QUERY }),
  });

  const { data } = await response.json();
  return data.products;
};

const Products = () => {
  // Updated to use the object signature for React Query v5
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography>Error fetching products!</Typography>;

  return (
    <Layout>
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Our Products
        </Typography>
        <ProductGrid products={products} />
      </Container>
    </Layout>
  );
};

export default Products;
