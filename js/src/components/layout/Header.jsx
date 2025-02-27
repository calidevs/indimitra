import { AppBar, Box, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { ShoppingCart, Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useTheme } from '@mui/material/styles';

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();

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
      <AppBar position="static" sx={{ background: theme.palette.custom.gradientPrimary }}>
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
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
          <IconButton color="inherit" onClick={() => navigate('/cart')}>
            <ShoppingCart />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
