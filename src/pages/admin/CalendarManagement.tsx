import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import CalendarGrid from '@/components/admin/calendar/CalendarGrid';
import CalendarListView from '@/components/admin/calendar/CalendarListView';
import CalendarToolbar from '@/components/admin/calendar/CalendarToolbar';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeSlot, CalendarSlot, GoogleCalendarEvent, CalendarSyncComparison } from '@/types/calendar';
import { getSupabaseWithAuth } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, format, startOfWeek, startOfDay, addWeeks, addMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RecurringAvailabilityDialog } from '@/components/admin/calendar/RecurringAvailabilityDialog';
import { GoogleCalendarSync } from '@/components/admin/calendar/GoogleCalendarSync';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar as CalendarIcon, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import DebugLogPanel from '@/components/admin/calendar/DebugLogPanel';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { fetchGoogleCalendarEvents, compareCalendarData } from '@/services/GoogleCalendarService';
import { Button } from '@/components/ui/button';

const CalendarManagement: React.FC = () => {
  const { user, session } = useAuth();
  const [selectedView, setSelectedView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<Map<string, Map<string, CalendarSlot>>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isGoogleSynced, setIsGoogleSynced] = useState<boolean>(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState<boolean>(false);
  const [tableExists, setTableExists] = useState<boolean>(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLogs, setShowDebugLogs] = useState<boolean>(false);
  const [syncComparison, setSyncComparison] = useState<CalendarSyncComparison | null>(null);
  const { settings, isLoading: isLoadingSettings, error: settingsError, isInitialLoadComplete } = useCalendarSettings();

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

  const checkTableExists = async () => {
    try {
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      const { error } = await supabase
        .from('calendar_slots')
        .select('id')
        .limit(1);
      
      if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('Calendar slots table does not exist:', error.message);
        setTableExists(false);
        return false;
      }
      
      setTableExists(true);
      return true;
    } catch (error: any) {
      console.error('Error checking if table exists:', error);
      return false;
    }
  };

  const fetchAvailabilityData = async () => {
    try {
      setIsLoading(true);
      
      const exists = await checkTableExists();
      if (!exists) {
        initializeEmptyCalendarData();
        return;
      }
      
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      const today = startOfDay(new Date());
      const thirtyDaysLater = addDays(today, 30);
      
      const { data: availableSlots, error: availableSlotsError } = await supabase
        .from('calendar_slots')
        .select('*')
        .gte('date', format(today, 'yyyy-MM-dd'))
        .lte('date', format(thirtyDaysLater, 'yyyy-MM-dd'));
      
      if (availableSlotsError) {
        if (availableSlotsError.message.includes('relation') && 
            availableSlotsError.message.includes('does not exist')) {
          setTableExists(false);
          initializeEmptyCalendarData();
          return;
        }
        throw new Error(availableSlotsError.message);
      }
      
      const { data: bookedSlots, error: bookedSlotsError } = await supabase
        .from('future_sessions')
        .select('*, patients(name)')
        .gte('session_date', format(today, 'yyyy-MM-dd'))
        .lte('session_date', format(thirtyDaysLater, 'yyyy-MM-dd'));
      
      if (bookedSlotsError) {
        throw new Error(bookedSlotsError.message);
      }
      
      if (settings && isGoogleSynced) {
        await syncWithGoogleCalendar(availableSlots || [], true);
      } else {
        const newCalendarData = processCalendarData(availableSlots || [], bookedSlots || []);
        setCalendarData(newCalendarData);
      }
      
    } catch (error: any) {
      console.error('Error fetching calendar data:', error);
      toast({
        title: 'שגיאה בטעינת נתוני יומן',
        description: error.message,
        variant: 'destructive',
      });
      
      initializeEmptyCalendarData();
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithGoogleCalendar = async (supabaseSlots: any[] = [], quietMode = false) => {
    if (!settings?.apiKey || !settings?.calendarId) {
      toast({
        title: 'הגדרות יומן חסרות',
        description: 'לא ניתן לבצע סנכרון ללא מפתח API ומזהה יומן',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSyncing(true);
      if (!quietMode) {
        setDebugLogs([]);
        setShowDebugLogs(true);
      }
      
      const { events: googleEvents, logs, success } = await fetchGoogleCalendarEvents(
        settings.apiKey, 
        settings.calendarId
      );
      
      if (!quietMode) {
        setDebugLogs(logs);
      }
      
      if (!success) {
        throw new Error('שגיאה בהבאת אירועים מיומן Google');
      }
      
      let slots = supabaseSlots;
      if (!slots || slots.length === 0) {
        const supabase = getSupabaseWithAuth(session?.access_token);
        const today = startOfDay(new Date());
        const thirtyDaysLater = addDays(today, 30);
        
        const { data, error } = await supabase
          .from('calendar_slots')
          .select('*')
          .gte('date', format(today, 'yyyy-MM-dd'))
          .lte('date', format(thirtyDaysLater, 'yyyy-MM-dd'));
        
        if (error) throw new Error(error.message);
        slots = data || [];
      }
      
      const comparison = compareCalendarData(googleEvents, slots);
      setSyncComparison(comparison);
      
      const supabase = getSupabaseWithAuth(session?.access_token);
      const today = startOfDay(new Date());
      const thirtyDaysLater = addDays(today, 30);
      
      const { data: bookedSlots, error: bookedSlotsError } = await supabase
        .from('future_sessions')
        .select('*, patients(name)')
        .gte('session_date', format(today, 'yyyy-MM-dd'))
        .lte('session_date', format(thirtyDaysLater, 'yyyy-MM-dd'));
      
      if (bookedSlotsError) {
        throw new Error(bookedSlotsError.message);
      }
      
      const mergedCalendarData = processCalendarDataWithSync(
        slots, 
        bookedSlots || [], 
        comparison
      );
      
      setCalendarData(mergedCalendarData);
      setIsGoogleSynced(true);
      
      if (!quietMode) {
        toast({
          title: 'סינכרון יומן גוגל הושלם בהצלחה!',
          description: `סונכרנו ${googleEvents.length} אירועים מיומן Google`,
        });
      }
      
    } catch (error: any) {
      console.error('Error syncing with Google Calendar:', error);
      if (!quietMode) {
        setDebugLogs(prev => [...prev, `${new Date().toISOString()} - שגיאה: ${error.message}`]);
        toast({
          title: 'שגיאה בסנכרון יומן',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSyncing(false);
      if (!quietMode) {
        setTimeout(() => {
          setShowDebugLogs(false);
        }, 3000);
      }
    }
  };

  const initializeEmptyCalendarData = () => {
    const emptyCalendarData = new Map<string, Map<string, CalendarSlot>>();
    
    days.forEach(day => {
      const daySlots = new Map<string, CalendarSlot>();
      hours.forEach(hour => {
        daySlots.set(hour, {
          date: day.date,
          day: day.dayNumber,
          hour,
          status: 'unspecified'
        });
      });
      emptyCalendarData.set(day.date, daySlots);
    });
    
    setCalendarData(emptyCalendarData);
  };

  const processCalendarData = (availableSlots: any[], bookedSlots: any[]) => {
    const calendarData = new Map<string, Map<string, CalendarSlot>>();
    
    days.forEach(day => {
      const daySlots = new Map<string, CalendarSlot>();
      hours.forEach(hour => {
        daySlots.set(hour, {
          date: day.date,
          day: day.dayNumber,
          hour,
          status: 'unspecified'
        });
      });
      calendarData.set(day.date, daySlots);
    });
    
    availableSlots.forEach(slot => {
      const dayMap = calendarData.get(slot.date);
      if (dayMap && dayMap.has(slot.start_time)) {
        dayMap.set(slot.start_time, {
          ...dayMap.get(slot.start_time)!,
          status: (slot.slot_type || slot.status) as 'available' | 'private' | 'unspecified',
          notes: slot.notes
        });
      }
    });
    
    bookedSlots.forEach(session => {
      if (!session.session_date) return;
      
      try {
        const sessionDateTime = new Date(session.session_date);
        const israelTime = formatInTimeZone(sessionDateTime, 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss');
        
        const sessionDate = israelTime.split(' ')[0];
        const timeParts = israelTime.split(' ')[1].split(':');
        const sessionTime = `${timeParts[0]}:00`;
        
        const dayMap = calendarData.get(sessionDate);
        if (dayMap && dayMap.has(sessionTime)) {
          const endTime = addMinutes(sessionDateTime, 90);
          const formattedEndTime = formatInTimeZone(endTime, 'Asia/Jerusalem', 'HH:mm');
          
          let status: 'available' | 'booked' | 'completed' | 'canceled' | 'private' | 'unspecified' = 'booked';
          if (session.status === 'completed') status = 'completed';
          if (session.status === 'canceled') status = 'canceled';
          
          dayMap.set(sessionTime, {
            ...dayMap.get(sessionTime)!,
            status,
            notes: `${session.title || 'פגישה'}: ${session.patients?.name || 'לקוח/ה'} (${sessionTime}-${formattedEndTime})`
          });
        }
      } catch (error) {
        console.error('Error processing session date:', error);
      }
    });
    
    return calendarData;
  };

  const processCalendarDataWithSync = (
    availableSlots: any[], 
    bookedSlots: any[], 
    comparison: CalendarSyncComparison
  ) => {
    const calendarData = new Map<string, Map<string, CalendarSlot>>();
    
    days.forEach(day => {
      const daySlots = new Map<string, CalendarSlot>();
      hours.forEach(hour => {
        daySlots.set(hour, {
          date: day.date,
          day: day.dayNumber,
          hour,
          status: 'unspecified'
        });
      });
      calendarData.set(day.date, daySlots);
    });
    
    availableSlots.forEach(slot => {
      const dayMap = calendarData.get(slot.date);
      if (dayMap && dayMap.has(slot.start_time)) {
        const isSupabaseOnly = comparison.onlyInSupabase.some(
          s => s.date === slot.date && s.start_time === slot.start_time
        );
        
        dayMap.set(slot.start_time, {
          ...dayMap.get(slot.start_time)!,
          status: (slot.slot_type || slot.status) as 'available' | 'private' | 'unspecified',
          notes: slot.notes,
          syncStatus: isSupabaseOnly ? 'supabase-only' : undefined
        });
      }
    });
    
    comparison.onlyInGoogle.forEach(event => {
      if (event.start?.dateTime) {
        const startDate = new Date(event.start.dateTime);
        const googleDate = format(startDate, 'yyyy-MM-dd');
        const googleTime = format(startDate, 'HH:00');
        
        const dayMap = calendarData.get(googleDate);
        if (dayMap && dayMap.has(googleTime)) {
          const existingSlot = dayMap.get(googleTime);
          
          dayMap.set(googleTime, {
            ...existingSlot!,
            status: 'private',
            notes: event.summary || 'אירוע Google',
            syncStatus: 'google-only'
          });
        }
      }
    });
    
    bookedSlots.forEach(session => {
      if (!session.session_date) return;
      
      try {
        const sessionDateTime = new Date(session.session_date);
        const israelTime = formatInTimeZone(sessionDateTime, 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss');
        
        const sessionDate = israelTime.split(' ')[0];
        const timeParts = israelTime.split(' ')[1].split(':');
        const sessionTime = `${timeParts[0]}:00`;
        
        const dayMap = calendarData.get(sessionDate);
        if (dayMap && dayMap.has(sessionTime)) {
          const endTime = addMinutes(sessionDateTime, 90);
          const formattedEndTime = formatInTimeZone(endTime, 'Asia/Jerusalem', 'HH:mm');
          
          let status: 'available' | 'booked' | 'completed' | 'canceled' | 'private' | 'unspecified' = 'booked';
          if (session.status === 'completed') status = 'completed';
          if (session.status === 'canceled') status = 'canceled';
          
          dayMap.set(sessionTime, {
            ...dayMap.get(sessionTime)!,
            status,
            notes: `${session.title || 'פגישה'}: ${session.patients?.name || 'לקוח/ה'} (${sessionTime}-${formattedEndTime})`
          });
        }
      } catch (error) {
        console.error('Error processing session date:', error);
      }
    });
    
    return calendarData;
  };

  const applyDefaultAvailability = async () => {
    if (!tableExists) {
      toast({
        title: 'טבלת היומן חסרה',
        description: 'לא ניתן להגדיר זמינות ברירת מחדל ללא טבלת היומן. אנא צור את הטבלה תחילה.',
        variant: 'destructive',
      });
      return;
    }
    
    const defaultPatterns = [
      { days: [0, 1, 2, 4], startHour: 8, endHour: 16 },
      { days: [0, 1, 2, 3, 4], startHour: 21, endHour: 23 },
      { days: [5], startHour: 9, endHour: 11 }
    ];
    
    const availabilitySlots: TimeSlot[] = [];
    
    for (let week = 0; week < 4; week++) {
      const weekStart = addWeeks(new Date(), week);
      
      defaultPatterns.forEach(pattern => {
        pattern.days.forEach(day => {
          const date = addDays(startOfWeek(weekStart, { weekStartsOn: 0 }), day);
          
          for (let hour = pattern.startHour; hour < pattern.endHour; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
            
            availabilitySlots.push({
              day,
              date: format(date, 'yyyy-MM-dd'),
              startTime,
              endTime,
              status: 'available',
              isRecurring: false
            });
          }
        });
      });
    }
    
    try {
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      const { error } = await supabase
        .from('calendar_slots')
        .insert(availabilitySlots.map(slot => ({
          date: slot.date,
          start_time: slot.startTime,
          end_time: slot.endTime,
          slot_type: 'available',
          is_recurring: slot.isRecurring
        })));
      
      if (error) throw new Error(error.message);
      
      await fetchAvailabilityData();
      
      toast({
        title: 'הגדרת זמינות ברירת מחדל',
        description: 'זמני הזמינות הוגדרו בהצלחה לפי התבנית המוגדרת',
      });
    } catch (error: any) {
      console.error('Error setting default availability:', error);
      toast({
        title: 'שגיאה בהגדרת זמינות ברירת מחדל',
        description: error.message,
        variant: 'destructive',
      });
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
      const supabase = getSupabaseWithAuth(session?.access_token);
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
      setCalendarData(newCalendarData);
      
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

  const navigateWeek = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next'
      ? addDays(currentDate, 7)
      : addDays(currentDate, -7);
    setCurrentDate(newDate);
  };

  const handleGoogleSync = async () => {
    await syncWithGoogleCalendar();
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
      const supabase = getSupabaseWithAuth(session?.access_token);
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
          status: 'available' as const,
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

  const createSettingsTable = async () => {
    try {
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      const { error: checkError } = await supabase
        .from('settings')
        .select('key')
        .limit(1);
      
      if (checkError && checkError.message.includes('relation') && checkError.message.includes('does not exist')) {
        const { error } = await supabase.rpc('create_settings_table');
        
        if (error) {
          console.error('Error creating settings table:', error);
        }
      }
    } catch (error) {
      console.error('Error checking/creating settings table:', error);
    }
  };

  const createCalendarSlotsTable = async () => {
    try {
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      const { error } = await supabase.rpc('create_calendar_slots_table');
      
      if (error) {
        console.error('Error creating calendar_slots table:', error);
        toast({
          title: 'שגיאה ביצירת טבלת יומן',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }
      
      toast({
        title: 'טבלת יומן נוצרה בהצלחה',
        description: 'כעת ניתן להגדיר זמינות ביומן',
      });
      
      setTableExists(true);
      await fetchAvailabilityData();
      return true;
    } catch (error: any) {
      console.error('Error creating calendar_slots table:', error);
      toast({
        title: 'שגיאה ביצירת טבלת יומן',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    createSettingsTable();
  }, []);

  useEffect(() => {
    fetchAvailabilityData();
  }, [currentDate]);

  useEffect(() => {
    if (settings?.apiKey && settings?.calendarId && !isGoogleSynced && isInitialLoadComplete) {
      console.log('Auto-syncing with Google Calendar on initial load');
      syncWithGoogleCalendar([], true);
    }
  }, [settings, isInitialLoadComplete, isGoogleSynced]);

  useEffect(() => {
    setIsLoading(isSyncing || isLoadingSettings);
  }, [isSyncing, isLoadingSettings]);

  return (
    <AdminLayout title="ניהול זמינות יומן">
      <div className="container mx-auto py-6" dir="rtl">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">ניהול זמינות יומן</h1>
            <GoogleCalendarSync 
              onSyncClick={handleGoogleSync} 
              isLoading={isSyncing || isLoadingSettings} 
              settingsError={settingsError}
            />
          </div>
          
          <Separator className="my-4" />
          
          {showDebugLogs && (
            <DebugLogPanel 
              logs={debugLogs} 
              onClose={() => setShowDebugLogs(false)}
              title="יומן סנכרון Google Calendar" 
            />
          )}
          
          {settingsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>שגיאה בהגדרות Google Calendar</AlertTitle>
              <AlertDescription>
                לא ניתן לטעון את הגדרות יומן Google: {settingsError}
              </AlertDescription>
            </Alert>
          )}
          
          {syncComparison && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-600">סטטוס סנכרון יומן</AlertTitle>
              </div>
              <AlertDescription className="mt-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <p className="font-semibold text-blue-700">תואמים: {syncComparison.matchingEvents.length}</p>
                    <p className="text-xs text-gray-600">אירועים שקיימים בשני היומנים</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-orange-200">
                    <p className="font-semibold text-orange-700">רק ב-Google: {syncComparison.onlyInGoogle.length}</p>
                    <p className="text-xs text-gray-600">אירועים שקיימים רק ביומן Google</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <p className="font-semibold text-blue-700">רק ב-Supabase: {syncComparison.onlyInSupabase.length}</p>
                    <p className="text-xs text-gray-600">משבצות שקיימות רק במסד הנתונים</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {!tableExists && !showDebugLogs ? (
            <Alert variant="destructive" className="mb-4">
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
          
          {isLoadingSettings && !isLoading && (
            <Alert className="mb-4">
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                <AlertTitle>טוען הגדרות יומן</AlertTitle>
              </div>
              <AlertDescription>
                מתחבר ליומן Google, אנא המתן...
              </AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>הגדרת זמני זמינות לפגישות</CardTitle>
                <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'calendar' | 'list')}>
                  <TabsList>
                    <TabsTrigger value="calendar">תצוגת לוח</TabsTrigger>
                    <TabsTrigger value="list">תצוגת רשימה</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <CalendarToolbar 
                currentDate={currentDate}
                onPrevWeek={() => navigateWeek('prev')}
                onNextWeek={() => navigateWeek('next')}
                onToday={() => setCurrentDate(new Date())}
                onAddRecurring={() => setRecurringDialogOpen(true)}
              />
              
              <div className="mt-4">
                {selectedView === 'calendar' ? (
                  <CalendarGrid 
                    days={days}
                    hours={hours}
                    calendarData={calendarData}
                    onUpdateSlot={updateTimeSlot}
                    isLoading={isLoading}
                  />
                ) : (
                  <CalendarListView 
                    calendarData={calendarData}
                    onUpdateSlot={updateTimeSlot}
                    isLoading={isLoading}
                  />
                )}
              </div>
            </CardContent>
          </Card>
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
