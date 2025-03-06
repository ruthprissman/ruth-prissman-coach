
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, session } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Log authentication status for debugging
    if (user) {
      console.log('ProtectedRoute: User is authenticated', { userId: user.id });
    } else if (!isLoading) {
      console.log('ProtectedRoute: User is not authenticated, redirecting to login');
      console.log('Current location:', location.pathname);
    }
  }, [user, isLoading, location]);

  if (isLoading) {
    // Show loading state while authentication is being checked
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mr-3 text-gray-600">בודק סטטוס התחברות...</p>
      </div>
    );
  }

  if (!user) {
    console.log('Redirecting to login with state:', { from: location });
    // Redirect to login page but save the intended destination
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
