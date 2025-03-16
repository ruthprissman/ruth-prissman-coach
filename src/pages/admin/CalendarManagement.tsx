
import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import CalendarGrid from '@/components/admin/calendar/CalendarGrid';
import CalendarListView from '@/components/admin/calendar/CalendarListView';
import CalendarToolbar from '@/components/admin/calendar/CalendarToolbar';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TimeSlot, CalendarSlot } from '@/types/calendar';
import { getSupabaseWithAuth } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, format, startOfWeek, startOfDay, addWeeks } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RecurringAvailabilityDialog } from '@/components/admin/calendar/RecurringAvailabilityDialog';
import { GoogleCalendarSync } from '@/components/admin/calendar/GoogleCalendarSync';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

const CalendarManagement: React.FC = () => {
  const { user, session } = useAuth();
  const [selectedView, setSelectedView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<Map<string, Map<string, CalendarSlot>>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGoogleSynced, setIsGoogleSynced] = useState<boolean>(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState<boolean>(false);
  const [tableExists, setTableExists] = useState<boolean>(true);

  // Generate hours for the day (8:00 - 23:00)
  const hours = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Generate days of the week
  const generateDaysOfWeek = (startDate: Date) => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 }); // 0 = Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEE dd/MM'), // e.g., "Sun 01/01"
        dayNumber: i
      };
    });
  };

  const days = generateDaysOfWeek(currentDate);

  // Check if table exists
  const checkTableExists = async () => {
    try {
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      // Try to get table information
      const { error } = await supabase
        .from('calendar_slots')
        .select('id')
        .limit(1);
      
      // If we get a "relation does not exist" error, set tableExists to false
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

  // Fetch availability data
  const fetchAvailabilityData = async () => {
    try {
      setIsLoading(true);
      
      // First check if the table exists
      const exists = await checkTableExists();
      if (!exists) {
        // Initialize empty calendar data
        initializeEmptyCalendarData();
        return;
      }
      
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      // Calculate date range (30 days from today)
      const today = startOfDay(new Date());
      const thirtyDaysLater = addDays(today, 30);
      
      // 1. Fetch available slots from calendar_slots table
      const { data: availableSlots, error: availableSlotsError } = await supabase
        .from('calendar_slots')
        .select('*')
        .gte('date', format(today, 'yyyy-MM-dd'))
        .lte('date', format(thirtyDaysLater, 'yyyy-MM-dd'));
      
      if (availableSlotsError) {
        if (availableSlotsError.message.includes('relation') && 
            availableSlotsError.message.includes('does not exist')) {
          // Handle missing table gracefully
          setTableExists(false);
          initializeEmptyCalendarData();
          return;
        }
        throw new Error(availableSlotsError.message);
      }
      
      // 2. Fetch booked appointments from future_sessions
      const { data: bookedSlots, error: bookedSlotsError } = await supabase
        .from('future_sessions')
        .select('*')
        .gte('date', format(today, 'yyyy-MM-dd'))
        .lte('date', format(thirtyDaysLater, 'yyyy-MM-dd'));
      
      if (bookedSlotsError) {
        throw new Error(bookedSlotsError.message);
      }
      
      // Process and merge all data
      const newCalendarData = processCalendarData(availableSlots || [], bookedSlots || []);
      setCalendarData(newCalendarData);
      
    } catch (error: any) {
      console.error('Error fetching calendar data:', error);
      toast({
        title: 'שגיאה בטעינת נתוני יומן',
        description: error.message,
        variant: 'destructive',
      });
      
      // Initialize empty calendar data as fallback
      initializeEmptyCalendarData();
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize empty calendar data
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

  // Process calendar data from various sources
  const processCalendarData = (availableSlots: any[], bookedSlots: any[]) => {
    const calendarData = new Map<string, Map<string, CalendarSlot>>();
    
    // Initialize calendar grid with empty slots
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
    
    // Add available slots
    availableSlots.forEach(slot => {
      const dayMap = calendarData.get(slot.date);
      if (dayMap && dayMap.has(slot.start_time)) {
        dayMap.set(slot.start_time, {
          ...dayMap.get(slot.start_time)!,
          status: 'available',
          notes: slot.notes
        });
      }
    });
    
    // Add booked slots
    bookedSlots.forEach(session => {
      const sessionDate = format(new Date(session.date), 'yyyy-MM-dd');
      const sessionTime = session.start_time;
      
      const dayMap = calendarData.get(sessionDate);
      if (dayMap && dayMap.has(sessionTime)) {
        dayMap.set(sessionTime, {
          ...dayMap.get(sessionTime)!,
          status: 'booked',
          notes: `Booked: ${session.patients?.name || 'Unknown patient'}`
        });
      }
    });
    
    return calendarData;
  };

  // Apply default availability patterns
  const applyDefaultAvailability = async () => {
    if (!tableExists) {
      toast({
        title: 'טבלת היומן חסרה',
        description: 'לא ניתן להגדיר זמינות ברירת מחדל ללא טבלת היומן. אנא צור את הטבלה תחילה.',
        variant: 'destructive',
      });
      return;
    }
    
    // Default availability patterns
    const defaultPatterns = [
      // Sunday, Monday, Tuesday, Thursday: 08:00 - 16:00
      { days: [0, 1, 2, 4], startHour: 8, endHour: 16 },
      // Sunday - Thursday: 21:00 - 23:00
      { days: [0, 1, 2, 3, 4], startHour: 21, endHour: 23 },
      // Friday: 09:00 - 11:00
      { days: [5], startHour: 9, endHour: 11 }
    ];
    
    const availabilitySlots: TimeSlot[] = [];
    
    // Generate 4 weeks of default availability
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
      
      // Batch insert default availability slots
      const { error } = await supabase
        .from('calendar_slots')
        .insert(availabilitySlots.map(slot => ({
          date: slot.date,
          day_of_week: slot.day,
          start_time: slot.startTime,
          end_time: slot.endTime,
          status: slot.status,
          is_recurring: slot.isRecurring
        })));
      
      if (error) throw new Error(error.message);
      
      // Refresh data after setting defaults
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

  // Update time slot status
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
      
      // Update in database
      if (newStatus === 'unspecified') {
        // Delete slot if setting to unspecified
        const { error } = await supabase
          .from('calendar_slots')
          .delete()
          .eq('date', date)
          .eq('start_time', hour);
        
        if (error) throw new Error(error.message);
      } else {
        // Upsert slot with new status
        const { error } = await supabase
          .from('calendar_slots')
          .upsert({
            date,
            day_of_week: new Date(date).getDay(),
            start_time: hour,
            end_time: hour.split(':')[0] + ':59', // End of the hour
            status: newStatus,
            is_recurring: false
          });
        
        if (error) throw new Error(error.message);
      }
      
      // Update local state
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

  // Handle date navigation
  const navigateWeek = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next'
      ? addDays(currentDate, 7)
      : addDays(currentDate, -7);
    setCurrentDate(newDate);
  };

  // Handle Google Calendar sync
  const handleGoogleSync = async (success: boolean) => {
    if (success) {
      setIsGoogleSynced(true);
      await fetchAvailabilityData(); // Refresh data after sync
      toast({
        title: 'סנכרון Google Calendar',
        description: 'היומן סונכרן בהצלחה והאירועים הפרטיים נטענו',
      });
    }
  };

  // Handle adding recurring availability
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
      
      // Generate slots based on recurring rule
      const startDate = new Date(rule.startDate);
      const dayOfWeek = rule.day;
      
      // Find the first occurrence of the day of week from start date
      let currentDate = startOfWeek(startDate, { weekStartsOn: 0 });
      currentDate = addDays(currentDate, dayOfWeek);
      
      if (currentDate < startDate) {
        currentDate = addDays(currentDate, 7); // Move to next week if before start date
      }
      
      // Generate slots for the specified number of occurrences
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
        currentDate = addDays(currentDate, 7); // Move to next week
      }
      
      // Insert all slots in a batch
      const { error } = await supabase
        .from('calendar_slots')
        .insert(slots);
      
      if (error) throw new Error(error.message);
      
      // Refresh data
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

  // Initial data loading
  useEffect(() => {
    fetchAvailabilityData();
  }, [currentDate]);

  // Create Calendar Slots Table if it doesn't exist
  const createCalendarSlotsTable = async () => {
    try {
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      // Execute SQL to create the table
      const { error } = await supabase.rpc('create_calendar_slots_table');
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Set table exists to true and fetch data
      setTableExists(true);
      toast({
        title: 'טבלת היומן נוצרה',
        description: 'טבלת היומן נוצרה בהצלחה וכעת ניתן להגדיר זמינות',
      });
      
      // Apply default availability
      await applyDefaultAvailability();
    } catch (error: any) {
      console.error('Error creating calendar slots table:', error);
      toast({
        title: 'שגיאה ביצירת טבלת היומן',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout title="ניהול זמינות יומן">
      <div className="container mx-auto py-6" dir="rtl">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">ניהול זמינות יומן</h1>
            <GoogleCalendarSync onSyncComplete={handleGoogleSync} />
          </div>
          
          <Separator className="my-4" />
          
          {!tableExists ? (
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
