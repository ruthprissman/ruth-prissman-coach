import { format, startOfDay, addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CalendarSlot, GoogleCalendarEvent } from '@/types/calendar';

// Debug version for tracking code execution
const UTILS_VERSION = "1.0.4";
console.log(`LOV_DEBUG_PROCESSING: Calendar data processing utils loaded, version ${UTILS_VERSION}`);

export const generateWeekDays = (currentDate: Date) => {
  const startDay = startOfDay(currentDate);
  const currentDayOfWeek = startDay.getDay();
  const daysToSunday = currentDayOfWeek;
  const sundayOfThisWeek = addDays(startDay, -daysToSunday);
  
  console.log(`LOV_DEBUG_PROCESSING: Generating week days from ${format(sundayOfThisWeek, 'yyyy-MM-dd')} (Sunday of the week)`);
  
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
  console.log(`LOV_DEBUG_PROCESSING: Generating empty calendar data for date: ${currentDate.toISOString()}`);
  
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

  console.log(`LOV_DEBUG_PROCESSING: Empty calendar data generated with ${days.length} days`);
  return emptyCalendarData;
};

export const processGoogleEvents = (
  calendarData: Map<string, Map<string, CalendarSlot>>,
  googleEvents: GoogleCalendarEvent[],
  days: { date: string }[]
) => {
  console.log(`LOV_DEBUG_PROCESSING: Processing ${googleEvents.length} Google events`);
  
  let processedEventCount = 0;
  let skippedEventCount = 0;
  
  // Create a map of google event IDs for quick lookup
  const googleEventIds = new Map<string, boolean>();
  googleEvents.forEach(event => {
    if (event.id) {
      googleEventIds.set(event.id, true);
    }
  });
  
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
        
        console.log(`LOV_DEBUG_PROCESSING: Event ${index}: ${event.summary} on ${googleDate} at ${exactStartTime}-${exactEndTime}`);
        
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
        if (!isDayVisible) {
          console.log(`LOV_DEBUG_PROCESSING: Skipping event ${index}, date ${googleDate} not in visible range`);
          skippedEventCount++;
          return;
        }
        
        const dayMap = calendarData.get(googleDate);
        if (!dayMap) {
          console.log(`LOV_DEBUG_PROCESSING: Skipping event ${index}, no day map for date ${googleDate}`);
          skippedEventCount++;
          return;
        }

        console.log(`LOV_DEBUG_PROCESSING: Processing hours for event ${index} from ${startHour} to ${adjustedEndHour}`);
        
        // Process each hour of the event
        for (let h = Number(startHour); h <= Number(adjustedEndHour); h++) {
          const hourString = h.toString().padStart(2, '0') + ':00';
          if (!dayMap.has(hourString)) {
            console.log(`LOV_DEBUG_PROCESSING: Hour ${hourString} not in calendar for event ${index}`);
            continue;
          }
          
          // Skip the last hour if the event ends exactly at :00
          if (h === Number(adjustedEndHour) && adjustedEndMinute === 0) {
            console.log(`LOV_DEBUG_PROCESSING: Skipping last hour ${hourString} for event ${index} as it ends at :00`);
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
          
          console.log(`LOV_DEBUG_PROCESSING: Set calendar slot for ${googleDate} ${hourString}, event "${event.summary}"`);
        }
        
        processedEventCount++;
      } catch (error) {
        console.error(`LOV_DEBUG_PROCESSING: Error processing Google event ${index}:`, error);
      }
    } else {
      console.log(`LOV_DEBUG_PROCESSING: Skipping event ${index}, missing start/end time`);
      skippedEventCount++;
    }
  });
  
  console.log(`LOV_DEBUG_PROCESSING: Google events processing complete. Processed: ${processedEventCount}, Skipped: ${skippedEventCount}`);
  return calendarData;
};

