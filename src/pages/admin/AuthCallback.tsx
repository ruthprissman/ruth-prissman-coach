
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const { user, isLoading, isAdmin, checkIsAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (user && !isLoading) {
        if (isAdmin) {
          console.log('User is admin, redirecting to dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else {
          // Double-check admin status to be sure
          if (user.email) {
            const adminStatus = await checkIsAdmin(user.email);
            if (adminStatus) {
              console.log('User is admin (verified), redirecting to dashboard');
              navigate('/admin/dashboard', { replace: true });
              return;
            }
          }
          
          console.log('User is not admin, redirecting to homepage');
          navigate('/', { replace: true });
          
          // Show unauthorized message
          const toast = document.createElement('div');
          toast.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-md shadow-md z-50';
          toast.innerHTML = 'אין לך הרשאה לגשת לאזור זה';
          document.body.appendChild(toast);
          
          // Remove the toast after 5 seconds
          setTimeout(() => {
            if (toast.parentNode) {
              toast.parentNode.removeChild(toast);
            }
          }, 5000);
        }
      }
    };

    if (!isLoading) {
      handleAuthCallback();
    }
  }, [user, isLoading, isAdmin, navigate, checkIsAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mr-3 text-gray-600">מאמת הרשאות...</p>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
