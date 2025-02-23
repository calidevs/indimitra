import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuthStore } from '../store/useStore';
import { defineUserAbility } from '../ability/defineAbility';
import { LoadingSpinner } from '../components';

const ProtectedRoute = ({ children, role }) => {
  const { user, setUser, ability, setAbility } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          const userRole = session.tokens.idToken.payload['custom:role'].toLowerCase(); // Convert to lowercase

          if (!user) {
            setUser({ role: userRole });
          }

          const newAbility = defineUserAbility(userRole);
          setAbility(newAbility);

          console.log('🟢 User Role:', userRole);
          console.log('🟢 Defined Ability Rules:', newAbility.rules);
          console.log('🟢 Checking Ability: Can View', role, '?', newAbility.can('view', role));
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

  if (!user) return <Navigate to="/login" replace />;
  if (!ability || !ability.can('view', role)) return <Navigate to="/not-authorized" replace />;

  return children;
};

export default ProtectedRoute;
