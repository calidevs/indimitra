import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme';

import Products from './pages/Products';
import ProtectedRoute from './config/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import SignUpPage from './pages/SignUp/SignUp';
import AdminDashboard from './pages/Admin/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import StoreManagerDashboard from './pages/StoreManagerDashboard';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import NotFound from './components/NotFound';
import StoreManagerNotFound from './components/StoreManager/NotFound';
import DeliveryFees from './pages/StoreManager/DeliveryFees';
import PaymentSettings from './pages/StoreManager/PaymentSettings';

import { useAuthStore } from './store/useStore';
import { ROUTES } from './config/constants/routes';
import LoginPage from './pages/LoginPage';
import { CustomerDashboard } from './pages/Customer';

import CartPage from './pages/CartPage';
import Layout from './components/layout/Layout';
import StoreManagerOrders from './pages/StoreManager/Orders';
import DeliveryPartners from './pages/StoreManager/DeliveryPartners';
import Inventory from './pages/StoreManager/Inventory';
import LocationCodes from './pages/StoreManager/LocationCodes';
import PickupAddresses from '@/pages/StoreManager/PickupAddresses';

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
          path={ROUTES.CART}
          element={
            <Layout>
              <CartPage />
            </Layout>
          }
        />

        {/* Protected Routes */}
        <Route
          path={`${ROUTES.ADMIN}/*`}
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
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DELIVERY_AGENT}
          element={
            <ProtectedRoute role="delivery_agent">
              <DriverDashboard />
            </ProtectedRoute>
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
        <Route
          path="/store_manager/inventory"
          element={
            <ProtectedRoute role="store_manager">
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store_manager/delivery-fees"
          element={
            <ProtectedRoute role="store_manager">
              <DeliveryFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store_manager/location-codes"
          element={
            <ProtectedRoute role="store_manager">
              <LocationCodes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store_manager/pickup-addresses"
          element={
            <ProtectedRoute role="store_manager">
              <PickupAddresses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store_manager/payment-settings"
          element={
            <ProtectedRoute role="store_manager">
              <PaymentSettings />
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
