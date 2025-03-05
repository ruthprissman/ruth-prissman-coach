
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Users, Calendar, CreditCard, Mail, LayoutDashboard } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Return to Homepage Button */}
      <Link to="/" className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 flex items-center">
        <Home className="h-5 w-5 mr-2" />
        <span>חזרה לדף הבית</span>
      </Link>

      {/* Header */}
      <header className="bg-[#4A235A] text-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-purple-light"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 ml-2" />
              התנתקות
            </Button>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-end space-x-6 space-x-reverse py-3">
            <Link to="/admin/dashboard" className="text-gray-600 hover:text-[#4A235A] flex items-center">
              <LayoutDashboard className="w-4 h-4 ml-1" />
              <span>לוח בקרה</span>
            </Link>
            <Link to="/admin/patients" className="text-gray-600 hover:text-[#4A235A] flex items-center">
              <Users className="w-4 h-4 ml-1" />
              <span>מטופלים</span>
            </Link>
            <Link to="/admin/appointments" className="text-gray-600 hover:text-[#4A235A] flex items-center">
              <Calendar className="w-4 h-4 ml-1" />
              <span>פגישות</span>
            </Link>
            <Link to="/admin/payments" className="text-gray-600 hover:text-[#4A235A] flex items-center">
              <CreditCard className="w-4 h-4 ml-1" />
              <span>תשלומים</span>
            </Link>
            <Link to="/admin/marketing" className="text-gray-600 hover:text-[#4A235A] flex items-center">
              <Mail className="w-4 h-4 ml-1" />
              <span>שיווק</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
