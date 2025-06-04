
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

  // Get access token from Supabase session
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const supabase = supabaseClient();
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      if (session?.provider_token) {
        return session.provider_token;
      }
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  };

  // Check if signed in
  const checkIfSignedIn = async (): Promise<boolean> => {
    const token = await getAccessToken();
    return !!token;
  };

  // Sign in with Google using Supabase
  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      setIsGoogleAuthenticating(true);
      setGoogleAuthError(null);
      
      const supabase = supabaseClient();
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
        console.error('Error signing in with Google via Supabase:', error);
        throw error;
      }
      
      return true;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setGoogleAuthError(error.message || 'שגיאה בהתחברות ליומן Google');
      
      toast({
        title: 'שגיאה בהתחברות',
        description: error.message || 'שגיאה בהתחברות ליומן Google',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsGoogleAuthenticating(false);
    }
  };

  // Sign out from Google
  const signOutFromGoogle = async (): Promise<void> => {
    try {
      const supabase = supabaseClient();
      await supabase.auth.signOut();
      setIsGoogleAuthenticated(false);
      setGoogleEvents([]);
      
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

  // Fetch Google Calendar events
  const fetchGoogleCalendarEvents = async (currentDisplayDate?: Date): Promise<GoogleCalendarEvent[]> => {
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('אין הרשאות גישה ליומן Google');
      }
      
      const now = currentDisplayDate || new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const twoMonthsLater = addMonths(weekStart, 2);
      
      const timeMin = encodeURIComponent(weekStart.toISOString());
      const timeMax = encodeURIComponent(twoMonthsLater.toISOString());
      
      const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
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
      
      return events;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }
  };

  // Create Google Calendar event
  const createGoogleCalendarEvent = async (
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description: string = '',
  ): Promise<string | null> => {
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('אין הרשאות גישה ליומן Google');
      }
      
      const event = {
        'summary': summary,
        'description': description,
        'start': {
          'dateTime': startDateTime,
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        'end': {
          'dateTime': endDateTime,
          'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create calendar event');
      }
      
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        const isSignedIn = await checkIfSignedIn();
        setIsGoogleAuthenticated(isSignedIn);
        
        if (isSignedIn) {
          await fetchGoogleEvents();
        }
      } catch (error: any) {
        console.error('Error checking Google auth:', error);
        setGoogleAuthError(error.message);
      }
    };

    checkGoogleAuth();
  }, []);

  const fetchGoogleEvents = async () => {
    try {
      setIsLoadingGoogleEvents(true);
      setGoogleAuthError(null);
      
      const events = await fetchGoogleCalendarEvents(currentDate);
      setGoogleEvents(events);
      
      console.log(`Fetched ${events.length} Google Calendar events`);
    } catch (error: any) {
      console.error('Error fetching Google events:', error);
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
    const success = await signInWithGoogle();
    if (success) {
      setIsGoogleAuthenticated(true);
      await fetchGoogleEvents();
      
      toast({
        title: 'התחברות בוצעה בהצלחה',
        description: 'התחברת בהצלחה ליומן Google',
      });
    }
  };

  const handleSignOutGoogle = async (): Promise<void> => {
    await signOutFromGoogle();
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

  // Create event function for the form
  const handleCreateEvent = async (
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description?: string
  ): Promise<string | null> => {
    try {
      console.log('Creating Google Calendar event:', { summary, startDateTime, endDateTime, description });
      
      if (!isGoogleAuthenticated) {
        throw new Error('לא מחובר ליומן Google');
      }

      const eventId = await createGoogleCalendarEvent(summary, startDateTime, endDateTime, description);
      
      if (eventId) {
        toast({
          title: 'האירוע נוצר בהצלחה',
          description: 'האירוע נוסף ליומן Google שלך',
        });
        
        // Refresh events after creating
        await fetchGoogleEvents();
        return eventId;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error creating Google Calendar event:', error);
      toast({
        title: 'שגיאה ביצירת האירוע',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
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
