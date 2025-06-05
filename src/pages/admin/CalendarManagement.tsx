import React, { useState, useEffect } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import CalendarContent from '@/components/admin/calendar/CalendarContent';
import CalendarHeader from '@/components/admin/calendar/CalendarHeader';
import { RecurringAvailabilityDialog } from '@/components/admin/calendar/RecurringAvailabilityDialog';
import { generateWeekDays } from '@/utils/calendarDataProcessing';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useCalendarOperations } from '@/hooks/useCalendarOperations';
import { GoogleCalendarEvent, RecurringRule } from '@/types/calendar';
import { toast } from '@/components/ui/use-toast';
import { addDays, subDays, startOfWeek, addMonths } from 'date-fns';
import { supabaseClient } from '@/lib/supabaseClient';

// Create a query client instance
const queryClient = new QueryClient();

// Generate hours from 8:00 to 23:00
const generateHours = () => {
  return Array.from({ length: 16 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
};

const CalendarManagementContent: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingGoogleEvents, setIsLoadingGoogleEvents] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCopyingMeetings, setIsCopyingMeetings] = useState(false);
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);

  const days = generateWeekDays(currentDate);
  const hours = generateHours();

  const { calendarData, setCalendarData, isLoading, fetchAvailabilityData } = useCalendarData(
    currentDate,
    googleEvents,
    isGoogleAuthenticated
  );

  const { 
    tableExists,
    checkTableExists,
    createCalendarSlotsTable,
    applyDefaultAvailability
  } = useCalendarOperations();

  // Get current access token from session
  const getCurrentAccessToken = async (): Promise<string | null> => {
    try {
      console.log('🔑 TOKEN_DEBUG: Getting current access token...');
      const supabase = supabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔑 TOKEN_DEBUG: Error getting session:', error);
        return null;
      }
      
      if (!session) {
        console.log('🔑 TOKEN_DEBUG: No session found');
        return null;
      }
      
      console.log('🔑 TOKEN_DEBUG: Session found:', {
        hasUser: !!session.user,
        hasProviderToken: !!session.provider_token,
        tokenLength: session.provider_token?.length || 0,
        provider: session.user?.app_metadata?.provider
      });
      
      if (session.provider_token) {
        console.log('🔑 TOKEN_DEBUG: Found provider token');
        setCurrentAccessToken(session.provider_token);
        return session.provider_token;
      }
      
      console.log('🔑 TOKEN_DEBUG: No provider token found');
      return null;
    } catch (error: any) {
      console.error('🔑 TOKEN_DEBUG: Error getting access token:', error);
      return null;
    }
  };

  // Check authentication status
  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        console.log('🔍 AUTH_CHECK: Starting authentication check...');
        const token = await getCurrentAccessToken();
        
        if (token) {
          console.log('✅ AUTH_CHECK: Authentication successful');
          setIsGoogleAuthenticated(true);
          setGoogleAuthError(null);
          await fetchGoogleEvents();
        } else {
          console.log('❌ AUTH_CHECK: No authentication found');
          setIsGoogleAuthenticated(false);
          setCurrentAccessToken(null);
        }
      } catch (error: any) {
        console.error('❌ AUTH_CHECK: Error in authentication check:', error);
        setGoogleAuthError(error.message);
        setIsGoogleAuthenticated(false);
        setCurrentAccessToken(null);
      }
    };

    checkGoogleAuth();
  }, []);

  const fetchGoogleEvents = async () => {
    try {
      setIsLoadingGoogleEvents(true);
      setGoogleAuthError(null);
      
      console.log('📅 FETCH_EVENTS: Starting to fetch events...');
      const token = await getCurrentAccessToken();
      
      if (!token) {
        throw new Error('לא מחובר ליומן Google');
      }

      const now = currentDate || new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const twoMonthsLater = addMonths(weekStart, 2);
      
      const timeMin = encodeURIComponent(weekStart.toISOString());
      const timeMax = encodeURIComponent(twoMonthsLater.toISOString());
      
      const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      console.log('📅 FETCH_EVENTS: Fetching from URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📅 FETCH_EVENTS: Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('📅 FETCH_EVENTS: API error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to fetch calendar events');
      }
      
      const data = await response.json();
      
      const events: GoogleCalendarEvent[] = data.items.map((item: any) => ({
        id: item.id,
        summary: item.summary || 'אירוע ללא כותרת',
        description: item.description || '',
        start: item.start,
        end: item.end,
        status: item.status || 'confirmed',
        syncStatus: 'google-only'
      }));
      
      console.log(`📅 FETCH_EVENTS: Successfully fetched ${events.length} events`);
      setGoogleEvents(events);
    } catch (error: any) {
      console.error('❌ FETCH_EVENTS: Error fetching events:', error);
      setGoogleAuthError(error.message || 'שגיאה בטעינת אירועי Google Calendar');
      
      toast({
        title: 'שגיאה בטעינת אירועי Google Calendar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGoogleEvents(false);
    }
  };

  const handleSignInGoogle = async (): Promise<void> => {
    try {
      setIsGoogleAuthenticating(true);
      setGoogleAuthError(null);
      
      console.log('🔐 SIGNIN: Starting Google sign-in...');
      const supabase = supabaseClient();
      
      // Use specific scopes that include write permissions
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
          redirectTo: window.location.origin + '/admin/dashboard',
          queryParams: {
            prompt: 'consent',
            access_type: 'offline'
          }
        }
      });
      
      if (error) {
        console.error('🔐 SIGNIN: Sign-in error:', error);
        throw error;
      }
      
      console.log('🔐 SIGNIN: Sign-in initiated successfully');
    } catch (error: any) {
      console.error('❌ SIGNIN: Error signing in:', error);
      setGoogleAuthError(error.message || 'שגיאה בהתחברות ליומן Google');
      
      toast({
        title: 'שגיאה בהתחברות',
        description: error.message || 'שגיאה בהתחברות ליומן Google',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleAuthenticating(false);
    }
  };

  const handleSignOutGoogle = async (): Promise<void> => {
    try {
      const supabase = supabaseClient();
      await supabase.auth.signOut();
      setIsGoogleAuthenticated(false);
      setGoogleEvents([]);
      setCurrentAccessToken(null);
      
      toast({
        title: 'התנתקות בוצעה בהצלחה',
        description: 'התנתקת בהצלחה מיומן Google',
      });
    } catch (error: any) {
      console.error('Error signing out from Google:', error);
      toast({
        title: 'שגיאה בהתנתקות',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGoogleSync = async (): Promise<void> => {
    try {
      setIsSyncing(true);
      await fetchGoogleEvents();
      await fetchAvailabilityData();
      
      toast({
        title: 'סנכרון הושלם בהצלחה',
        description: 'הנתונים סונכרנו עם Google Calendar',
      });
    } catch (error: any) {
      console.error('Error syncing with Google:', error);
      toast({
        title: 'שגיאה בסנכרון',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyProfessionalMeetings = async (
    selectedEventIds: string[],
    clientMapping: Record<string, number | null>
  ): Promise<any> => {
    try {
      setIsCopyingMeetings(true);
      
      const { copyProfessionalMeetingsToFutureSessions } = await import('@/utils/googleCalendarUtils');
      const result = await copyProfessionalMeetingsToFutureSessions(
        googleEvents,
        selectedEventIds,
        clientMapping
      );
      
      toast({
        title: 'פגישות הועתקו בהצלחה',
        description: `${result.added} פגישות הועתקו למערכת`,
      });
      
      await fetchAvailabilityData();
      
      return result;
    } catch (error: any) {
      console.error('Error copying meetings:', error);
      toast({
        title: 'שגיאה בהעתקת פגישות',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsCopyingMeetings(false);
    }
  };

  // Create event function with proper token validation
  const handleCreateEvent = async (
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description?: string
  ): Promise<string | null> => {
    try {
      console.log('🚀 CREATE_EVENT: Starting event creation...', {
        summary,
        startDateTime,
        endDateTime,
        description
      });
      
      // Get fresh token
      const token = await getCurrentAccessToken();
      console.log('🚀 CREATE_EVENT: Token check result:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        isAuthenticated: isGoogleAuthenticated
      });
      
      if (!token) {
        console.error('🚀 CREATE_EVENT: No access token available');
        throw new Error('לא מחובר ליומן Google - נדרשת התחברות מחדש');
      }

      const event = {
        'summary': summary,
        'description': description || '',
        'start': {
          'dateTime': startDateTime,
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        'end': {
          'dateTime': endDateTime,
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      console.log('🚀 CREATE_EVENT: Event object created:', event);
      console.log('🚀 CREATE_EVENT: Making API request...');
      
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      
      console.log('🚀 CREATE_EVENT: API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('🚀 CREATE_EVENT: API error response:', errorData);
        
        if (response.status === 401) {
          // Token expired, clear authentication state
          setIsGoogleAuthenticated(false);
          setCurrentAccessToken(null);
          throw new Error('אסימון Google פג תוקף - נדרשת התחברות מחדש');
        } else if (response.status === 403) {
          throw new Error('אין הרשאות לכתוב ליומן Google - נדרשת התחברות מחדש עם הרשאות מלאות');
        }
        
        throw new Error(errorData.error?.message || `שגיאה ביצירת אירוע: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🚀 CREATE_EVENT: Event created successfully:', {
        eventId: data.id,
        htmlLink: data.htmlLink
      });
      
      toast({
        title: 'האירוע נוצר בהצלחה',
        description: 'האירוע נוסף ליומן Google שלך',
      });
      
      // Refresh events after creating
      await fetchGoogleEvents();
      return data.id;
    } catch (error: any) {
      console.error('❌ CREATE_EVENT: Event creation failed:', error);
      toast({
        title: 'שגיאה ביצירת האירוע',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleNavigateWeek = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next' 
      ? addDays(currentDate, 7) 
      : subDays(currentDate, 7);
    setCurrentDate(newDate);
  };

  const handleUpdateSlot = (date: string, hour: string, status: 'available' | 'private' | 'unspecified') => {
    console.log('Update slot:', { date, hour, status });
    toast({
      title: 'עדכון זמינות',
      description: `זמינות עודכנה ל${status} ב-${date} ${hour}`,
    });
  };

  const handleRecurringSubmit = (data: RecurringRule) => {
    console.log('Recurring availability:', data);
    toast({
      title: 'זמינות חוזרת נוספה',
      description: `נוספה זמינות חוזרת ליום ${data.day}`,
    });
    fetchAvailabilityData();
  };

  return (
    <AdminLayout title="ניהול זמינות יומן">
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        <CalendarHeader
          isGoogleAuthenticated={isGoogleAuthenticated}
          isGoogleAuthenticating={isGoogleAuthenticating}
          googleAuthError={googleAuthError}
          googleEvents={googleEvents}
          isSyncing={isSyncing}
          isCopyingMeetings={isCopyingMeetings}
          isLoadingGoogleEvents={isLoadingGoogleEvents}
          onSignInGoogle={handleSignInGoogle}
          onSignOutGoogle={handleSignOutGoogle}
          onGoogleSync={handleGoogleSync}
          onCopyProfessionalMeetings={handleCopyProfessionalMeetings}
        />
        
        <CalendarContent
          days={days}
          hours={hours}
          currentDate={currentDate}
          calendarData={calendarData}
          isLoading={isLoading}
          onNavigateWeek={handleNavigateWeek}
          onUpdateSlot={handleUpdateSlot}
          onSetCurrentDate={setCurrentDate}
          onRecurringDialogOpen={() => setRecurringDialogOpen(true)}
          onCreateEvent={handleCreateEvent}
        />
        
        <RecurringAvailabilityDialog
          open={recurringDialogOpen}
          onOpenChange={setRecurringDialogOpen}
          onSubmit={handleRecurringSubmit}
        />
      </div>
    </AdminLayout>
  );
};

const CalendarManagement: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarManagementContent />
    </QueryClientProvider>
  );
};

export default CalendarManagement;
