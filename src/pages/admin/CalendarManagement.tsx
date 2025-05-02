import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, format, startOfWeek, startOfDay } from 'date-fns';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useCalendarOperations } from '@/hooks/useCalendarOperations';
import { useCalendarData } from '@/hooks/useCalendarData';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CalendarHeader from '@/components/admin/calendar/CalendarHeader';
import CalendarContent from '@/components/admin/calendar/CalendarContent';
import { RecurringAvailabilityDialog } from '@/components/admin/calendar/RecurringAvailabilityDialog';
import DebugLogPanel from '@/components/admin/calendar/DebugLogPanel';
import { toast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { forcePageRefresh, logComponentVersions } from '@/utils/debugUtils';
import { GoogleAuthDebug } from '@/components/admin/GoogleAuthDebug';

// Component version for debugging
const COMPONENT_VERSION = "1.2.0";
console.log(`LOV_DEBUG_CALENDAR_MGMT: Component loaded, version ${COMPONENT_VERSION}`);

// Track last fetch time at component level
let lastComponentFetchTime = 0;
const COMPONENT_FETCH_COOLDOWN_MS = 15000; // 15 seconds cooldown

const CalendarManagement: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [recurringDialogOpen, setRecurringDialogOpen] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLogs, setShowDebugLogs] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<string>(new Date().toLocaleTimeString());
  const [fetchCounter, setFetchCounter] = useState<number>(0);

  const { settings, isLoading: isLoadingSettings } = useCalendarSettings();
  const { tableExists, checkTableExists, createCalendarSlotsTable, applyDefaultAvailability } = useCalendarOperations();
  const { 
    isAuthenticated: isGoogleAuthenticated,
    events: googleEvents,
    isLoadingEvents: isLoadingGoogleEvents,
    fetchEvents: fetchGoogleEvents,
    debugInfo: googleAuthDebugInfo
  } = useGoogleAuth();

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
  }, [isGoogleAuthenticated, googleEvents.length, currentDate]);

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

  // Protected Google sync with cooldown
  const handleGoogleSync = useCallback(async () => {
    if (isGoogleAuthenticated) {
      try {
        // Check component-level cooldown
        const now = Date.now();
        if (now - lastComponentFetchTime < COMPONENT_FETCH_COOLDOWN_MS) {
          console.log(`LOV_DEBUG_CALENDAR_MGMT: Skipping sync, cooldown active (${Math.round((COMPONENT_FETCH_COOLDOWN_MS - (now - lastComponentFetchTime))/1000)}s remaining)`);
          toast({
            title: 'בקשה נדחתה',
            description: `יש להמתין ${Math.round((COMPONENT_FETCH_COOLDOWN_MS - (now - lastComponentFetchTime))/1000)} שניות בין סנכרונים`,
            variant: 'destructive',
          });
          return;
        }
        
        setIsSyncing(true);
        setDebugLogs([`${new Date().toISOString()} - התחלת סנכרון, פעם ${fetchCounter + 1}`]);
        setShowDebugLogs(true);
        
        console.log(`LOV_DEBUG_CALENDAR_MGMT: Starting Google sync for date: ${currentDate.toISOString()}`);
        setDebugLogs(prev => [...prev, `${new Date().toISOString()} - מתחיל טעינת אירועי גוגל`]);
        
        lastComponentFetchTime = now;
        setFetchCounter(prev => prev + 1);
        
        // Pass the current date to fetch events from the beginning of the displayed week
        await fetchGoogleEvents(currentDate);
        setDebugLogs(prev => [...prev, `${new Date().toISOString()} - טעינת אירועי גוגל הושלמה`]);
        
        setDebugLogs(prev => [...prev, `${new Date().toISOString()} - מתחיל טעינת נתוני זמינות`]);
        await fetchAvailabilityData();
        setDebugLogs(prev => [...prev, `${new Date().toISOString()} - טעינת נתוני זמינות הושלמה`]);
        
        setLastRefresh(new Date().toLocaleTimeString());
        
      } catch (error: any) {
        console.error('LOV_DEBUG_CALENDAR_MGMT: Error syncing with Google Calendar:', error);
        setDebugLogs(prev => [...prev, `${new Date().toISOString()} - שגיאה: ${error.message}`]);
      } finally {
        setIsSyncing(false);
        // Don't auto-hide logs - let user close them manually
      }
    }
  }, [isGoogleAuthenticated, currentDate, fetchGoogleEvents, fetchAvailabilityData, fetchCounter]);

  // Handle manual refresh button with cooldown protection
  const handleManualRefresh = useCallback(async () => {
    console.log(`REFRESH_DEBUG: Manual refresh requested at ${new Date().toISOString()}`);
    
    // Check component-level cooldown
    const now = Date.now();
    if (now - lastComponentFetchTime < COMPONENT_FETCH_COOLDOWN_MS) {
      console.log(`REFRESH_DEBUG: Skipping refresh, cooldown active (${Math.round((COMPONENT_FETCH_COOLDOWN_MS - (now - lastComponentFetchTime))/1000)}s remaining)`);
      toast({
        title: 'בקשה נדחתה',
        description: `יש להמתין ${Math.round((COMPONENT_FETCH_COOLDOWN_MS - (now - lastComponentFetchTime))/1000)} שניות בין ריענונים`,
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSyncing(true);
      lastComponentFetchTime = now;
      setFetchCounter(prev => prev + 1);
      
      // Refresh everything
      await checkTableExists();
      
      if (isGoogleAuthenticated) {
        await fetchGoogleEvents(currentDate);
      }
      
      await fetchAvailabilityData();
      
      setLastRefresh(new Date().toLocaleTimeString());
      
      toast({
        title: 'יומן רוענן',
        description: `הנתונים רועננו בהצלחה בשעה ${new Date().toLocaleTimeString()}`,
      });
    } catch (error: any) {
      console.error('REFRESH_DEBUG: Error during manual refresh:', error);
      toast({
        title: 'שגיאה בריענון נתונים',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [checkTableExists, isGoogleAuthenticated, fetchGoogleEvents, currentDate, fetchAvailabilityData]);

  // Force a full page reload to clear any caches
  const handleForceReload = () => {
    console.log(`LOV_DEBUG_CALENDAR_MGMT: Forcing full page reload`);
    forcePageRefresh();
  };

  // Update calendar data when current date changes, with protection
  useEffect(() => {
    // Only fetch Google events automatically if:
    // 1. We're authenticated
    // 2. We haven't fetched recently
    // 3. We're not already loading
    if (isGoogleAuthenticated && !isLoadingGoogleEvents && googleEvents.length === 0) {
      const now = Date.now();
      if (now - lastComponentFetchTime >= COMPONENT_FETCH_COOLDOWN_MS) {
        console.log(`LOV_DEBUG_CALENDAR_MGMT: Initial fetch for date: ${currentDate.toISOString()}`);
        lastComponentFetchTime = now;
        fetchGoogleEvents(currentDate);
      } else {
        console.log(`LOV_DEBUG_CALENDAR_MGMT: Skipping initial fetch, cooldown active`);
      }
    }
  }, [currentDate, isGoogleAuthenticated, isLoadingGoogleEvents, googleEvents.length, fetchGoogleEvents]);

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
          description: 'לא ניתן לשנות משבצת זמן שכב�� הוזמנה. יש לבטל את הפגישה תחילה.',
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

  useEffect(() => {
    checkTableExists();
  }, [checkTableExists]);

  return (
    <AdminLayout title="ניהול זמינות יומן">
      <div className="container mx-auto py-6" dir="rtl">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>גרסה: {COMPONENT_VERSION} | Debug version: {debugVersion?.substring(0, 15)}</div>
            <div className="flex gap-2">
              <Button 
                onClick={handleManualRefresh}
                variant="outline"
                size="sm" 
                className="text-xs flex items-center gap-1"
                disabled={isSyncing || isLoading || isLoadingSettings || isLoadingGoogleEvents}
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                ריענון נתונים ({lastRefresh}, #{fetchCounter})
              </Button>
              <Button 
                onClick={handleForceReload}
                variant="destructive"
                size="sm" 
                className="text-xs"
              >
                איפוס מלא (רענון דף)
              </Button>
            </div>
          </div>
          
          {/* Add GoogleAuthDebug component */}
          <GoogleAuthDebug />
          
          <CalendarHeader 
            isSyncing={isSyncing}
            onGoogleSync={handleGoogleSync}
          />
          
          <Separator className="my-4" />
          
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
            isLoading={isLoading || isSyncing || isLoadingSettings || isLoadingGoogleEvents}
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
