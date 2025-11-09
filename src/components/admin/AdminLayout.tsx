
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Users, Calendar, ChevronRight, ChevronLeft, Menu, FileText, BookOpenText, BookIcon, Clock, CreditCard, ChartBar, Settings, GraduationCap, Mail, Paintbrush, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Close sidebar by default on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'דף הבית', icon: <Home className="ml-2 h-5 w-5" />, path: '/' }, // Added Home link
    { label: 'לוח ניהול', icon: <Home className="ml-2 h-5 w-5" />, path: '/admin/dashboard' },
    { label: 'ניהול לידים', icon: <Users className="ml-2 h-5 w-5" />, path: '/admin/leads' },
    { label: 'לקוחות', icon: <Users className="ml-2 h-5 w-5" />, path: '/admin/patients' },
    { label: 'כל הפגישות', icon: <Calendar className="ml-2 h-5 w-5" />, path: '/admin/sessions' },
    { label: 'ניהול זמינות', icon: <Clock className="ml-2 h-5 w-5" />, path: '/admin/calendar' },
    { label: 'ניהול כספים', icon: <CreditCard className="ml-2 h-5 w-5" />, path: '/admin/finances' },
    { label: 'ניתוחים גרפיים', icon: <ChartBar className="ml-2 h-5 w-5" />, path: '/admin/financial-analytics' },
    { label: 'הגדרות פיננסיות', icon: <Settings className="ml-2 h-5 w-5" />, path: '/admin/financial-settings' },
    { label: 'ניהול תרגילים', icon: <FileText className="ml-2 h-5 w-5" />, path: '/admin/exercises' },
    { label: 'ניהול מאמרים', icon: <BookOpenText className="ml-2 h-5 w-5" />, path: '/admin/articles' },
    { label: 'ניהול סיפורים', icon: <BookIcon className="ml-2 h-5 w-5" />, path: '/admin/stories' },
    { label: 'הזנת תוכן גולמי', icon: <PenLine className="ml-2 h-5 w-5" />, path: '/admin/email-items/new' },
    { label: 'עיצוב תבניות אימייל', icon: <Paintbrush className="ml-2 h-5 w-5" />, path: '/admin/email-templates' },
    { label: 'שליחת דפי נחיתה', icon: <Mail className="ml-2 h-5 w-5" />, path: '/admin/landing-pages' },
    { label: 'ניהול סדנאות', icon: <GraduationCap className="ml-2 h-5 w-5" />, path: '/admin/workshops' },
  ];

  // For debugging purposes
  console.log('Current location:', location.pathname);
  console.log('Nav items:', navItems.map(item => item.path));

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
                onClick={() => {
                  console.log(`Clicked on ${item.label} (${item.path})`);
                  if (isMobile) {
                    setSidebarOpen(false);
                  }
                }}
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
