
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Users, Calendar, CreditCard, Mail, LogOut,
  BarChart, User, Clock, DollarSign, Home,
  Globe, Pencil, ArrowUpRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabaseClient } from '@/lib/supabaseClient';
import { formatDateOnlyInIsrael, formatDateTimeInIsrael } from '@/utils/dateUtils';
import { ArticlePublication } from '@/types/article';

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
  const [upcomingPublications, setUpcomingPublications] = useState<ArticlePublication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublicationsLoading, setIsPublicationsLoading] = useState(true);

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

  useEffect(() => {
    const fetchUpcomingPublications = async () => {
      try {
        setIsPublicationsLoading(true);
        
        const client = await supabaseClient();
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const todayStr = today.toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const nextWeekStr = nextWeek.toISOString().split('T')[0]; // Get next week's date
        
        console.log(`Fetching publications from ${todayStr} to ${nextWeekStr}`);
        
        const { data, error } = await client
          .from('article_publications')
          .select(`
            id, 
            content_id,
            publish_location,
            scheduled_date,
            professional_content (
              title
            )
          `)
          .gte('scheduled_date', todayStr)
          .lte('scheduled_date', nextWeekStr)
          .is('published_date', null)
          .order('scheduled_date', { ascending: true })
          .limit(5);
        
        if (error) {
          throw error;
        }
        
        console.log("Upcoming publications data:", data);
        
        // Transform the data to match ArticlePublication type
        const transformedData = data?.map(item => ({
          id: item.id,
          content_id: item.content_id,
          publish_location: item.publish_location,
          scheduled_date: item.scheduled_date,
          published_date: null,
          professional_content: item.professional_content
        })) || [];
        
        setUpcomingPublications(transformedData as ArticlePublication[]);
        setIsPublicationsLoading(false);
      } catch (error) {
        console.error("Error fetching upcoming publications:", error);
        setIsPublicationsLoading(false);
      }
    };

    fetchUpcomingPublications();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'Email':
        return <Mail className="w-5 h-5 text-blue-500" />;
      case 'Website':
        return <Globe className="w-5 h-5 text-green-500" />;
      case 'WhatsApp':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600">
          <path d="M12 2C6.486 2 2 6.486 2 12c0 1.863.505 3.601 1.376 5.097L2 22l4.974-1.301A9.933 9.933 0 0 0 12 22c5.514 0 10-4.486 10-10S17.514 2 12 2m0 18c-1.632 0-3.145-.509-4.392-1.374l-.315-.185-3.27.856.865-3.196-.202-.34A7.944 7.944 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8m4.355-5.748c-.162-.08-1.007-.498-1.163-.555-.157-.057-.27-.084-.383.08-.112.164-.435.554-.532.668-.097.114-.194.129-.356.047-.162-.082-2.195-.814-3.1-2.359-.225-.388.225-.362.643-.12.129.77.229.16.294.161.165.005.356-.04.445-.12.106-.014.21-.174.314-.334.105-.16.14-.294.195-.488.056-.194.028-.362-.014-.488-.042-.127-.383-.985-.526-1.348-.14-.36-.283-.31-.382-.316-.099-.005-.213-.005-.326-.005-.113 0-.297.043-.452.207-.155.164-.59.58-.59 1.414 0 .834.608 1.641.693 1.755.084.115 1.182 1.805 2.866 2.53 1.08.471 1.477.509 2.018.431.32-.053 1.007-.412 1.15-.811.14-.4.14-.742.098-.815-.042-.072-.154-.115-.318-.196" />
        </svg>;
      case 'All':
      case 'Other':
      default:
        return <Pencil className="w-5 h-5 text-purple-500" />;
    }
  };

  const getLocationText = (location: string) => {
    switch (location) {
      case 'Email':
        return 'אימייל';
      case 'Website':
        return 'אתר';
      case 'WhatsApp':
        return 'וואטסאפ';
      case 'All':
      case 'Other':
      default:
        return 'אחר';
    }
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

  const PublicationItem = ({ publication }: { publication: ArticlePublication }) => (
    <div className="flex justify-between items-center border-b border-gray-100 py-3 last:border-0">
      <div className="flex flex-col items-center">
        {getLocationIcon(publication.publish_location)}
        <span className="text-xs mt-1 font-medium">{getLocationText(publication.publish_location)}</span>
      </div>
      <div className="flex items-center text-right">
        <Calendar className="w-4 h-4 ml-2 text-gray-600" />
        <span className="text-sm">
          {formatDateTimeInIsrael(publication.scheduled_date)}
        </span>
      </div>
    </div>
  );

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
            <h1 className="text-2xl font-bold">לוח ניהול</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Right sidebar: What's New Section */}
          <div className="order-1 md:order-2">
            <Card className="w-full mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Link to="/admin/articles" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  <span>לכל הפרסומים</span>
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                </Link>
                <CardTitle className="text-xl font-bold text-right">מה חדש?</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isPublicationsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : upcomingPublications.length > 0 ? (
                  <div className="space-y-1">
                    {upcomingPublications.map((publication) => (
                      <PublicationItem key={publication.id} publication={publication} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">אין פרסומים מתוכננים בקרוב</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8 order-2 md:order-1">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminButton title="ניהול מטופלים" icon={Users} onClick={() => navigate('/admin/patients')} />
                    <AdminButton title="ניהול פגישות" icon={Calendar} onClick={() => navigate('/admin/appointments')} />
                    <AdminButton title="ניהול תשלומים" icon={CreditCard} onClick={() => navigate('/admin/payments')} />
                    <AdminButton title="שיווק במייל" icon={Mail} onClick={() => navigate('/admin/marketing')} />
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