export const createGoogleEventsMap = (googleEvents: GoogleCalendarEvent[]) => {
  const googleEventsMap = new Map<string, GoogleCalendarEvent>();
  
  console.log(`LOV_DEBUG_PROCESSING: Creating Google events map from ${googleEvents.length} events`);
  
  googleEvents.forEach((event, index) => {
    if (!event.start?.dateTime) {
      console.log(`LOV_DEBUG_PROCESSING: Skipping event ${index} in map creation, no start time`);
      return;
    }
    
    const eventDate = new Date(event.start.dateTime);
    const dateKey = format(eventDate, 'yyyy-MM-dd');
    const hourKey = format(eventDate, 'HH:00');
    const key = `${dateKey}-${hourKey}`;
    
    googleEventsMap.set(key, event);
    console.log(`LOV_DEBUG_PROCESSING: Added event to map with key: ${key}`);
  });
  
  console.log(`LOV_DEBUG_PROCESSING: Completed Google events map with ${googleEventsMap.size} entries`);
  return googleEventsMap;
};

export const processFutureSessions = (
  calendarData: Map<string, Map<string, CalendarSlot>>,
  bookedSlots: any[],
  googleEventsMap: Map<string, GoogleCalendarEvent>
) => {
  console.log(`DB_BUTTON_DEBUG: Processing ${bookedSlots.length} future sessions`);
  
  // Create a map for faster lookups of which booked sessions exist in future_sessions
  // This helps us identify which Google events should or shouldn't have "Add to DB" buttons
  const futureSessionsMap = new Map<string, boolean>();

  // Track overlapping sessions
  const sessionTimeRanges = new Map<string, Array<{id: string, name: string, start: Date, end: Date}>>();
  const overlappingSessions: Array<{firstSession: string, secondSession: string, date: string}> = [];
  
  // First pass: collect all session time ranges for overlap detection
  bookedSlots.forEach((session) => {
    if (!session.session_date) return;
    
    try {
      const sessionDateTime = new Date(session.session_date);
      const sessionDate = formatInTimeZone(sessionDateTime, 'Asia/Jerusalem', 'yyyy-MM-dd');
      
      // Calculate session end time (90 minutes after start)
      const endTime = new Date(sessionDateTime.getTime() + 90 * 60000);
      
      // Store session time range by date for overlap checking
      if (!sessionTimeRanges.has(sessionDate)) {
        sessionTimeRanges.set(sessionDate, []);
      }
      
      const patientName = session.patients?.name || 'לקוח/ה';
      sessionTimeRanges.get(sessionDate)!.push({
        id: session.id,
        name: patientName,
        start: sessionDateTime,
        end: endTime
      });
    } catch (error) {
      console.error('Error processing session date for overlap check:', error, session);
    }
  });
  
  // Check for overlaps
  sessionTimeRanges.forEach((sessionsForDate, date) => {
    for (let i = 0; i < sessionsForDate.length; i++) {
      const session1 = sessionsForDate[i];
      
      for (let j = i + 1; j < sessionsForDate.length; j++) {
        const session2 = sessionsForDate[j];
        
        // Check if sessions overlap
        if ((session1.start <= session2.end) && (session1.end >= session2.start)) {
          console.log(`OVERLAP_DEBUG: Found overlapping sessions on ${date}:`);
          console.log(`  - ${session1.name} (${formatInTimeZone(session1.start, 'Asia/Jerusalem', 'HH:mm')} - ${formatInTimeZone(session1.end, 'Asia/Jerusalem', 'HH:mm')})`);
          console.log(`  - ${session2.name} (${formatInTimeZone(session2.start, 'Asia/Jerusalem', 'HH:mm')} - ${formatInTimeZone(session2.end, 'Asia/Jerusalem', 'HH:mm')})`);
          
          overlappingSessions.push({
            firstSession: session1.name,
            secondSession: session2.name,
            date: date
          });
        }
      }
    }
  });
  
  // Display toast messages for overlaps
  if (overlappingSessions.length > 0) {
    import('@/components/ui/use-toast').then(({ toast }) => {
      overlappingSessions.forEach(overlap => {
        toast({
          title: "התגלתה חפיפה בין פגישות!",
          description: `ב-${overlap.date} יש חפיפה בין פגישה עם ${overlap.firstSession} לפגישה עם ${overlap.secondSession}`,
          variant: "destructive",
        });
      });
    });
  }

  // Continue with the regular session processing as before
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
      
      // Add to map for quick lookups
      const sessionKey = `${sessionDate}-${sessionTime}`;
      futureSessionsMap.set(sessionKey, true);
      
      console.log(`DB_BUTTON_DEBUG: Session ${index} mapped with key: ${sessionKey}, patient: ${session.patients?.name || 'unknown'}`);
      
      const startMinute = parseInt(timeParts[1]);
      
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
      
      console.log(`DB_BUTTON_DEBUG: Session ${index} - inGoogleCalendar: ${inGoogleCalendar}, key: ${eventDateHourKey}`);
      console.log(`COLOR_DEBUG: Session ${index} color flags - inGoogleCalendar: ${inGoogleCalendar}, fromFutureSession: true`);
      
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
          
          // Check if this slot is already a Google event with the same details
          const existingSlot = dayMap.get(hourString);
          
          // Create or update the slot - ALWAYS mark the session as fromFutureSession: true
          // whether or not it's also in Google Calendar
          dayMap.set(hourString, {
            ...existingSlot!,
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
            fromFutureSession: true, // Mark ALL future_sessions entries with this flag
            futureSession: session,
            inGoogleCalendar: inGoogleCalendar, // This indicates if the session is also in Google Calendar
            // If the event exists in both Google and DB, preserve the Google flag
            fromGoogle: existingSlot?.fromGoogle || inGoogleCalendar
          });
          
          // Additional color debug logging
          if (isFirstHour) {
            console.log(`COLOR_DEBUG: Set future session at ${sessionDate} ${hourString}, inGoogleCalendar: ${inGoogleCalendar}, fromFutureSession: true, fromGoogle: ${existingSlot?.fromGoogle || inGoogleCalendar}`);
          }
          
          // Log for debugging
          if (isFirstHour) {
            console.log(`DB_BUTTON_DEBUG: Set future session slot for ${sessionDate} ${hourString}, patient "${patientName}", inGoogleCalendar: ${inGoogleCalendar}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing session date:', error, session);
    }
  });
  
  // Now we need to check if any Google events should be marked as "already in DB"
  // This ensures we don't show "Add to DB" buttons for events that are already in our database
  calendarData.forEach((dayMap, date) => {
    dayMap.forEach((slot, hour) => {
      if (slot.fromGoogle) {
        const slotKey = `${date}-${hour}`;
        // If this Google event's time slot exists in our future_sessions map, mark it accordingly
        if (futureSessionsMap.has(slotKey)) {
          console.log(`DB_BUTTON_DEBUG: Marking Google event at ${slotKey} as already in DB`);
          console.log(`COLOR_DEBUG: Updating flags for existing Google event at ${slotKey} - setting fromFutureSession: true, inGoogleCalendar: true`);
          
          // Update the slot to show it's from future_sessions too
          dayMap.set(hour, {
            ...slot,
            fromFutureSession: true, // Marking that this event is also in DB
            inGoogleCalendar: true    // Since it's a Google event, it's in Google Calendar
          });
        } else {
          console.log(`COLOR_DEBUG: Google event at ${slotKey} is not in future_sessions, keeping flags - fromFutureSession: ${slot.fromFutureSession || false}, inGoogleCalendar: ${slot.inGoogleCalendar || false}`);
        }
      }
    });
  });
  
  // Debug: After processing, check all future sessions and Google events for proper flags
  console.log(`COLOR_DEBUG: Final check of meeting color flag states:`);
  calendarData.forEach((dayMap, date) => {
    dayMap.forEach((slot, hour) => {
      if (slot.fromGoogle || slot.fromFutureSession) {
        console.log(`COLOR_DEBUG: Event at ${date} ${hour} - fromGoogle: ${slot.fromGoogle}, fromFutureSession: ${slot.fromFutureSession}, inGoogleCalendar: ${slot.inGoogleCalendar}`);
      }
    });
  });
  
  return calendarData;
};
