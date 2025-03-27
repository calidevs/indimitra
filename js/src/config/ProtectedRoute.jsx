import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthStore } from '../store/useStore';
import { defineUserAbility } from '../ability/defineAbility';
import { LoadingSpinner } from '../components';
import Layout from '@/components/layout/Layout';
import { ROUTES } from '../config/constants/routes';
import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const { user, setUser, ability, setAbility } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await fetchAuthSession();

        if (session?.tokens?.idToken) {
          const userRole = session.tokens.idToken.payload['custom:role'].toLowerCase();

          if (!user) {
            setUser({ role: userRole });
          }

          const newAbility = defineUserAbility(userRole);
          setAbility(newAbility);

          setIsAuthenticated(true);
        } else {
          console.warn('⚠️ No valid session tokens found.');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('❌ Error while checking authentication:', err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, setUser, setAbility]);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (location.pathname === ROUTES.PROFILE) return <Layout>{children}</Layout>;

  if (!ability || !ability.can('view', role)) return <Navigate to="/not-authorized" replace />;

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
