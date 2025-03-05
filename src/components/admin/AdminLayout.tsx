
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Users, Calendar, ChevronRight, ChevronLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'דף הבית', icon: <Home className="ml-2 h-5 w-5" />, path: '/admin/dashboard' },
    { label: 'מטופלים', icon: <Users className="ml-2 h-5 w-5" />, path: '/admin/patients' },
    { label: 'כל הפגישות', icon: <Calendar className="ml-2 h-5 w-5" />, path: '/admin/sessions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 bg-white shadow-lg transform z-30 transition-transform duration-300 ease-in-out",
          isMobile ? (sidebarOpen ? "translate-x-0" : "translate-x-full") : "translate-x-0 w-64"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary">לוח ניהול</h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center py-3 px-4 rounded-md hover:bg-gray-100 transition-colors",
                  location.pathname === item.path && "bg-primary/10 text-primary font-medium"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="ml-2 h-4 w-4" />
              התנתקות
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          isMobile ? "w-full" : sidebarOpen ? "mr-64" : "mr-0"
        )}
      >
        {/* Mobile header */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex"
            >
              {sidebarOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          )}
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="w-10"></div> {/* Placeholder for balance */}
        </header>
        
        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
