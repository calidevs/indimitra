import { AppBar, Box, Toolbar, Typography, Button, IconButton, Badge, Fab } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useTheme } from '@mui/material/styles';
import useStore from '@/store/useStore'; // Zustand store
import { useMediaQuery } from '@mui/material';

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const cartCount = useStore((state) => state.cartCount()); // Fetch total cart count
  const isMobile = useMediaQuery('(max-width: 600px)'); // Check if screen is mobile

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ✅ Navbar should be visible in all views, but cart icon should be hidden in mobile */}
      <AppBar position="static" sx={{ background: theme.palette.custom.gradientPrimary }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Indimitra
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
          {/* ✅ Show cart icon in navbar only for tablets and desktops */}
          {!isMobile && (
            <IconButton color="inherit" onClick={() => navigate('/cart')}>
              <Badge badgeContent={cartCount} color="error" invisible={cartCount === 0}>
                <ShoppingCart />
              </Badge>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* ✅ Floating Cart Button only for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="cart"
          onClick={() => navigate('/cart')}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: theme.palette.custom.gradientPrimary,
            color: 'white',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
            '&:hover': {
              opacity: 0.9,
            },
          }}
        >
          <Badge badgeContent={cartCount} color="error" invisible={cartCount === 0}>
            <ShoppingCart />
          </Badge>
        </Fab>
      )}
    </Box>
  );
};

export default Header;
