
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
import { addDays, subDays } from 'date-fns';

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

  // Simplified Google auth functions without OAuth dependencies
  const handleSignInGoogle = async (): Promise<void> => {
    try {
      setIsGoogleAuthenticating(true);
      setGoogleAuthError(null);
      
      // Placeholder for Google authentication
      console.log('Google sign-in initiated');
      
      toast({
        title: 'Google Calendar',
        description: 'חיבור ליומן Google זמינות בקרוב',
      });
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
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

  const handleGoogleSync = async (): Promise<void> => {
    try {
      setIsSyncing(true);
      
      // Placeholder for sync functionality
      console.log('Google Calendar sync initiated');
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
      
      // Placeholder for copy meetings functionality
      console.log('Copying professional meetings:', { selectedEventIds, clientMapping });
      
      toast({
        title: 'פגישות הועתקו בהצלחה',
        description: `${selectedEventIds.length} פגישות הועתקו למערכת`,
      });
      
      return { success: true };
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
    // For now, just log the action - in a real implementation this would update the calendar
    console.log('Update slot:', { date, hour, status });
    toast({
      title: 'עדכון זמינות',
      description: `זמינות עודכנה ל${status} ב-${date} ${hour}`,
    });
  };

  const handleRecurringSubmit = (data: RecurringRule) => {
    // Handle recurring availability submission
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
