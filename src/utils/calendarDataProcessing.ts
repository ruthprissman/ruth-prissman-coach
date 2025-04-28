
import { format, startOfDay, addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarSlot, GoogleCalendarEvent } from '@/types/calendar';

export const generateWeekDays = (currentDate: Date) => {
  const startDay = startOfDay(currentDate);
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

export const generateEmptyCalendarData = (currentDate: Date) => {
  const emptyCalendarData = new Map<string, Map<string, CalendarSlot>>();
  const days = generateWeekDays(currentDate);
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

  return emptyCalendarData;
};

export const processGoogleEvents = (
  calendarData: Map<string, Map<string, CalendarSlot>>,
  googleEvents: GoogleCalendarEvent[],
  days: { date: string }[]
) => {
  googleEvents.forEach((event, index) => {
    if (event.start?.dateTime && event.end?.dateTime) {
      try {
        const startDate = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);
        
        const googleDate = format(startDate, 'yyyy-MM-dd');
        const exactStartTime = format(startDate, 'HH:mm');
        const exactEndTime = format(endDate, 'HH:mm');
        
        const startHour = format(startDate, 'HH');
        const startMinute = parseInt(format(startDate, 'mm'));
        const endHour = format(endDate, 'HH');
        const endMinute = parseInt(format(endDate, 'mm'));
        
        const isMeeting = event.summary?.toLowerCase().includes('פגישה עם') || 
                       event.summary?.toLowerCase().includes('שיחה עם');
        
        let adjustedEndDate = endDate;
        if (isMeeting) {
          adjustedEndDate = new Date(startDate.getTime() + 90 * 60000);
        }
        
        const adjustedEndHour = format(adjustedEndDate, 'HH');
        const adjustedEndMinute = parseInt(format(adjustedEndDate, 'mm'));
        const adjustedExactEndTime = format(adjustedEndDate, 'HH:mm');
        
        const startTimeInMinutes = (parseInt(startHour) * 60) + startMinute;
        const endTimeInMinutes = (parseInt(adjustedEndHour) * 60) + adjustedEndMinute;
        const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
        const hoursSpan = Math.ceil(durationInMinutes / 60);
        
        const isPartialHour = startMinute > 0 || adjustedEndMinute > 0;

        const isDayVisible = days.some(day => day.date === googleDate);
        if (!isDayVisible) return;
        
        const dayMap = calendarData.get(googleDate);
        if (!dayMap) return;

        for (let h = Number(startHour); h <= Number(adjustedEndHour); h++) {
          const hourString = h.toString().padStart(2, '0') + ':00';
          if (dayMap.has(hourString)) {
            let isPartialStart = false;
            let isPartialEnd = false;
            let currentStartMinute = 0;
            let currentEndMinute = 59;
            
            if (h === Number(startHour) && startMinute > 0) {
              isPartialStart = true;
              currentStartMinute = startMinute;
            }
            
            if (h === Number(adjustedEndHour) && adjustedEndMinute > 0) {
              isPartialEnd = true;
              currentEndMinute = adjustedEndMinute;
            } else if (h === Number(adjustedEndHour) && adjustedEndMinute === 0) {
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
              syncStatus: 'synced',
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
              showBorder: false
            });
          }
        }
      } catch (error) {
        console.error(`Error processing Google event ${index}:`, error);
      }
    }
  });
  
  return calendarData;
};

export const processFutureSessions = (
  calendarData: Map<string, Map<string, CalendarSlot>>,
  bookedSlots: any[],
  googleEventsMap: Map<string, GoogleCalendarEvent>
) => {
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
        const endTime = new Date(sessionDateTime.getTime() + 90 * 60000);
        const formattedEndTime = formatInTimeZone(endTime, 'Asia/Jerusalem', 'HH:mm');
        const endHour = parseInt(formattedEndTime.split(':')[0]);
        const endMinute = parseInt(formattedEndTime.split(':')[1]);
        const isPartialHour = startMinute > 0 || endMinute > 0;
        const hoursSpan = Math.ceil(90 / 60);
        
        const eventDateHourKey = `${sessionDate}-${sessionTime}`;
        const inGoogleCalendar = googleEventsMap.has(eventDateHourKey);
        
        if (inGoogleCalendar) return;
        
        let status: 'available' | 'booked' | 'completed' | 'canceled' | 'private' | 'unspecified' = 'booked';
        if (session.status === 'Completed') status = 'completed';
        if (session.status === 'Cancelled') status = 'canceled';
        
        const patientName = session.patients?.name || 'לקוח/ה';
        const noteText = `פגישה עם ${patientName}`;
        
        for (let h = parseInt(sessionTime.split(':')[0]); h <= endHour; h++) {
          const hourString = h.toString().padStart(2, '0') + ':00';
          
          if (dayMap.has(hourString)) {
            const isFirstHour = h === parseInt(sessionTime.split(':')[0]);
            const isLastHour = h === endHour;
            
            let currentStartMinute = 0;
            let currentEndMinute = 59;
            
            if (isFirstHour) {
              currentStartMinute = startMinute;
            }
            
            if (isLastHour) {
              currentEndMinute = endMinute;
            }
            
            dayMap.set(hourString, {
              ...dayMap.get(hourString)!,
              status,
              notes: noteText,
              description: session.title || '',
              exactStartTime: `${timeParts[0]}:${timeParts[1]}`,
              exactEndTime: formattedEndTime,
              startMinute: currentStartMinute,
              endMinute: currentEndMinute,
              isPartialHour,
              isPatientMeeting: true,
              hoursSpan,
              isFirstHour,
              isLastHour,
              syncStatus: 'synced',
              showBorder: false,
              fromFutureSession: true,
              futureSession: session,
              inGoogleCalendar: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing session date:', error);
    }
  });
  
  return calendarData;
};

export const createGoogleEventsMap = (googleEvents: GoogleCalendarEvent[]) => {
  const googleEventsMap = new Map<string, GoogleCalendarEvent>();
  
  googleEvents.forEach(event => {
    if (!event.start?.dateTime) return;
    
    const eventDate = new Date(event.start.dateTime);
    const dateKey = format(eventDate, 'yyyy-MM-dd');
    const hourKey = format(eventDate, 'HH:00');
    const key = `${dateKey}-${hourKey}`;
    
    googleEventsMap.set(key, event);
  });
  
  return googleEventsMap;
};
