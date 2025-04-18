import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme';

import Products from './pages/Products';
import ProtectedRoute from './config/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import SignUpPage from './pages/SignUp/SignUp';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import StoreManagerDashboard from './pages/StoreManagerDashboard';
import UpdateUserRole from './pages/Admin/UpdateUserRole';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import NotFound from './components/NotFound';
import StoreManagerNotFound from './components/StoreManager/NotFound';

import { useAuthStore } from './store/useStore';
import { ROUTES } from './config/constants/routes';
import LoginPage from './pages/LoginPage';
import { CustomerDashboard } from './pages/Customer';

import CartPage from './pages/CartPage'; // Import the new CartPage
import Layout from './components/layout/Layout';
import StoreManagerOrders from './pages/StoreManager/Orders';
import DeliveryPartners from './pages/StoreManager/DeliveryPartners';

const App = () => {
  const { user } = useAuthStore();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignUpPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route
          path="/"
          element={
            <>
              <Layout>
                <CustomerDashboard />
              </Layout>
            </>
          }
        />
        <Route
          path={ROUTES.CART} // Add the new Cart route
          element={
            <Layout>
              <CartPage />
            </Layout>
          }
        />

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
          path={ROUTES.UPDATE_USER_ROLE}
          element={
            <ProtectedRoute role="admin">
              <UpdateUserRole />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.USER}
          element={
            <ProtectedRoute role="user">
              <CustomerDashboard />
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
          path={ROUTES.STORE_MANAGER}
          element={
            <ProtectedRoute role="store_manager">
              <StoreManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.STORE_MANAGER}/orders`}
          element={
            <ProtectedRoute role="store_manager">
              <StoreManagerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store_manager/delivery-partners"
          element={
            <ProtectedRoute role="store_manager">
              <DeliveryPartners />
            </ProtectedRoute>
          }
        />

        {/* Store Manager 404 Not Found */}
        <Route
          path={`${ROUTES.STORE_MANAGER}/*`}
          element={
            <ProtectedRoute role="store_manager">
              <StoreManagerNotFound />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
