import React, { createContext, useContext, useState } from 'react';
import { Box, CssBaseline, useTheme } from '@mui/material';
import SideNav from './SideNav';
import Header from '@/components/layout/Header';

// Create a context to share the drawer state
export const DrawerContext = createContext({
  open: true,
  setOpen: () => {},
});

const Layout = ({ children }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const DRAWER_WIDTH = 240;
  const COLLAPSED_DRAWER_WIDTH = 65;

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <Header />
        <SideNav />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px)` },
            ml: { sm: `${open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px` },
            mt: { xs: '64px', sm: '70px' },
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 1200 }}>{children}</Box>
        </Box>
      </Box>
    </DrawerContext.Provider>
  );
};

export default Layout;
