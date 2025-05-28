import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, format, startOfWeek, startOfDay } from 'date-fns';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useCalendarOperations } from '@/hooks/useCalendarOperations';
import { useCalendarData } from '@/hooks/useCalendarData';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CalendarHeader from '@/components/admin/calendar/CalendarHeader';
import CalendarContent from '@/components/admin/calendar/CalendarContent';
import { RecurringAvailabilityDialog } from '@/components/admin/calendar/RecurringAvailabilityDialog';
import DebugLogPanel from '@/components/admin/calendar/DebugLogPanel';
import { toast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { forcePageRefresh, logComponentVersions } from '@/utils/debugUtils';
import { copyProfessionalMeetingsToFutureSessions } from '@/utils/googleCalendarUtils';

// Component version for debugging
const COMPONENT_VERSION = "1.3.0";
console.log(`LOV_DEBUG_CALENDAR_MGMT: Component loaded, version ${COMPONENT_VERSION}`);

const CalendarManagement: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [recurringDialogOpen, setRecurringDialogOpen] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLogs, setShowDebugLogs] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCopyingMeetings, setIsCopyingMeetings] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<string>(new Date().toLocaleTimeString());
  
  // Track if we've loaded events for this date range
  const loadedDatesRef = useRef<Set<string>>(new Set());

  const { settings, isLoading: isLoadingSettings } = useCalendarSettings();
  const { tableExists, checkTableExists, createCalendarSlotsTable, applyDefaultAvailability } = useCalendarOperations();
  const { 
    isAuthenticated: isGoogleAuthenticated,
    isAuthenticating: isGoogleAuthenticating,
    error: googleAuthError,
    events: googleEvents,
    isLoadingEvents: isLoadingGoogleEvents,
    signIn: signInWithGoogle,
    signOut: signOutFromGoogle,
    fetchEvents: fetchGoogleEvents
  } = useGoogleOAuth();

  const { calendarData, isLoading, fetchAvailabilityData, debugVersion } = useCalendarData(
    currentDate,
    googleEvents,
    isGoogleAuthenticated
  );

  // Log initial debugging information
  useEffect(() => {
    console.log(`LOV_DEBUG_CALENDAR_MGMT: Initialization with date ${currentDate.toISOString()}`);
    console.log(`LOV_DEBUG_CALENDAR_MGMT: Google authenticated: ${isGoogleAuthenticated}, events: ${googleEvents.length}`);
    
    // Log all component versions
    logComponentVersions();
  }, []);

  const hours = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const generateDaysOfWeek = (startDate: Date) => {
    console.log(`LOV_DEBUG_CALENDAR_MGMT: Generating days of week from ${startDate.toISOString()}`);
    
    // Fix: Correctly set weekStartsOn to 0 (Sunday)
    const weekStart = startOfDay(startDate);
    
    // Get the current day of week (0-6, where 0 is Sunday)
    const currentDayOfWeek = weekStart.getDay();
    
    // Calculate how many days to go back to get to Sunday
    const daysToSunday = currentDayOfWeek;
    
    // Get the Sunday of the current week
    const sundayOfThisWeek = addDays(weekStart, -daysToSunday);
    console.log(`LOV_DEBUG_CALENDAR_MGMT: Sunday of this week: ${sundayOfThisWeek.toISOString()}`);

    const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    // Generate the 7 days starting from Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(sundayOfThisWeek, i);
      const dayNumber = date.getDay();
      return {
        date: format(date, 'yyyy-MM-dd'),
        label: `${hebrewDayNames[dayNumber]} ${format(date, 'dd/MM')}`,
        dayNumber: i
      };
    });
  };

  const days = generateDaysOfWeek(currentDate);

  const navigateWeek = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next'
      ? addDays(currentDate, 7)
      : addDays(currentDate, -7);
    console.log(`LOV_DEBUG_CALENDAR_MGMT: Navigating to ${direction} week: ${newDate.toISOString()}`);
    setCurrentDate(newDate);
  };

  // Modified: Only fetch when explicitly requested via sync button
  const handleGoogleSync = async () => {
    if (isGoogleAuthenticated) {
      try {
        setIsSyncing(true);
        setDebugLogs([]);
        setShowDebugLogs(true);
        
        console.log(`LOV_DEBUG_CALENDAR_MGMT: Starting Google sync for date: ${currentDate.toISOString()}`);
        
        // Force refresh when sync button is clicked
        await fetchGoogleEvents(currentDate, true);
        await fetchAvailabilityData();
        
        // Mark this date as loaded
        const dateKey = format(currentDate, 'yyyy-MM');
        loadedDatesRef.current.add(dateKey);
        
      } catch (error: any) {
        console.error('LOV_DEBUG_CALENDAR_MGMT: Error syncing with Google Calendar:', error);
      } finally {
        setIsSyncing(false);
        setTimeout(() => {
          setShowDebugLogs(false);
        }, 3000);
      }
    }
  };

  // Handle copying professional meetings from Google Calendar
  const handleCopyProfessionalMeetings = async (selectedEventIds: string[], clientMapping: Record<string, number | null>) => {
    if (!isGoogleAuthenticated || googleEvents.length === 0) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר ליומן Google ולסנכרן אירועים תחילה",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCopyingMeetings(true);
      setDebugLogs([]);
      setShowDebugLogs(true);
      
      console.log(`CALENDAR_MGMT_LOG: Starting to copy selected professional meetings from Google Calendar`);
      console.log(`CALENDAR_MGMT_LOG: Selected ${selectedEventIds.length} event IDs:`, selectedEventIds);
      console.log(`CALENDAR_MGMT_LOG: Client mapping:`, clientMapping);
      
      // Call the utility function to copy meetings with client mapping
      const stats = await copyProfessionalMeetingsToFutureSessions(
        googleEvents, 
        selectedEventIds,
        clientMapping
      );
      
      console.log(`CALENDAR_MGMT_LOG: Copy operation completed. Stats:`, stats);
      
      // Refresh data after copying
      await fetchAvailabilityData();
      
      // More detailed toast message
      let toastDescription = `הועתקו ${stats.added} פגישות חדשות.`;
      if (stats.skipped > 0) {
        const reasons = stats.reasons ? Object.keys(stats.reasons).length : 0;
        toastDescription += ` ${stats.skipped} פגישות דולגו${reasons > 0 ? ' (ראה פרטים בדיאלוג)' : ''}.`;
      }
      
      toast({
        title: "העתקת פגישות הושלמה",
        description: toastDescription,
      });
      
      // Return the stats so the dialog can show detailed information
      return stats;
      
    } catch (error: any) {
      console.error('CALENDAR_MGMT_LOG: Error copying professional meetings:', error);
      toast({
        title: "שגיאה בהעתקת פגישות",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsCopyingMeetings(false);
      setTimeout(() => {
        setShowDebugLogs(false);
      }, 3000);
    }
  };

  // Handle manual refresh button
  const handleManualRefresh = async () => {
    console.log(`LOV_DEBUG_CALENDAR_MGMT: Manual refresh requested at ${new Date().toISOString()}`);
    setLastRefresh(new Date().toLocaleTimeString());
    
    try {
      setIsSyncing(true);
      
      // Refresh everything
      await checkTableExists();
      
      if (isGoogleAuthenticated) {
        // Force refresh when manual refresh button is clicked
        await fetchGoogleEvents(currentDate, true);
      }
      
      await fetchAvailabilityData();
      
      toast({
        title: 'יומן רוענן',
        description: `הנתונים רועננו בהצלחה בשעה ${new Date().toLocaleTimeString()}`,
      });
    } catch (error: any) {
      console.error('LOV_DEBUG_CALENDAR_MGMT: Error during manual refresh:', error);
      toast({
        title: 'שגיאה בריענון נתונים',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Force a full page reload to clear any caches
  const handleForceReload = () => {
    console.log(`LOV_DEBUG_CALENDAR_MGMT: Forcing full page reload`);
    forcePageRefresh();
  };

  // Modified: Only fetch events when date changes to a new month we haven't loaded yet
  useEffect(() => {
    if (isGoogleAuthenticated) {
      // Check if we've already loaded events for this month
      const monthKey = format(currentDate, 'yyyy-MM');
      
      if (!loadedDatesRef.current.has(monthKey)) {
        console.log(`LOV_DEBUG_CALENDAR_MGMT: Loading events for new month: ${monthKey}`);
        
        // Add to loaded dates before fetching to prevent duplicate calls
        loadedDatesRef.current.add(monthKey);
        
        // Fetch Google events for the new month (without force refresh)
        fetchGoogleEvents(currentDate, false);
      } else {
        console.log(`LOV_DEBUG_CALENDAR_MGMT: Events for month ${monthKey} already loaded`);
      }
    }
  }, [currentDate, isGoogleAuthenticated]);

  // After signing in with Google, make sure to load events
  useEffect(() => {
    if (isGoogleAuthenticated && googleEvents.length === 0) {
      const monthKey = format(currentDate, 'yyyy-MM');
      
      // Check if we've already tried to load this month
      if (!loadedDatesRef.current.has(monthKey)) {
        console.log(`LOV_DEBUG_CALENDAR_MGMT: Initially loading Google events after authentication`);
        fetchGoogleEvents(currentDate, false);
        loadedDatesRef.current.add(monthKey);
      }
    }
  }, [isGoogleAuthenticated]);

  const updateTimeSlot = async (date: string, hour: string, newStatus: 'available' | 'private' | 'unspecified') => {
    if (!tableExists) {
      toast({
        title: 'טבלת היומן חסרה',
        description: 'לא ניתן לעדכן זמינות ללא טבלת היומן. אנא צור את הטבלה תחילה.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const supabase = await supabaseClient();
      const dayMap = calendarData.get(date);
      
      if (!dayMap) return;
      
      const currentSlot = dayMap.get(hour);
      if (!currentSlot) return;
      
      if (currentSlot.status === 'booked') {
        toast({
          title: 'לא ניתן לשנות סטטוס',
          description: 'לא ניתן לשנות משבצת זמן שכבר הוזמנה. יש לבטל את הפגישה תחילה.',
          variant: 'destructive',
        });
        return;
      }
      
      if (newStatus === 'unspecified') {
        const { error } = await supabase
          .from('calendar_slots')
          .delete()
          .eq('date', date)
          .eq('start_time', hour);
        
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('calendar_slots')
          .upsert({
            date,
            start_time: hour,
            end_time: hour.split(':')[0] + ':59',
            slot_type: newStatus,
            is_recurring: false
          });
        
        if (error) throw new Error(error.message);
      }
      
      const updatedDayMap = new Map(dayMap);
      updatedDayMap.set(hour, {
        ...currentSlot,
        status: newStatus
      });
      
      const newCalendarData = new Map(calendarData);
      newCalendarData.set(date, updatedDayMap);
      
      fetchAvailabilityData();
      
      toast({
        title: 'עדכון בוצע בהצלחה',
        description: `סטטוס המשבצת עודכן ל${newStatus === 'available' ? 'זמין' : newStatus === 'private' ? 'פרטי' : 'לא מוגדר'}`,
      });
    } catch (error: any) {
      console.error('Error updating time slot:', error);
      toast({
        title: 'שגיאה בעדכון משבצת הזמן',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddRecurringAvailability = async (rule: any) => {
    if (!tableExists) {
      toast({
        title: 'טבלת היומן חסרה',
        description: 'לא ניתן להגדיר זמינות חוזרת ללא טבלת היומן. אנא צור את הטבלה תחילה.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const supabase = await supabaseClient();
      const slots: any[] = [];
      
      const startDate = new Date(rule.startDate);
      const dayOfWeek = rule.day;
      
      let currentDate = startOfWeek(startDate, { weekStartsOn: 0 });
      currentDate = addDays(currentDate, dayOfWeek);
      
      if (currentDate < startDate) {
        currentDate = addDays(currentDate, 7);
      }
      
      for (let i = 0; i < rule.count; i++) {
        const slot = {
          date: format(currentDate, 'yyyy-MM-dd'),
          day_of_week: dayOfWeek,
          start_time: rule.startTime,
          end_time: rule.endTime,
          slot_type: 'available' as const,
          is_recurring: true,
          recurring_pattern: 'weekly',
          recurring_count: rule.count
        };
        
        slots.push(slot);
        currentDate = addDays(currentDate, 7);
      }
      
      const { error } = await supabase
        .from('calendar_slots')
        .insert(slots);
      
      if (error) throw new Error(error.message);
      
      await fetchAvailabilityData();
      
      toast({
        title: 'זמינות חוזרת הוגדרה בהצלחה',
        description: `נוספו ${rule.count} משבצות זמינות חוזרות`,
      });
    } catch (error: any) {
      console.error('Error setting recurring availability:', error);
      toast({
        title: 'שגיאה בהגדרת זמינות חוזרת',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignInGoogle = async (): Promise<void> => {
    const success = await signInWithGoogle();
    
    // If sign-in was successful, fetch events starting from the current week
    if (success) {
      const monthKey = format(currentDate, 'yyyy-MM');
      await fetchGoogleEvents(currentDate);
      loadedDatesRef.current.add(monthKey);
    }
  };

  useEffect(() => {
    checkTableExists();
  }, []);

  return (
    <AdminLayout title="ניהול זמינות יומן">
      <div className="container mx-auto py-1" dir="rtl">
        <div className="flex flex-col space-y-1">
          <div className="flex flex-col md:flex-row justify-between items-center mb-1 bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-1.5 mb-1 md:mb-0">
              <h2 className="text-base font-medium text-purple-800">ניהול יומן</h2>
              <Badge variant="outline" className="text-xs h-4 px-1">גרסה: {COMPONENT_VERSION}</Badge>
              <Badge variant="outline" className="text-xs h-4 px-1 hidden md:inline-flex">Debug ID: {debugVersion?.substring(0, 8)}</Badge>
            </div>
            
            <div className="flex gap-1.5">
              <Button 
                onClick={handleManualRefresh}
                variant="outline"
                size="sm" 
                className="text-xs flex items-center gap-1 h-7 px-2"
                disabled={isSyncing || isLoading || isLoadingSettings || isLoadingGoogleEvents || isCopyingMeetings}
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                ריענון 
                <span className="text-gray-500 text-xs">({lastRefresh})</span>
              </Button>
              
              <Button 
                onClick={handleForceReload}
                variant="destructive"
                size="sm" 
                className="text-xs h-7 px-2"
              >
                איפוס מלא
              </Button>
            </div>
          </div>
          
          <CalendarHeader 
            isGoogleAuthenticated={isGoogleAuthenticated}
            isGoogleAuthenticating={isGoogleAuthenticating}
            googleAuthError={googleAuthError}
            googleEvents={googleEvents}
            isSyncing={isSyncing}
            isCopyingMeetings={isCopyingMeetings}
            isLoadingGoogleEvents={isLoadingGoogleEvents}
            onSignInGoogle={handleSignInGoogle}
            onSignOutGoogle={signOutFromGoogle}
            onGoogleSync={handleGoogleSync}
            onCopyProfessionalMeetings={handleCopyProfessionalMeetings}
          />
          
          {showDebugLogs && (
            <DebugLogPanel 
              logs={debugLogs} 
              onClose={() => setShowDebugLogs(false)}
              title="יומן סנכרון Google Calendar" 
            />
          )}
          
          {!tableExists && !showDebugLogs ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>טבלת היומן חסרה</AlertTitle>
              <AlertDescription>
                לא קיימים נתוני זמינות ביומן. הטבלה המתאימה לא קיימת במערכת.
                <Button 
                  onClick={createCalendarSlotsTable} 
                  variant="outline" 
                  className="mt-2 ml-auto"
                >
                  יצירת טבלת יומן
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          
          <CalendarContent 
            days={days}
            hours={hours}
            currentDate={currentDate}
            calendarData={calendarData}
            isLoading={isLoading || isSyncing || isLoadingSettings || isLoadingGoogleEvents || isCopyingMeetings}
            onNavigateWeek={navigateWeek}
            onUpdateSlot={updateTimeSlot}
            onSetCurrentDate={setCurrentDate}
            onRecurringDialogOpen={() => setRecurringDialogOpen(true)}
          />
        </div>
        
        <RecurringAvailabilityDialog 
          open={recurringDialogOpen} 
          onOpenChange={setRecurringDialogOpen}
          onSubmit={handleAddRecurringAvailability}
        />
      </div>
    </AdminLayout>
  );
};

export default CalendarManagement;
