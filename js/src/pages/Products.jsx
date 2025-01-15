import { Container, Typography } from '@mui/material';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/products/ProductGrid';

const Products = () => {
  const products = [
    {
      id: '1',
      name: 'Basmati Rice',
      price: 19.99,
      description: 'Premium long-grain basmati rice from India',
      rating: 4.5,
    },
    {
      id: '2',
      name: 'Turmeric Powder',
      price: 5.99,
      description: 'Organic turmeric powder with high curcumin content',
      rating: 4.8,
    },
    {
      id: '3',
      name: 'Garam Masala',
      price: 6.99,
      description: 'Authentic blend of Indian spices',
      rating: 4.7,
    },
  ];

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