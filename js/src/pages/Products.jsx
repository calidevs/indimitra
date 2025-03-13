import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography, ProductGrid, LoadingSpinner } from '@components';
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
    <Container>{isLoading ? <LoadingSpinner /> : <ProductGrid products={products} />}</Container>
  );
};

export default Products;
