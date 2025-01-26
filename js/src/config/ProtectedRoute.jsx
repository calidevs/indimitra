import React from 'react';
import { Navigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await fetchAuthSession();
        console.log('Authenticated user:', user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Not authenticated:', err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
