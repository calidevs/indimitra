import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography } from '@mui/material';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/products/ProductGrid';
import { LoadingSpinner } from '../components';
import fetchGraphQL from '../config/graphql/graphqlService';
import { PRODUCTS_QUERY } from '@/queries/operations';

const Products = () => {
  const {
    data: { products = [] } = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchGraphQL(PRODUCTS_QUERY),
  });

  if (error) return <Typography>Error fetching products!</Typography>;

  return (
    <Layout>
      <Container>{isLoading ? <LoadingSpinner /> : <ProductGrid products={products} />}</Container>
    </Layout>
  );
};

export default Products;
