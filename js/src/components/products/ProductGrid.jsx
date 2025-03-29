import { Grid, Box, Typography, Container } from '@mui/material';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, title }) => {
  if (products.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No products available.
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      {title && (
        <Typography
          variant="h5"
          sx={{
            mb: 4,
            fontWeight: 600,
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: '40%',
              height: '3px',
              background: 'linear-gradient(45deg, #FF6B6B, #FFA07A)',
              borderRadius: '3px',
            },
          }}
        >
          {title}
        </Typography>
      )}

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ProductGrid;
