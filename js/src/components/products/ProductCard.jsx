import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Button,
  Typography,
  Rating,
  Box,
} from '@mui/material';
import { AddShoppingCart } from '@mui/icons-material';
import { PLACEHOLDER_IMAGE } from '@/assets/images';
import { useTheme } from '@mui/material/styles';

const ProductCard = ({ product }) => {
  const theme = useTheme();

  const { name, price, description, image, rating = 4 } = product;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia component="img" height="200" image={image || PLACEHOLDER_IMAGE} alt={name} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="h2">
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating value={rating} readOnly precision={0.5} />
          <Typography variant="body2" color="text.secondary">
            ({rating})
          </Typography>
        </Box>
        <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
          ${price.toFixed(2)}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          sx={{ background: theme.palette.custom.gradientPrimary }}
          startIcon={<AddShoppingCart />}
          fullWidth
          variant="contained"
        >
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
