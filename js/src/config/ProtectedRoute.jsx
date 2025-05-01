import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthStore } from '../store/useStore';
import { defineUserAbility } from '../ability/defineAbility';
import { LoadingSpinner } from '../components';
import Layout from '@/components/layout/Layout';
import { ROUTES } from '../config/constants/routes';
import { ROLES } from '../config/constants/roles';

const ProtectedRoute = ({ children, role }) => {
  const { user, setUser, ability, setAbility } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAbility, setCurrentAbility] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await fetchAuthSession();

        if (session?.tokens?.idToken) {
          const userRole = session.tokens.idToken.payload['custom:role']?.toLowerCase();

          if (!user) {
            setUser({ role: userRole });
          }

          // Initialize ability with the current session role
          const newAbility = defineUserAbility(userRole);
          setAbility(newAbility);
          setCurrentAbility(newAbility);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, setUser, setAbility]);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (location.pathname === ROUTES.PROFILE) return <Layout>{children}</Layout>;

  const roles = Array.isArray(role) ? role : [role];
  const normalizedRoles = roles.map((r) => r.toLowerCase());

  // Use the local ability state for authorization check
  const isAuthorized =
    currentAbility &&
    normalizedRoles.some((requiredRole) => currentAbility.can('view', requiredRole));
  if (!isAuthorized) return <Navigate to="/not-authorized" replace />;

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
