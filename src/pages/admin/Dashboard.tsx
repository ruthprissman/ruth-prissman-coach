import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, LogOut, Home, Mail, Globe, Pencil, ArrowUpRight, Phone, Monitor, User, BookOpen, BookText, CreditCard, Users, Banknote, Receipt } from 'lucide-react';
import { usePaymentStats } from '@/hooks/usePaymentStats';
import { supabaseClient } from '@/lib/supabaseClient';
import { formatDateTimeInIsrael } from '@/utils/dateUtils';
import { ArticlePublication } from '@/types/article';
import { FutureSession } from '@/types/session';
import { useIsMobile } from '@/hooks/use-mobile';
const Dashboard: React.FC = () => {
  const {
    signOut,
    user
  } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [upcomingPublications, setUpcomingPublications] = useState<ArticlePublication[]>([]);
  const [isPublicationsLoading, setIsPublicationsLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<(FutureSession & {
    patient_name?: string;
  })[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [subscriptionStats, setSubscriptionStats] = useState({
    contentSubscribers: {
      total: 0,
      newLast30Days: 0,
      loading: true
    },
    storySubscribers: {
      total: 0,
      newLast30Days: 0,
      loading: true
    }
  });
  const paymentStats = usePaymentStats();
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
        const {
          data,
          error
        } = await client.from('article_publications').select(`
            id, 
            content_id,
            publish_location,
            scheduled_date,
            professional_content (
              title
            )
          `).gte('scheduled_date', todayStr).lte('scheduled_date', nextWeekStr).is('published_date', null).order('scheduled_date', {
          ascending: true
        }).limit(5);
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
        const {
          data,
          error
        } = await client.from('future_sessions').select(`
            id, 
            patient_id,
            session_date,
            meeting_type,
            status,
            zoom_link,
            patients (
              name
            )
          `).gte('session_date', todayStr).lte('session_date', threeDaysLaterStr).eq('status', 'Scheduled').order('session_date', {
          ascending: true
        });
        if (error) {
          throw error;
        }
        console.log("Upcoming sessions data:", data);

        // Fix the type error by properly handling different response formats
        const transformedData = data?.map(item => {
          // Define the patient name with proper type narrowing
          let patientName = 'לקוח לא מזוהה';
          if (item.patients) {
            // If patients is an array with at least one element
            if (Array.isArray(item.patients) && item.patients.length > 0) {
              patientName = item.patients[0].name || 'לקוח לא מזוהה';
            }
            // If patients is a direct object with name property
            else if (typeof item.patients === 'object' && item.patients !== null) {
              patientName = (item.patients as {
                name?: string;
              }).name || 'לקוח לא מזוהה';
            }
          }
          return {
            id: item.id,
            patient_id: item.patient_id,
            session_date: item.session_date,
            meeting_type: item.meeting_type,
            status: item.status,
            zoom_link: item.zoom_link,
            patient_name: patientName
          };
        }) || [];
        setUpcomingSessions(transformedData);
        setIsSessionsLoading(false);
      } catch (error) {
        console.error("Error fetching upcoming sessions:", error);
        setIsSessionsLoading(false);
      }
    };
    const fetchSubscriptionStats = async () => {
      try {
        const client = await supabaseClient();

        // Calculate the date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

        // Fetch content subscribers statistics
        const {
          data: contentSubscribers,
          error: contentError
        } = await client.from('content_subscribers').select('joined_at').eq('is_subscribed', true);
        if (contentError) {
          console.error("Error fetching content subscribers:", contentError);
          throw contentError;
        }

        // Fetch story subscribers statistics
        const {
          data: storySubscribers,
          error: storyError
        } = await client.from('story_subscribers').select('joined_at').eq('is_subscribed', true);
        if (storyError) {
          console.error("Error fetching story subscribers:", storyError);
          throw storyError;
        }

        // Calculate total and new subscribers for content
        const totalContentSubscribers = contentSubscribers?.length || 0;
        const newContentSubscribers = contentSubscribers?.filter(sub => sub.joined_at && new Date(sub.joined_at) >= thirtyDaysAgo).length || 0;

        // Calculate total and new subscribers for stories
        const totalStorySubscribers = storySubscribers?.length || 0;
        const newStorySubscribers = storySubscribers?.filter(sub => sub.joined_at && new Date(sub.joined_at) >= thirtyDaysAgo).length || 0;

        // Update state with the calculated statistics
        setSubscriptionStats({
          contentSubscribers: {
            total: totalContentSubscribers,
            newLast30Days: newContentSubscribers,
            loading: false
          },
          storySubscribers: {
            total: totalStorySubscribers,
            newLast30Days: newStorySubscribers,
            loading: false
          }
        });
      } catch (error) {
        console.error("Error fetching subscription statistics:", error);
        setSubscriptionStats(prev => ({
          contentSubscribers: {
            ...prev.contentSubscribers,
            loading: false
          },
          storySubscribers: {
            ...prev.storySubscribers,
            loading: false
          }
        }));
      }
    };
    fetchUpcomingPublications();
    fetchUpcomingSessions();
    fetchSubscriptionStats();
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
  const PublicationItem = ({
    publication
  }: {
    publication: ArticlePublication;
  }) => <div className="flex flex-row-reverse justify-between items-center border-b border-gray-100 py-3 last:border-0">
      <div className="flex flex-col items-center">
        {getLocationIcon(publication.publish_location)}
        <span className="text-xs mt-1 font-medium">{getLocationText(publication.publish_location)}</span>
      </div>
      <div className="flex items-center">
        <span className="text-sm mr-2">
          {formatDateTimeInIsrael(publication.scheduled_date)}
        </span>
        <Calendar className="w-4 h-4 text-gray-600" />
      </div>
    </div>;
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
  const SessionItem = ({
    session
  }: {
    session: FutureSession & {
      patient_name?: string;
    };
  }) => <div className="flex flex-row-reverse justify-between items-center border-b border-gray-100 py-3 last:border-0">
      <div className="flex flex-col items-end">
        <div className="flex items-center mb-1">
          <span className="text-sm font-medium">{session.patient_name}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 text-gray-600 ml-2" />
          <span className="text-sm text-gray-600">
            {formatDateTimeInIsrael(session.session_date)}
          </span>
        </div>
        <div className="flex items-center mt-1">
          {getMeetingTypeIcon(session.meeting_type)}
          <span className="text-xs text-gray-500 mr-1">{getMeetingTypeText(session.meeting_type)}</span>
        </div>
      </div>
      <div className="flex flex-col items-start">
        {session.zoom_link && <a href={session.zoom_link} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 text-blue-500 hover:underline">
            לינק לזום
          </a>}
      </div>
    </div>;
  return <div className="min-h-screen bg-gray-100">
      <Link to="/" className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 flex flex-row-reverse items-center">
        <Home className="h-5 w-5 ml-2" />
        <span>חזרה לדף הבית</span>
      </Link>

      <header className="bg-[#4A235A] text-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-row-reverse justify-between items-center">
            <h1 className="text-2xl font-bold">לוח ניהול</h1>
            <Button variant="ghost" className="text-white hover:bg-purple-light" onClick={handleLogout}>
              <LogOut className="w-5 h-5 ml-2" />
              התנתקות
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center">
          {/* Dashboard cards grid - horizontal on desktop, vertical on mobile */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="w-full">
              <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-right">מה חדש?</CardTitle>
                <Link to="/admin/articles" className="text-sm text-blue-600 hover:text-blue-800 flex flex-row-reverse items-center">
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                  <span>לכל הפרסומים</span>
                </Link>
              </CardHeader>
              <CardContent className="pt-4 text-right">
                {isPublicationsLoading ? <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div> : upcomingPublications.length > 0 ? <div className="space-y-1 text-right">
                    {upcomingPublications.map(publication => <PublicationItem key={publication.id} publication={publication} />)}
                  </div> : <p className="text-center text-gray-500 py-4">אין פרסומים מתוכננים בקרוב</p>}
              </CardContent>
            </Card>

            <Card className="w-full ">
              <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-right">הפגישות הקרובות שלך</CardTitle>
                <Link to="/admin/calendar" className="text-sm text-blue-600 hover:text-blue-800 flex flex-row-reverse items-center">
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                  <span>ללוח הפגישות</span>
                </Link>
              </CardHeader>
              <CardContent className="pt-4 text-right">
                {isSessionsLoading ? <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div> : upcomingSessions.length > 0 ? <div className="space-y-1 text-right">
                    {upcomingSessions.map(session => <SessionItem key={session.id} session={session} />)}
                  </div> : <p className="text-center text-gray-500 py-4">אין פגישות מתוכננות בימים הקרובים</p>}
              </CardContent>
            </Card>
          </div>

          {/* Second row of cards - subscription stats and payment stats */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="w-full">
              <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-right">סטטיסטיקות מנויים</CardTitle>
                <div className="w-6"></div>
              </CardHeader>
              <CardContent className="pt-4 text-right">
                {subscriptionStats.contentSubscribers.loading || subscriptionStats.storySubscribers.loading ? <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div> : <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4 md:space-x-reverse">
                    <div className="flex-1 border-r-0 md:border-r border-gray-200 p-2 md:p-4">
                      <div className="flex flex-row-reverse items-center justify-start mb-2">
                        <BookOpen className="w-6 h-6 text-purple-600 ml-2" />
                        <span className="text-lg font-medium">מנויים לתוכן מקצועי</span>
                      </div>
                      {subscriptionStats.contentSubscribers.total > 0 ? <div className="text-right">
                          <p className="text-2xl font-bold">{subscriptionStats.contentSubscribers.total}</p>
                          <p className="text-sm text-gray-600">
                            {subscriptionStats.contentSubscribers.newLast30Days} חדשים ב-30 ימים האחרונים
                          </p>
                        </div> : <p className="text-right text-gray-500 py-2">אין מנויים רשומים</p>}
                    </div>
                    
                    <div className="flex-1 p-2 md:p-4">
                      <div className="flex flex-row-reverse items-center justify-start mb-2">
                        <BookText className="w-6 h-6 text-blue-600 ml-2" />
                        <span className="text-lg font-medium">מנויים לסיפורים</span>
                      </div>
                      {subscriptionStats.storySubscribers.total > 0 ? <div className="text-right">
                          <p className="text-2xl font-bold">{subscriptionStats.storySubscribers.total}</p>
                          <p className="text-sm text-gray-600">
                            {subscriptionStats.storySubscribers.newLast30Days} חדשים ב-30 ימים האחרונים
                          </p>
                        </div> : <p className="text-right text-gray-500 py-2">אין מנויים רשומים</p>}
                    </div>
                  </div>}
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-right">סטטיסטיקות תשלומים</CardTitle>
                <div className="w-6"></div>
              </CardHeader>
              <CardContent className="pt-4 text-right">
                {paymentStats.loading ? <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div> : paymentStats.totalReceived > 0 || paymentStats.outstandingBalance > 0 ? <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 md:space-x-4 md:space-x-reverse">
                    <div className="flex-1 border-r-0 md:border-r border-gray-200 p-2 md:p-4">
                      <div className="flex flex-row-reverse items-center justify-start mb-2">
                        <Banknote className="w-6 h-6 text-green-600 ml-2" />
                        <span className="text-lg font-medium">סה״כ שולם עד היום</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">₪{paymentStats.totalReceived.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-2 md:p-4">
                      <div className="flex flex-row-reverse items-center justify-start mb-2">
                        <Receipt className="w-6 h-6 text-amber-600 ml-2" />
                        <span className="text-lg font-medium">חוב פתוח לסגירה</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">₪{paymentStats.outstandingBalance.toLocaleString()}</p>
                      </div>
                    </div>
                  </div> : <p className="text-right text-gray-500 py-4">אין נתוני תשלומים זמינים</p>}
              </CardContent>
            </Card>
          </div>

          <div className="w-full mt-10">
            <h2 className="text-2xl font-bold text-right mb-6 text-[#4A235A]">ניהול מהיר</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link to="/admin/patients">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col items-center justify-center h-44 cursor-pointer">
                  <Users className="w-16 h-16 text-[#7E69AB] mb-4" />
                  <span className="text-xl font-bold text-[#4A235A]">ניהול לקוחות</span>
                </div>
              </Link>
              
              <Link to="/admin/calendar">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col items-center justify-center h-44 cursor-pointer">
                  <Calendar className="w-16 h-16 text-[#7E69AB] mb-4" />
                  <span className="text-xl font-bold text-[#4A235A]">ניהול פגישות</span>
                </div>
              </Link>
              
              <Link to="/admin/sessions">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col items-center justify-center h-44 cursor-pointer">
                  <CreditCard className="w-16 h-16 text-[#7E69AB] mb-4" />
                  <span className="text-xl font-bold text-[#4A235A]">ניהול תשלומים</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default Dashboard;