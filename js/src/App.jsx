import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Routes, Route } from 'react-router-dom';
import theme from './theme';

import Home from './pages/Home';
import Products from './pages/Products';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './config/ProtectedRoute';

const App = () => {
  const protectedRoutes = [
    { path: '/', element: <Home /> },
    { path: '/products', element: <Products /> },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {protectedRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
        ))}
      </Routes>
    </ThemeProvider>
  );
};

export default App;
