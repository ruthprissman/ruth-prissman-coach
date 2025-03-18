import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, Calendar, CreditCard, Mail, LogOut,
  BarChart, User, Clock, DollarSign, Home
} from 'lucide-react';
import { supabaseClient as supabase } from '@/lib/supabaseClient';

interface Stats {
  totalPatients: number;
  upcomingAppointments: number;
  pendingPayments: number;
}

const Dashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    upcomingAppointments: 0,
    pendingPayments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Demo version - in a real app, these would be actual database queries
        // Here we're just simulating data for UI purposes
        // Replace with actual Supabase queries in production
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalPatients: 156,
          upcomingAppointments: 8,
          pendingPayments: 12
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const StatCard = ({ 
    title, value, icon: Icon, color 
  }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );

  const AdminButton = ({ 
    title, icon: Icon, onClick 
  }: { 
    title: string; 
    icon: React.ElementType; 
    onClick: () => void;
  }) => (
    <Button
      variant="outline"
      className="flex flex-col items-center justify-center h-32 w-full bg-white hover:bg-gray-50 border border-gray-200 text-[#4A235A]"
      onClick={onClick}
    >
      <Icon className="w-8 h-8 mb-2" />
      <span className="text-sm">{title}</span>
    </Button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Return to Homepage Button - Updated with Home icon from lucide-react */}
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
            <h1 className="text-2xl font-bold">לוח ניהול</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-6 text-right">סטטיסטיקה כללית</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="מטופלים" value={stats.totalPatients} icon={User} color="bg-blue-500" />
                <StatCard title="פגישות מתוכננות" value={stats.upcomingAppointments} icon={Clock} color="bg-green-500" />
                <StatCard title="תשלומים ממתינים" value={stats.pendingPayments} icon={DollarSign} color="bg-amber-500" />
              </div>
            </section>

            {/* Quick Access Section */}
            <section>
              <h2 className="text-xl font-bold mb-6 text-right">ניהול מהיר</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminButton title="ניהול מטופלים" icon={Users} onClick={() => navigate('/admin/patients')} />
                <AdminButton title="ניהול פגישות" icon={Calendar} onClick={() => navigate('/admin/appointments')} />
                <AdminButton title="ניהול תשלומים" icon={CreditCard} onClick={() => navigate('/admin/payments')} />
                <AdminButton title="שיווק במייל" icon={Mail} onClick={() => navigate('/admin/marketing')} />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
