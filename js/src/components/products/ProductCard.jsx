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
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { PLACEHOLDER_IMAGE } from '@/assets/images';
import { useTheme } from '@mui/material/styles';
import useStore from '@/store/useStore';

const ProductCard = ({ product }) => {
  const theme = useTheme();
  const { cart, addToCart, removeFromCart } = useStore();
  const { id, name, price, description, image, rating = 4 } = product;
  const quantity = cart[id] || 0;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
      <CardMedia
        component="img"
        height="160"
        image={image || PLACEHOLDER_IMAGE}
        alt={name}
        sx={{ objectFit: 'cover', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating value={rating} readOnly precision={0.5} size="small" />
          <Typography variant="body2" color="text.secondary">
            ({rating})
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
          ₹{price.toFixed(2)}
        </Typography>
      </CardContent>

      <CardActions
        sx={{
          justifyContent: 'center',
          pb: 2,
        }}
      >
        {quantity > 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '75%',
              minWidth: '120px',
              maxWidth: '250px',
              height: '50px',
              borderRadius: '50px',
              background:
                'linear-gradient(white, white) padding-box, linear-gradient(45deg, #FF6B6B, #FFA07A) border-box',
              border: '2px solid transparent',
              p: 1,
              '@media (max-width: 600px)': {
                height: '48px',
                width: '80%',
              },
            }}
          >
            {/* Minus Button Section */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconButton
                onClick={() => removeFromCart(id)}
                sx={{
                  color: '#FF6B6B',
                  p: 0,
                  fontSize: '20px',
                  '&:hover': { backgroundColor: 'transparent' },
                }}
              >
                <Remove fontSize="inherit" />
              </IconButton>
            </Box>

            {/* Quantity Section */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '2px solid #FF6B6B', // Vertical separator
                borderLeft: '2px solid #FF6B6B', // Vertical separator
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#FF6B6B',
                  fontWeight: 600,
                  fontSize: '18px',
                  '@media (max-width: 600px)': { fontSize: '20px' },
                }}
              >
                {quantity}
              </Typography>
            </Box>

            {/* Plus Button Section */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconButton
                onClick={() => addToCart(id)}
                sx={{
                  color: '#FF6B6B',
                  p: 0,
                  fontSize: '20px',
                  '&:hover': { backgroundColor: 'transparent' },
                }}
              >
                <Add fontSize="inherit" />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Button
            size="small"
            sx={{
              width: '75%',
              minWidth: '120px',
              maxWidth: '250px',
              height: '42px',
              background: 'linear-gradient(45deg, #FF6B6B, #FFA07A)',
              color: 'white',
              borderRadius: '50px',
              fontWeight: 600,
              fontSize: '16px',
              '&:hover': { opacity: 0.9 },
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              '@media (max-width: 600px)': {
                height: '48px',
                width: '80%',
                fontSize: '18px',
              },
            }}
            fullWidth
            variant="contained"
            onClick={() => addToCart(id)}
          >
            Add
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default ProductCard;
