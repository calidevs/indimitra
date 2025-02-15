import { Grid } from '@mui/material';
import { Typography } from '../index';
import ProductCard from './ProductCard';

const ProductGrid = ({ products }) => {
  if (products.length === 0) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        No products available.
      </Typography>
    );
  }
  return (
    <Grid container spacing={4}>
      {products.map((product) => (
        <Grid item key={product.id} xs={12} sm={6} md={4}>
          <ProductCard product={product} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductGrid;
