import React, { useState, useEffect } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import CalendarContent from '@/components/admin/calendar/CalendarContent';
import CalendarHeader from '@/components/admin/calendar/CalendarHeader';
import { RecurringAvailabilityDialog } from '@/components/admin/calendar/RecurringAvailabilityDialog';
import { generateWeekDays } from '@/utils/calendarDataProcessing';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useCalendarOperations } from '@/hooks/useCalendarOperations';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { GoogleCalendarEvent, RecurringRule } from '@/types/calendar';
import { toast } from '@/components/ui/use-toast';
import { addDays, subDays, startOfWeek, addMonths } from 'date-fns';
import CalendarLegend from '@/components/admin/calendar/CalendarLegend';
import MeetingTypeLegend from '@/components/admin/calendar/MeetingTypeLegend';

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
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingGoogleEvents, setIsLoadingGoogleEvents] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCopyingMeetings, setIsCopyingMeetings] = useState(false);

  const days = generateWeekDays(currentDate);
  const hours = generateHours();

  // Use the Google OAuth hook
  const {
    isAuthenticated: isGoogleAuthenticated,
    isAuthenticating: isGoogleAuthenticating,
    error: googleAuthError,
    createEvent: googleCreateEvent,
    signInWithGoogle: handleSignInGoogle,
    signOut: handleSignOutGoogle,
    refreshAuth
  } = useGoogleOAuth();

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

  // Fetch Google events
  const fetchGoogleEvents = async () => {
    try {
      setIsLoadingGoogleEvents(true);
      
      console.log('📅 FETCH_EVENTS: Starting to fetch events...');
      
      if (!isGoogleAuthenticated) {
        console.log('📅 FETCH_EVENTS: Not authenticated, skipping');
        setGoogleEvents([]);
        return;
      }

      const { fetchGoogleCalendarEvents } = await import('@/services/GoogleOAuthService');
      const events = await fetchGoogleCalendarEvents(currentDate);
      
      console.log(`📅 FETCH_EVENTS: Successfully fetched ${events.length} events`);
      setGoogleEvents(events);
    } catch (error: any) {
      console.error('❌ FETCH_EVENTS: Error fetching events:', error);
      
      toast({
        title: 'שגיאה בטעינת אירועי Google Calendar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingGoogleEvents(false);
    }
  };

  // Check authentication and fetch events on mount and auth changes
  useEffect(() => {
    if (isGoogleAuthenticated) {
      fetchGoogleEvents();
    } else {
      setGoogleEvents([]);
    }
  }, [isGoogleAuthenticated, currentDate]);

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

  // Create event function using the hook
  const handleCreateEvent = async (
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description?: string
  ): Promise<string | null> => {
    try {
      console.log('🚀 CREATE_EVENT: Starting event creation via hook...', {
        summary,
        startDateTime,
        endDateTime,
        description,
        isAuthenticated: isGoogleAuthenticated
      });
      
      if (!isGoogleAuthenticated) {
        throw new Error('לא מחובר ליומן Google - נדרשת התחברות');
      }

      const eventId = await googleCreateEvent(summary, startDateTime, endDateTime, description);
      
      toast({
        title: 'האירוע נוצר בהצלחה',
        description: 'האירוע נוסף ליומן Google שלך',
      });
      
      // Refresh events after creating
      await fetchGoogleEvents();
      return eventId;
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
      <div className="container mx-auto py-6 space-y-4" dir="rtl">
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
        
        <div className="flex flex-wrap justify-end items-center gap-x-6 gap-y-2 px-1">
          <MeetingTypeLegend />
          <CalendarLegend />
        </div>

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
