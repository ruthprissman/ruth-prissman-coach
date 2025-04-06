
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = true }) => {
  const { user, isLoading, isAdmin, checkIsAdmin } = useAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!user || isVerifying) return;
      
      setIsVerifying(true);
      try {
        console.log('ProtectedRoute: Checking admin status for', user.email);
        
        if (user.email) {
          const adminStatus = await checkIsAdmin(user.email);
          console.log('ProtectedRoute: Admin status check result:', adminStatus);
          
          setHasAdminAccess(adminStatus);
          
          if (!adminStatus && requireAdmin) {
            console.log('User is not admin, will redirect to homepage');
            
            // Show unauthorized message using the toast component
            toast({
              title: "אין הרשאה",
              description: "אין לך הרשאה לגשת לאזור זה",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error in admin verification:', error);
        setHasAdminAccess(false);
      } finally {
        setIsVerifying(false); // Fix: Was incorrectly set to true
        setVerificationComplete(true);
      }
    };

    if (user && !isLoading && requireAdmin) {
      verifyAdmin();
    } else if (!isLoading) {
      setVerificationComplete(true);
    }
  }, [user, isLoading, checkIsAdmin, requireAdmin, toast]);

  // Show loading state while authentication is being checked
  if (isLoading || (user && requireAdmin && !verificationComplete)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mr-3 text-gray-600">בודק סטטוס התחברות...</p>
      </div>
    );
  }

  // Only redirect to login if isLoading is false and user is null
  if (!isLoading && !user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    // Redirect to login page but save the intended destination
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && verificationComplete && !hasAdminAccess) {
    console.log('User is not an admin, redirecting to homepage');
    // User is authenticated but not an admin - redirect to homepage
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
