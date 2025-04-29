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
        
        // Always use 90 minutes for patient meetings
        let adjustedEndDate = isMeeting 
          ? new Date(startDate.getTime() + 90 * 60000) 
          : endDate;
        
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

        // Process each hour of the event
        for (let h = Number(startHour); h <= Number(adjustedEndHour); h++) {
          const hourString = h.toString().padStart(2, '0') + ':00';
          if (!dayMap.has(hourString)) continue;
          
          // Skip the last hour if the event ends exactly at :00
          if (h === Number(adjustedEndHour) && adjustedEndMinute === 0) {
            continue;
          }
          
          // Calculate if this hour is partial (for proper rendering)
          const isFirstHour = h === Number(startHour);
          const isLastHour = h === Number(adjustedEndHour);
          let currentStartMinute = 0;
          let currentEndMinute = 59;
          
          if (isFirstHour && startMinute > 0) {
            currentStartMinute = startMinute;
          }
          
          if (isLastHour && adjustedEndMinute > 0) {
            currentEndMinute = adjustedEndMinute;
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
            isFirstHour,
            isLastHour,
            startMinute: currentStartMinute,
            endMinute: currentEndMinute,
            isPartialHour: isPartialHour && (isFirstHour || isLastHour),
            showBorder: false
          });
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
  console.log('Processing future sessions:', bookedSlots.length);
  
  bookedSlots.forEach((session, index) => {
    if (!session.session_date) {
      console.log(`Session ${index} has no date:`, session);
      return;
    }
    
    try {
      const sessionDateTime = new Date(session.session_date);
      const israelTime = formatInTimeZone(sessionDateTime, 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm:ss');
      
      const sessionDate = israelTime.split(' ')[0];
      const timeParts = israelTime.split(' ')[1].split(':');
      const sessionTime = `${timeParts[0]}:00`;
      const startMinute = parseInt(timeParts[1]);
      
      console.log(`Session ${index} date: ${sessionDate}, time: ${sessionTime}, patient: ${session.patients?.name || 'unknown'}`);
      
      const dayMap = calendarData.get(sessionDate);
      if (!dayMap) {
        console.log(`No day map for session date: ${sessionDate}`);
        return;
      }
      
      if (!dayMap.has(sessionTime)) {
        console.log(`No slot for session time: ${sessionTime}`);
        return;
      }
      
      // Always use 90 minutes (1.5 hours) for patient meetings
      const endTime = new Date(sessionDateTime.getTime() + 90 * 60000);
      const formattedEndTime = formatInTimeZone(endTime, 'Asia/Jerusalem', 'HH:mm');
      const endHour = parseInt(formattedEndTime.split(':')[0]);
      const endMinute = parseInt(formattedEndTime.split(':')[1]);
      const hoursSpan = Math.ceil(90 / 60); // 1.5 hours
      
      const eventDateHourKey = `${sessionDate}-${sessionTime}`;
      const inGoogleCalendar = googleEventsMap.has(eventDateHourKey);
      
      if (inGoogleCalendar) {
        console.log(`Session ${index} already in Google Calendar`);
        return; // Skip if already in Google Calendar
      }
      
      let status: 'available' | 'booked' | 'completed' | 'canceled' | 'private' | 'unspecified' = 'booked';
      if (session.status === 'Completed') status = 'completed';
      if (session.status === 'Cancelled') status = 'canceled';
      
      const patientName = session.patients?.name || 'לקוח/ה';
      const noteText = `פגישה עם ${patientName}`;
      
      // Process each hour of the event
      for (let h = parseInt(sessionTime.split(':')[0]); h <= endHour; h++) {
        const hourString = h.toString().padStart(2, '0') + ':00';
        
        // Skip the last hour if the event ends exactly at :00
        if (h === endHour && endMinute === 0) {
          continue;
        }
        
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
          
          // Create or update the slot
          dayMap.set(hourString, {
            ...dayMap.get(hourString)!,
            status,
            notes: noteText,
            description: session.title || '',
            exactStartTime: `${timeParts[0]}:${timeParts[1]}`,
            exactEndTime: formattedEndTime,
            startMinute: currentStartMinute,
            endMinute: currentEndMinute,
            isPartialHour: (isFirstHour && startMinute > 0) || (isLastHour && endMinute > 0),
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
    } catch (error) {
      console.error('Error processing session date:', error, session);
    }
  });
  
  // Debug: After processing, check all future sessions for showBorder property
  console.log('Checking future sessions for proper styling...');
  calendarData.forEach((dayMap, date) => {
    dayMap.forEach((slot, hour) => {
      if (slot.fromFutureSession) {
        console.log(`Future session at ${date} ${hour} - showBorder: ${slot.showBorder}, isFirst: ${slot.isFirstHour}, isLast: ${slot.isLastHour}`);
      }
    });
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
