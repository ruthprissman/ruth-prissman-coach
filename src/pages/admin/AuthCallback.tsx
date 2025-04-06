
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const { user, isLoading, checkIsAdmin } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!user || isChecking) return;
      
      setIsChecking(true);
      try {
        console.log('AuthCallback: Checking admin status for', user.email);
        
        if (user.email) {
          const adminStatus = await checkIsAdmin(user.email);
          console.log('AuthCallback: Admin status check result:', adminStatus);
          
          if (adminStatus) {
            console.log('User is admin, redirecting to dashboard');
            navigate('/admin/dashboard', { replace: true });
          } else {
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
        } else {
          console.log('No user email, redirecting to login');
          navigate('/admin/login', { replace: true });
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/', { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    if (user && !isLoading) {
      handleAuthCallback();
    } else if (!isLoading && !user) {
      navigate('/admin/login', { replace: true });
    }
  }, [user, isLoading, navigate, checkIsAdmin]);

  if (isLoading || isChecking) {
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
