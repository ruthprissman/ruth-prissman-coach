import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, format, startOfWeek, startOfDay } from 'date-fns';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useCalendarOperations } from '@/hooks/useCalendarOperations';
import { useCalendarData } from '@/hooks/useCalendarData';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CalendarHeader from '@/components/admin/calendar/CalendarHeader';
import CalendarContent from '@/components/admin/calendar/CalendarContent';
import { RecurringAvailabilityDialog } from '@/components/admin/calendar/RecurringAvailabilityDialog';
import DebugLogPanel from '@/components/admin/calendar/DebugLogPanel';
import { toast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';

const CalendarManagement: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [recurringDialogOpen, setRecurringDialogOpen] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLogs, setShowDebugLogs] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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

  const { calendarData, isLoading, fetchAvailabilityData } = useCalendarData(
    currentDate,
    googleEvents,
    isGoogleAuthenticated
  );

  const hours = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const generateDaysOfWeek = (startDate: Date) => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEE dd/MM'),
        dayNumber: i
      };
    });
  };

  const days = generateDaysOfWeek(currentDate);

  const navigateWeek = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next'
      ? addDays(currentDate, 7)
      : addDays(currentDate, -7);
    setCurrentDate(newDate);
  };

  const handleGoogleSync = async () => {
    if (isGoogleAuthenticated) {
      try {
        setIsSyncing(true);
        setDebugLogs([]);
        setShowDebugLogs(true);
        
        await fetchGoogleEvents();
        await fetchAvailabilityData();
        
      } catch (error: any) {
        console.error('Error syncing with Google Calendar:', error);
      } finally {
        setIsSyncing(false);
        setTimeout(() => {
          setShowDebugLogs(false);
        }, 3000);
      }
    }
  };

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
    await signInWithGoogle();
  };

  useEffect(() => {
    checkTableExists();
  }, []);

  return (
    <AdminLayout title="ניהול זמינות יומן">
      <div className="container mx-auto py-6" dir="rtl">
        <div className="flex flex-col space-y-4">
          <CalendarHeader 
            isGoogleAuthenticated={isGoogleAuthenticated}
            isGoogleAuthenticating={isGoogleAuthenticating}
            googleAuthError={googleAuthError}
            googleEvents={googleEvents}
            isSyncing={isSyncing}
            isLoadingGoogleEvents={isLoadingGoogleEvents}
            onSignInGoogle={handleSignInGoogle}
            onSignOutGoogle={signOutFromGoogle}
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
