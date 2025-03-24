
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, LogOut, Home,
  Mail, Globe, Pencil, ArrowUpRight,
  Phone, Monitor, User
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';
import { formatDateTimeInIsrael } from '@/utils/dateUtils';
import { ArticlePublication } from '@/types/article';
import { FutureSession } from '@/types/session';

const Dashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [upcomingPublications, setUpcomingPublications] = useState<ArticlePublication[]>([]);
  const [isPublicationsLoading, setIsPublicationsLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<(FutureSession & { patient_name?: string })[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);

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

    const fetchUpcomingSessions = async () => {
      try {
        setIsSessionsLoading(true);
        
        const client = await supabaseClient();
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);
        
        const todayStr = today.toISOString().split('T')[0]; 
        const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];
        
        console.log(`Fetching sessions from ${todayStr} to ${threeDaysLaterStr}`);
        
        const { data, error } = await client
          .from('future_sessions')
          .select(`
            id, 
            patient_id,
            session_date,
            meeting_type,
            status,
            zoom_link,
            patients (
              name
            )
          `)
          .gte('session_date', todayStr)
          .lte('session_date', threeDaysLaterStr)
          .eq('status', 'Scheduled')
          .order('session_date', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        console.log("Upcoming sessions data:", data);
        
        // Transform the data to include patient name
        const transformedData = data?.map(item => ({
          id: item.id,
          patient_id: item.patient_id,
          session_date: item.session_date,
          meeting_type: item.meeting_type,
          status: item.status,
          zoom_link: item.zoom_link,
          patient_name: item.patients?.name || 'לקוח לא מזוהה'
        })) || [];
        
        setUpcomingSessions(transformedData);
        setIsSessionsLoading(false);
      } catch (error) {
        console.error("Error fetching upcoming sessions:", error);
        setIsSessionsLoading(false);
      }
    };

    fetchUpcomingPublications();
    fetchUpcomingSessions();
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

  const getMeetingTypeIcon = (meetingType: string) => {
    switch (meetingType) {
      case 'Phone':
        return <Phone className="w-5 h-5 text-blue-500" />;
      case 'Zoom':
        return <Monitor className="w-5 h-5 text-purple-500" />;
      case 'In-Person':
        return <User className="w-5 h-5 text-green-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMeetingTypeText = (meetingType: string) => {
    switch (meetingType) {
      case 'Phone':
        return 'טלפוני';
      case 'Zoom':
        return 'זום';
      case 'In-Person':
        return 'פרונטלי';
      default:
        return meetingType;
    }
  };

  const SessionItem = ({ session }: { session: FutureSession & { patient_name?: string } }) => (
    <div className="flex justify-between items-center border-b border-gray-100 py-3 last:border-0">
      <div className="flex flex-col items-start">
        {session.zoom_link && (
          <a 
            href={session.zoom_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs mt-1 text-blue-500 hover:underline"
          >
            לינק לזום
          </a>
        )}
      </div>
      <div className="flex flex-col items-end">
        <div className="flex items-center mb-1">
          <span className="text-sm font-medium">{session.patient_name}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 ml-2">
            {formatDateTimeInIsrael(session.session_date)}
          </span>
          <Calendar className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex items-center mt-1">
          <span className="text-xs text-gray-500 ml-1">{getMeetingTypeText(session.meeting_type)}</span>
          {getMeetingTypeIcon(session.meeting_type)}
        </div>
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
        <div className="flex flex-col items-center">
          {/* "What's New" section */}
          <div className="w-full md:w-96 mb-6">
            <Card className="w-full">
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

          {/* Upcoming Sessions section */}
          <div className="w-full md:w-96">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Link to="/admin/calendar" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  <span>ללוח הפגישות</span>
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                </Link>
                <CardTitle className="text-xl font-bold text-right">הפגישות הקרובות שלך</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isSessionsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : upcomingSessions.length > 0 ? (
                  <div className="space-y-1">
                    {upcomingSessions.map((session) => (
                      <SessionItem key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">אין פגישות מתוכננות בימים הקרובים</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
