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
  Tooltip,
} from '@mui/material';
import { Add, Remove, ShoppingCart } from '@mui/icons-material';
import { PLACEHOLDER_IMAGE, getRandomGroceryImage } from '@/assets/images';
import { useTheme } from '@mui/material/styles';
import useStore from '@/store/useStore';
import ProductCategoryChip from '../Chip/ProductCategoryChip';

const unavailableColor = 'grey';

const ProductCard = ({ product }) => {
  const theme = useTheme();
  const { cart, addToCart, removeFromCart } = useStore();
  const { id, name, price, description, image, categoryName, quantity } = product;
  const cartQuantity = cart[id]?.quantity || 0;

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
        ...(quantity === 0 && {
          opacity: 0.5,
          pointerEvents: 'none',
        }),
      }}
    >
      <ProductCategoryChip categoryName={categoryName} />

      <CardMedia
        component="img"
        height="140"
        image={productImage}
        alt={name}
        sx={{
          padding: '10px 0 0 0',
          objectFit: 'contain',
          transition: 'transform 0.5s',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      />

       {quantity === 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: '4px',
            zIndex: 1,
          }}
        >
          <Typography variant="body1">Sold out</Typography>
        </Box>
      )}
      <CardContent sx={{
        flexGrow: 1, 
        p: 2.5,
        pb: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
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
            mb: 2,
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
        {cartQuantity > 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              background: 'rgba(255, 107, 107, 0.15)',
              border: '2px solid #FF6B6B',
              boxShadow: '0 2px 8px rgba(255, 107, 107, 0.15)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(255, 107, 107, 0.15)',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.2)',
              },
            }}
          >
            {/* Minus Button */}
            <Tooltip title="Remove from cart">
              <IconButton
                onClick={() => removeFromCart(id)}
                sx={{
                  color: '#FF6B6B',
                  p: 1,
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Remove fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Quantity */}
            <Typography
              variant="body1"
              sx={{
                color: '#FF6B6B',
                fontWeight: 700,
                mx: 2,
                minWidth: '24px',
                textAlign: 'center',
                fontSize: '1.1rem',
              }}
            >
              {cartQuantity}
            </Typography>

            {/* Plus Button */}
            <Tooltip title="Add to cart">
              <IconButton
                onClick={() => addToCart(product)}
                sx={{
                  color: '#FF6B6B',
                  p: 1,
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
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
              background: 'transparent',
              color: quantity === 0 ? unavailableColor: '#FF6B6B',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              position: 'relative',
              overflow: 'hidden',
              border: `2px solid ${quantity === 0 ? unavailableColor : '#FF6B6B'}`,
              transition: 'all 0.2s ease',
              border: '2px solid #FF6B6B',
              '&:hover': {
                background: 'transparent',
                '& .MuiButton-startIcon': {
                  transform: 'translateX(2px)',
                },
              },
              '& .MuiButton-startIcon': {
                transition: 'transform 0.2s ease',
                marginRight: '8px',
              },
            }}
            startIcon={<ShoppingCart sx={{ fontSize: '1.1rem' }} />}
            onClick={() => addToCart(product)}
            disabled={quantity === 0}
          >
            {quantity === 0 ? 'Unavailable' : 'Add to Cart'}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ProductCard;
