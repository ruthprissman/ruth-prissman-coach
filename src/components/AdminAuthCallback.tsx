
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminAuthCallbackProps {
  children: React.ReactNode;
}

const AdminAuthCallback: React.FC<AdminAuthCallbackProps> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mr-3 text-gray-600">מאמת הרשאות...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminAuthCallback;
