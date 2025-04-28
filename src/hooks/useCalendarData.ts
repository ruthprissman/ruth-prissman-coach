import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { CalendarSlot, TimeSlot, GoogleCalendarEvent } from '@/types/calendar';
import { addDays, format, startOfDay, addHours, addMinutes } from 'date-fns';
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
      const startDay = startOfDay(startDate);
      // Get the current day of week (0-6, where 0 is Sunday)
      const currentDayOfWeek = startDay.getDay();
      
      // Calculate how many days to go back to get to Sunday
      const daysToSunday = currentDayOfWeek;
      
      // Get the Sunday of the current week
      const sundayOfThisWeek = addDays(startDay, -daysToSunday);
      
      const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      
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
    const hours = Array.from({ length: 16 }, (_, i) => {
      const hour = i + 8;
      return `${hour.toString().padStart(2, '0')}:00`;
    });

    // Initialize empty calendar
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

    // Create a map of Google Calendar events for easy lookup
    const googleEventsMap = new Map<string, GoogleCalendarEvent>();
    googleCalendarEvents.forEach(event => {
      if (!event.start?.dateTime) return;
      
      const eventDate = new Date(event.start.dateTime);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      const hourKey = format(eventDate, 'HH:00');
      const key = `${dateKey}-${hourKey}`;
      
      googleEventsMap.set(key, event);
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
          
          // Extract hour and minute
          const startHour = format(startDate, 'HH');
          const startMinute = parseInt(format(startDate, 'mm'));
          const endHour = format(endDate, 'HH');
          const endMinute = parseInt(format(endDate, 'mm'));
          
          // Check if this is a patient meeting
          const isMeeting = event.summary?.toLowerCase().includes('פגישה עם') || 
                         event.summary?.toLowerCase().includes('שיחה עם');
          
          // For patient meetings, always make them 90 minutes
          let adjustedEndDate = endDate;
          if (isMeeting) {
            adjustedEndDate = addMinutes(startDate, 90);
          }
          
          // Recalculate end hour and minute if this is a patient meeting
          const adjustedEndHour = format(adjustedEndDate, 'HH');
          const adjustedEndMinute = parseInt(format(adjustedEndDate, 'mm'));
          const adjustedExactEndTime = format(adjustedEndDate, 'HH:mm');
          
          // Calculate duration in hours
          const startTimeInMinutes = (parseInt(startHour) * 60) + startMinute;
          const endTimeInMinutes = (parseInt(adjustedEndHour) * 60) + adjustedEndMinute;
          const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
          const hoursSpan = Math.ceil(durationInMinutes / 60);
          
          const isPartialHour = startMinute > 0 || adjustedEndMinute > 0;
          
          console.log(`Processing Google event ${index}:`, {
            summary: event.summary,
            exactStartTime,
            originalEndTime: exactEndTime,
            adjustedEndTime: adjustedExactEndTime,
            startHour,
            startMinute,
            endHour: adjustedEndHour,
            endMinute: adjustedEndMinute,
            hoursSpan,
            isPartialHour,
            isMeeting
          });

          const isDayVisible = days.some(day => day.date === googleDate);
          if (!isDayVisible) {
            console.log(`Skipping event ${index}: day is not in current view`);
            return;
          }
          
          const dayMap = calendarData.get(googleDate);
          if (!dayMap) return;

          // Mark all affected hours
          for (let h = Number(startHour); h <= Number(adjustedEndHour); h++) {
            const hourString = h.toString().padStart(2, '0') + ':00';
            if (dayMap.has(hourString)) {
              // Calculate partial hour information
              let isPartialStart = false;
              let isPartialEnd = false;
              let currentStartMinute = 0;
              let currentEndMinute = 59;
              
              // If this is the first hour and has a non-zero start minute
              if (h === Number(startHour) && startMinute > 0) {
                isPartialStart = true;
                currentStartMinute = startMinute;
              }
              
              // If this is the last hour and doesn't end exactly at :00
              if (h === Number(adjustedEndHour) && adjustedEndMinute > 0) {
                isPartialEnd = true;
                currentEndMinute = adjustedEndMinute;
              } else if (h === Number(adjustedEndHour) && adjustedEndMinute === 0) {
                // If it ends exactly at the hour, don't include this hour block
                continue;
              }
              
              dayMap.set(hourString, {
                ...dayMap.get(hourString)!,
                status: 'booked',
                notes: event.summary || 'אירוע Google',
                description: event.description,
                fromGoogle: true,
                isMeeting,
                isPatientMeeting: isMeeting,
                syncStatus: 'synced', // Changed from 'google-only' to avoid warning triangle
                googleEvent: event,
                startTime: startHour + ':00',
                endTime: adjustedEndHour + ':00',
                exactStartTime,
                exactEndTime: adjustedExactEndTime,
                hoursSpan,
                isFirstHour: h === Number(startHour),
                isLastHour: h === Number(adjustedEndHour),
                startMinute: currentStartMinute,
                endMinute: currentEndMinute,
                isPartialHour: isPartialStart || isPartialEnd,
                showBorder: false // No border for events
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
          notes: slot.notes,
          syncStatus: 'synced',
          showBorder: false
        });
      }
    });
    
    // Process future sessions (bookings)
    bookedSlots.forEach(session => {
      if (!session.session_date) return;
      
      try {
        const sessionDateTime = new Date(session.session_date);
        const israelTime = formatInTimeZone(sessionDateTime, 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss');
        
        const sessionDate = israelTime.split(' ')[0];
        const timeParts = israelTime.split(' ')[1].split(':');
        const sessionTime = `${timeParts[0]}:00`;
        const startMinute = parseInt(timeParts[1]);
        
        const dayMap = calendarData.get(sessionDate);
        if (dayMap && dayMap.has(sessionTime)) {
          // Always make sessions 90 minutes
          const endTime = addMinutes(sessionDateTime, 90);
          const formattedEndTime = formatInTimeZone(endTime, 'Asia/Jerusalem', 'HH:mm');
          const endMinute = parseInt(formattedEndTime.split(':')[1]);
          const isPartialHour = startMinute > 0 || endMinute > 0;
          
          // Check if this session exists in Google Calendar
          const eventDateHourKey = `${sessionDate}-${sessionTime}`;
          const inGoogleCalendar = googleEventsMap.has(eventDateHourKey);
          
          // If the session is already in Google Calendar, we don't need to mark it as a future session
          if (inGoogleCalendar) {
            console.log(`Session already exists in Google Calendar:`, {
              date: sessionDate,
              time: sessionTime,
              patientName: session.patients?.name || 'לקוח/ה'
            });
            return; // Skip this session as it's already in the calendar
          }
          
          let status: 'available' | 'booked' | 'completed' | 'canceled' | 'private' | 'unspecified' = 'booked';
          if (session.status === 'Completed') status = 'completed';
          if (session.status === 'Cancelled') status = 'canceled';
          
          // Updated: Always prefix with "פגישה עם" if not already there
          const patientName = session.patients?.name || 'לקוח/ה';
          const noteText = session.title ? 
            (session.title.startsWith('פגישה עם') ? session.title : `פגישה עם ${patientName}`) : 
            `פגישה עם ${patientName}`;
          
          dayMap.set(sessionTime, {
            ...dayMap.get(sessionTime)!,
            status,
            notes: noteText,
            exactStartTime: `${timeParts[0]}:${timeParts[1]}`,
            exactEndTime: formattedEndTime,
            startMinute,
            endMinute,
            isPartialHour,
            isPatientMeeting: true,
            syncStatus: 'synced',
            showBorder: false,
            fromFutureSession: true,
            futureSession: session,
            inGoogleCalendar: false
          });
        }
      } catch (error) {
        console.error('Error processing session date:', error);
      }
    });
    
    return calendarData;
  };

  const processCalendarData = (availableSlots: any[], bookedSlots: any[]) => {
    const calendarData = new Map<string, Map<string, CalendarSlot>>();
    
    // Initialize calendar data with empty slots
    const generateDaysOfWeek = (startDate: Date) => {
      const startDay = startOfDay(startDate);
      const currentDayOfWeek = startDay.getDay();
      const daysToSunday = currentDayOfWeek;
      const sundayOfThisWeek = addDays(startDay, -daysToSunday);
      
      const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      
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
        const startMinute = parseInt(timeParts[1]);
        
        const dayMap = calendarData.get(sessionDate);
        if (dayMap && dayMap.has(sessionTime)) {
          const endTime = addMinutes(sessionDateTime, 90);
          const formattedEndTime = formatInTimeZone(endTime, 'Asia/Jerusalem', 'HH:mm');
          const endMinute = parseInt(formattedEndTime.split(':')[1]);
          const isPartialHour = startMinute > 0 || endMinute > 0;
          
          let status: 'available' | 'booked' | 'completed' | 'canceled' | 'private' | 'unspecified' = 'booked';
          if (session.status === 'Completed') status = 'completed';
          if (session.status === 'Cancelled') status = 'canceled';
          
          // Updated: Always prefix with "פגישה עם" if not already there
          const patientName = session.patients?.name || 'לקוח/ה';
          const noteText = session.title ? 
            (session.title.startsWith('פגישה עם') ? session.title : `פגישה עם ${patientName}`) : 
            `פגישה עם ${patientName}`;
          
          dayMap.set(sessionTime, {
            ...dayMap.get(sessionTime)!,
            status,
            notes: noteText,
            exactStartTime: `${timeParts[0]}:${timeParts[1]}`,
            exactEndTime: formattedEndTime,
            startMinute,
            endMinute,
            isPartialHour,
            isPatientMeeting: true,
            showBorder: false,
            fromFutureSession: true,
            futureSession: session,
            inGoogleCalendar: false
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

  const initializeEmptyCalendarData = () => {
    const emptyCalendarData = new Map<string, Map<string, CalendarSlot>>();

    const generateDaysOfWeek = (startDate: Date) => {
      const startDay = startOfDay(startDate);
      const currentDayOfWeek = startDay.getDay();
      const daysToSunday = currentDayOfWeek;
      const sundayOfThisWeek = addDays(startDay, -daysToSunday);
      
      const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      
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
