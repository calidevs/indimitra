import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography } from '@mui/material';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/products/ProductGrid';
import { LoadingSpinner } from '../components';
import fetchGraphQL from '../utils/fetchGraphQL';

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

const Products = () => {
  const {
    data: { products = [] } = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchGraphQL(PRODUCTS_QUERY),
  });

  if (isLoading) return <LoadingSpinner />;
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
