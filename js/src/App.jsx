import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme';

import Home from './pages/Home';
import Products from './pages/Products';
import ProtectedRoute from './config/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import AuthContainer from './components/auth/AuthContainer';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import Orders from './pages/Orders';
import { useAuthStore } from './store/useStore';
import { ROUTES } from './config/constants/routes';
import Profile from './pages/Profile';

const App = () => {
  const { user } = useAuthStore();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<AuthContainer />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.USER}
          element={
            <ProtectedRoute role="user">
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DRIVER}
          element={
            <ProtectedRoute role="driver">
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.PRODUCTS}
          element={
            <ProtectedRoute role="user">
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.HOME}
          element={
            user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path={ROUTES.ORDERS}
          element={
            <ProtectedRoute role="user">
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
