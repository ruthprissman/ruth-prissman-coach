import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { CalendarSlot, TimeSlot, GoogleCalendarEvent } from '@/types/calendar';
import { addDays, format, startOfDay, addHours } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function useCalendarData(
  currentDate: Date,
  googleEvents: GoogleCalendarEvent[],
  isGoogleAuthenticated: boolean
) {
  const [calendarData, setCalendarData] = useState<Map<string, Map<string, CalendarSlot>>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const processCalendarDataWithGoogleEvents = (
    availableSlots: any[], 
    bookedSlots: any[],
    googleCalendarEvents: GoogleCalendarEvent[]
  ) => {
    console.log('processCalendarDataWithGoogleEvents called with', {
      availableSlotsCount: availableSlots.length,
      bookedSlotsCount: bookedSlots.length,
      googleEventsCount: googleCalendarEvents.length
    });
    
    const calendarData = new Map<string, Map<string, CalendarSlot>>();
    
    // Initialize calendar data with empty slots
    const generateDaysOfWeek = (startDate: Date) => {
      const weekStart = startOfDay(startDate);
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

    const hours = Array.from({ length: 16 }, (_, i) => {
      const hour = i + 8;
      return `${hour.toString().padStart(2, '0')}:00`;
    });

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

    // Process Google Calendar events
    googleCalendarEvents.forEach((event, index) => {
      if (event.start?.dateTime && event.end?.dateTime) {
        try {
          const startDate = new Date(event.start.dateTime);
          const endDate = new Date(event.end.dateTime);
          
          const googleDate = format(startDate, 'yyyy-MM-dd');
          const exactStartTime = format(startDate, 'HH:mm');
          const exactEndTime = format(endDate, 'HH:mm');
          
          // Get the rounded hour for the slot
          const googleHour = format(startDate, 'HH:00');
          
          console.log(`Processing Google event ${index}:`, {
            summary: event.summary,
            exactStartTime,
            exactEndTime,
            googleHour,
            googleDate
          });

          const isDayVisible = days.some(day => day.date === googleDate);
          if (!isDayVisible) {
            console.log(`Skipping event ${index}: day is not in current view`);
            return;
          }
          
          const dayMap = calendarData.get(googleDate);
          if (dayMap && dayMap.has(googleHour)) {
            const existingSlot = dayMap.get(googleHour);
            
            if (existingSlot?.status !== 'booked' && existingSlot?.status !== 'completed') {
              const isMeeting = event.summary?.startsWith('פגישה עם') || 
                              event.summary?.startsWith('שיחה עם');
              
              console.log(`Updating slot for event ${index}:`, {
                summary: event.summary,
                isMeeting,
                exactStartTime,
                exactEndTime
              });
              
              dayMap.set(googleHour, {
                ...existingSlot!,
                status: 'booked',
                notes: event.summary || 'אירוע Google',
                description: event.description,
                fromGoogle: true,
                syncStatus: 'google-only',
                googleEvent: event,
                startTime: googleHour,
                endTime: format(addHours(startDate, 1), 'HH:00'),
                exactStartTime,
                exactEndTime
              });
            }
          }
        } catch (error) {
          console.error(`Error processing Google event ${index}:`, error);
        }
      }
    });

    // Process available and booked slots
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
        const israelTime = format(sessionDateTime, 'yyyy-MM-dd HH:mm:ss');
        
        const sessionDate = israelTime.split(' ')[0];
        const timeParts = israelTime.split(' ')[1].split(':');
        const sessionTime = `${timeParts[0]}:00`;
        
        const dayMap = calendarData.get(sessionDate);
        if (dayMap && dayMap.has(sessionTime)) {
          const endTime = addHours(sessionDateTime, 1.5);
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

  const fetchAvailabilityData = async () => {
    try {
      setIsLoading(true);
      
      const supabase = await supabaseClient();
      
      const today = startOfDay(new Date());
      const thirtyDaysLater = addDays(today, 30);
      
      const { data: availableSlots, error: availableSlotsError } = await supabase
        .from('calendar_slots')
        .select('*')
        .gte('date', format(today, 'yyyy-MM-dd'))
        .lte('date', format(thirtyDaysLater, 'yyyy-MM-dd'));
      
      if (availableSlotsError) throw new Error(availableSlotsError.message);
      
      const { data: bookedSlots, error: bookedSlotsError } = await supabase
        .from('future_sessions')
        .select('*, patients(name)')
        .gte('session_date', format(today, 'yyyy-MM-dd'))
        .lte('session_date', format(thirtyDaysLater, 'yyyy-MM-dd'));
      
      if (bookedSlotsError) throw new Error(bookedSlotsError.message);

      if (isGoogleAuthenticated && googleEvents.length > 0) {
        console.log('Processing calendar data with Google events:', googleEvents);
        const newData = processCalendarDataWithGoogleEvents(availableSlots || [], bookedSlots || [], googleEvents);
        setCalendarData(newData);
      } else {
        console.log('Using regular calendar data processing (no Google events)');
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

  const processCalendarData = (availableSlots: any[], bookedSlots: any[]) => {
    const calendarData = new Map<string, Map<string, CalendarSlot>>();
    
    const generateDaysOfWeek = (startDate: Date) => {
      const weekStart = startOfDay(startDate);
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

    const hours = Array.from({ length: 16 }, (_, i) => {
      const hour = i + 8;
      return `${hour.toString().padStart(2, '0')}:00`;
    });
    
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
          const endTime = addHours(sessionDateTime, 1.5);
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

  const initializeEmptyCalendarData = () => {
    const emptyCalendarData = new Map<string, Map<string, CalendarSlot>>();

    const generateDaysOfWeek = (startDate: Date) => {
      const weekStart = startOfDay(startDate);
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

    const hours = Array.from({ length: 16 }, (_, i) => {
      const hour = i + 8;
      return `${hour.toString().padStart(2, '0')}:00`;
    });
    
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

  useEffect(() => {
    fetchAvailabilityData();
  }, [currentDate, googleEvents, isGoogleAuthenticated]);

  return {
    calendarData,
    setCalendarData,
    isLoading,
    fetchAvailabilityData
  };
}
