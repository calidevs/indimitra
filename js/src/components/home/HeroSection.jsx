import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        pt: 8,
        pb: 6,
      }}
    >
      <Container maxWidth="sm">
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="text.primary"
          gutterBottom
        >
          Indimitra
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          Your one-stop shop for authentic Indian groceries. Fresh ingredients,
          spices, and ready-to-cook items delivered to your doorstep.
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" size="large" onClick={() => navigate('/products')}>
            Shop Now
          </Button>
          <Button variant="outlined" size="large">
            Learn More
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection; 