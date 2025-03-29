import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Button,
  Typography,
  Rating,
  Box,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { Add, Remove, ShoppingCart } from '@mui/icons-material';
import { PLACEHOLDER_IMAGE, getRandomGroceryImage } from '@/assets/images';
import { useTheme } from '@mui/material/styles';
import useStore from '@/store/useStore';

const ProductCard = ({ product }) => {
  const theme = useTheme();
  const { cart, addToCart, removeFromCart } = useStore();
  const { id, name, price, description, image, rating = 4, categoryName } = product;
  const quantity = cart[id]?.quantity || 0;

  // Use product image if available, otherwise use category-based Indian grocery image
  const productImage =
    image || (categoryName ? getRandomGroceryImage(categoryName) : PLACEHOLDER_IMAGE);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'transform 0.3s, box-shadow 0.3s',
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Category Chip */}
      {categoryName && (
        <Chip
          label={categoryName}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 600,
            fontSize: '0.7rem',
            borderRadius: '12px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }}
        />
      )}

      <CardMedia
        component="img"
        height="140"
        image={productImage}
        alt={name}
        sx={{
          objectFit: 'cover',
          transition: 'transform 0.5s',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      />

      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Typography
          gutterBottom
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            mb: 1,
            lineHeight: 1.3,
          }}
        >
          {name}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '0.85rem',
              lineHeight: 1.4,
            }}
          >
            {description}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 'auto',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              fontSize: '1.2rem',
            }}
          >
            ${price.toFixed(2)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions
        sx={{
          justifyContent: 'center',
          pb: 2.5,
          px: 2.5,
        }}
      >
        {quantity > 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '48px',
              borderRadius: '24px',
              background: 'linear-gradient(45deg, #FF6B6B, #FFA07A)',
              p: 1,
              boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)',
            }}
          >
            {/* Minus Button */}
            <Tooltip title="Remove from cart">
              <IconButton
                onClick={() => removeFromCart(id)}
                sx={{
                  color: 'white',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <Remove fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Quantity */}
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 600,
                mx: 2,
                minWidth: '30px',
                textAlign: 'center',
              }}
            >
              {quantity}
            </Typography>

            {/* Plus Button */}
            <Tooltip title="Add to cart">
              <IconButton
                onClick={() => addToCart(product)}
                sx={{
                  color: 'white',
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Button
            size="medium"
            sx={{
              width: '100%',
              height: '48px',
              background: 'linear-gradient(45deg, #FF6B6B, #FFA07A)',
              color: 'white',
              borderRadius: '24px',
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF5252, #FF8C69)',
                boxShadow: '0 6px 15px rgba(255, 107, 107, 0.4)',
              },
            }}
            startIcon={<ShoppingCart />}
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ProductCard;
