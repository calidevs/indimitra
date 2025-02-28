import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthStore } from '../store/useStore';
import { defineUserAbility } from '../ability/defineAbility';
import { LoadingSpinner } from '../components';
import Layout from '@/components/layout/Layout';

const ProtectedRoute = ({ children, role }) => {
  const { user, setUser, ability, setAbility } = useAuthStore();
  const [loading, setLoading] = useState(true);

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
        } else {
          console.warn('⚠️ No valid session tokens found.');
        }
      } catch (err) {
        console.error('❌ Error while checking authentication:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, setUser, setAbility]);

  if (loading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" />;
  if (!ability || !ability.can('view', role)) return <Navigate to="/not-authorized" />;

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
