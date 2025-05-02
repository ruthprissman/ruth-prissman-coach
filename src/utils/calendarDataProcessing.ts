import { format, startOfDay, addDays } from 'date-fns';
import { CalendarSlot, GoogleCalendarEvent } from '@/types/calendar';
import { formatInTimeZone, getDateTimeParts, addMinutesToDate } from '@/utils/dateTimeUtils';

// Debug version for tracking code execution - updated to reflect fixes
const UTILS_VERSION = "1.0.6";
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
        console.log(`LOV_DEBUG_PROCESSING: Processing Google event ${index}: ${event.summary}`);

        // Use our new date utilities with proper timezone handling
        const startDate = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);
        
        // Format the date parts using our utility function
        const { date: googleDate, hour: startHour, minute: startMinute, fullTime: exactStartTime } = getDateTimeParts(startDate);
        const { hour: endHour, minute: endMinute, fullTime: exactEndTime } = getDateTimeParts(endDate);
        
        console.log(`LOV_DEBUG_PROCESSING: Event ${index} time parts:`, {
          googleDate,
          exactStartTime,
          exactEndTime,
          startHour,
          startMinute,
          endHour,
          endMinute
        });
        
        const isMeeting = event.summary?.toLowerCase().includes('פגישה עם') || 
                       event.summary?.toLowerCase().includes('שיחה עם');
        
        // Always use 90 minutes for patient meetings
        let adjustedEndDate = isMeeting 
          ? addMinutesToDate(startDate, 90)
          : endDate;
        
        const { hour: adjustedEndHour, minute: adjustedEndMinute, fullTime: adjustedExactEndTime } = getDateTimeParts(adjustedEndDate);
        
        const startTimeInMinutes = (parseInt(startHour) * 60) + parseInt(startMinute);
        const endTimeInMinutes = (parseInt(adjustedEndHour) * 60) + parseInt(adjustedEndMinute);
        const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
        const hoursSpan = Math.ceil(durationInMinutes / 60);
        
        const isPartialHour = parseInt(startMinute) > 0 || parseInt(adjustedEndMinute) > 0;

        console.log(`LOV_DEBUG_PROCESSING: Event ${index} calculations:`, {
          isMeeting,
          durationInMinutes,
          hoursSpan,
          isPartialHour,
          adjustedEndHour,
          adjustedEndMinute,
          adjustedExactEndTime
        });

        // Check if the day is in the visible range
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
        for (let h = parseInt(startHour); h <= parseInt(adjustedEndHour); h++) {
          const hourString = h.toString().padStart(2, '0') + ':00';
          if (!dayMap.has(hourString)) {
            console.log(`LOV_DEBUG_PROCESSING: Hour ${hourString} not in calendar for event ${index}`);
            continue;
          }
          
          // Skip the last hour if the event ends exactly at :00
          if (h === parseInt(adjustedEndHour) && parseInt(adjustedEndMinute) === 0) {
            console.log(`LOV_DEBUG_PROCESSING: Skipping last hour ${hourString} for event ${index} as it ends at :00`);
            continue;
          }
          
          // Calculate if this hour is partial (for proper rendering)
          const isFirstHour = h === parseInt(startHour);
          const isLastHour = h === parseInt(adjustedEndHour);
          let currentStartMinute = 0;
          let currentEndMinute = 59;
          
          if (isFirstHour && parseInt(startMinute) > 0) {
            currentStartMinute = parseInt(startMinute);
          }
          
          if (isLastHour && parseInt(adjustedEndMinute) > 0) {
            currentEndMinute = parseInt(adjustedEndMinute);
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
    
    try {
      const { date: dateKey, hour: hourKey } = getDateTimeParts(event.start.dateTime);
      const key = `${dateKey}-${hourKey}:00`;
      
      googleEventsMap.set(key, event);
      console.log(`LOV_DEBUG_PROCESSING: Added event to map with key: ${key}`);
    } catch (error) {
      console.error(`LOV_DEBUG_PROCESSING: Error adding event ${index} to map:`, error);
    }
  });
  
  console.log(`LOV_DEBUG_PROCESSING: Completed Google events map with ${googleEventsMap.size} entries`);
  return googleEventsMap;
};

// New function to detect conflicting slots between Google Calendar and future sessions
export const detectMeetingConflicts = (
  calendarData: Map<string, Map<string, CalendarSlot>>
) => {
  // Store all meetings in temporary maps for conflict detection
  const googleCalendarMeetings = new Map<string, CalendarSlot>();
  const futureSessionMeetings = new Map<string, CalendarSlot>();
  
  console.log(`CONFLICT_RESOLUTION_DEBUG: Detecting meeting conflicts`);
  
  // First pass - identify and collect all meetings
  calendarData.forEach((dayMap, date) => {
    dayMap.forEach((slot, hour) => {
      // Only check first hours of meetings to avoid duplicate conflicts
      if ((slot.isFirstHour || !slot.isPartialHour) && isWorkMeeting(slot)) {
        const timeKey = `${date}-${hour}`;
        
        if (slot.fromGoogle && !slot.fromFutureSession) {
          googleCalendarMeetings.set(timeKey, slot);
          console.log(`CONFLICT_RESOLUTION_DEBUG: Found Google Calendar meeting at ${timeKey}: ${slot.notes}`);
        }
        
        if (slot.fromFutureSession && !slot.fromGoogle) {
          futureSessionMeetings.set(timeKey, slot);
          console.log(`CONFLICT_RESOLUTION_DEBUG: Found future session at ${timeKey}: ${slot.notes}`);
        }
      }
    });
  });
  
  // Second pass - find and mark conflicts
  let conflictCount = 0;
  
  googleCalendarMeetings.forEach((googleSlot, timeKey) => {
    if (futureSessionMeetings.has(timeKey)) {
      const futureSessionSlot = futureSessionMeetings.get(timeKey)!;
      conflictCount++;
      
      console.log(`CONFLICT_RESOLUTION_DEBUG: Found conflict at ${timeKey}:`);
      console.log(`CONFLICT_RESOLUTION_DEBUG: - Google: ${googleSlot.notes}`);
      console.log(`CONFLICT_RESOLUTION_DEBUG: - Future session: ${futureSessionSlot.notes}`);
      
      // Mark both slots as having conflicts
      const [date, hour] = timeKey.split('-');
      const dayMap = calendarData.get(date);
      
      if (dayMap && dayMap.has(hour)) {
        const slot = dayMap.get(hour)!;
        
        // Update the slot with conflict information
        dayMap.set(hour, {
          ...slot,
          hasConflict: true,
          conflictSlot: futureSessionSlot
        });
        
        // Also update the future session slot
        const fsTimeKey = `${futureSessionSlot.date}-${futureSessionSlot.hour}`;
        const [fsDate, fsHour] = fsTimeKey.split('-');
        const fsMap = calendarData.get(fsDate);
        
        if (fsMap && fsMap.has(fsHour)) {
          const fsSlot = fsMap.get(fsHour)!;
          
          fsMap.set(fsHour, {
            ...fsSlot,
            hasConflict: true,
            conflictSlot: googleSlot
          });
        }
      }
    }
  });
  
  console.log(`CONFLICT_RESOLUTION_DEBUG: Found ${conflictCount} conflicts between Google Calendar and future sessions`);
  return calendarData;
};

// Helper function to identify work meetings
const isWorkMeeting = (slot: CalendarSlot): boolean => {
  return !!slot.notes && 
         typeof slot.notes === 'string' && 
         slot.notes.startsWith('פגישה עם') && 
         ((slot.status as string) === 'booked' || slot.isPatientMeeting || (slot.isMeeting && (slot.status as string) === 'booked'));
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
  
  bookedSlots.forEach((session, index) => {
    if (!session.session_date) {
      console.log(`Session ${index} has no date:`, session);
      return;
    }
    
    try {
      console.log(`LOV_DEBUG_PROCESSING: Processing future session ${index}:`, {
        dateString: session.session_date,
        patient: session.patients?.name || 'unknown'
      });

      // Use our new utility to safely get date/time parts
      const { date: sessionDate, hour: sessionHour, minute: sessionMinute, fullTime } = getDateTimeParts(session.session_date);
      
      // Add to map for quick lookups
      const sessionKey = `${sessionDate}-${sessionHour}:00`;
      futureSessionsMap.set(sessionKey, true);
      
      console.log(`DB_BUTTON_DEBUG: Session ${index} mapped with key: ${sessionKey}`, {
        patient: session.patients?.name || 'unknown',
        fullTime,
        minute: sessionMinute
      });
      
      // Get the day map for this date
      const dayMap = calendarData.get(sessionDate);
      if (!dayMap) {
        console.log(`No day map for session date: ${sessionDate}`);
        return;
      }
      
      const sessionTime = `${sessionHour}:00`;
      if (!dayMap.has(sessionTime)) {
        console.log(`No slot for session time: ${sessionTime}`);
        return;
      }
      
      // Always use 90 minutes (1.5 hours) for patient meetings
      const sessionDateTime = new Date(session.session_date);
      const endTime = addMinutesToDate(sessionDateTime, 90);
      const { hour: endHour, minute: endMinute, fullTime: formattedEndTime } = getDateTimeParts(endTime);
      
      // For 90 minutes, span is always 2
      const hoursSpan = Math.ceil(90 / 60);
      
      // Check if this session exists in Google Calendar
      const eventDateHourKey = `${sessionDate}-${sessionTime}`;
      const inGoogleCalendar = googleEventsMap.has(eventDateHourKey);
      
      console.log(`DB_BUTTON_DEBUG: Session ${index} calculation results:`, {
        inGoogleCalendar,
        key: eventDateHourKey,
        startTime: fullTime,
        endTime: formattedEndTime,
        hoursSpan
      });
      
      let status: 'available' | 'booked' | 'completed' | 'canceled' | 'private' | 'unspecified' = 'booked';
      if (session.status === 'Completed') status = 'completed';
      if (session.status === 'Cancelled') status = 'canceled';
      
      const patientName = session.patients?.name || 'לקוח/ה';
      const noteText = `פגישה עם ${patientName}`;
      
      // Process each hour of the event
      for (let h = parseInt(sessionHour); h <= parseInt(endHour); h++) {
        const hourString = h.toString().padStart(2, '0') + ':00';
        
        // Skip the last hour if the event ends exactly at :00
        if (h === parseInt(endHour) && parseInt(endMinute) === 0) {
          continue;
        }
        
        if (dayMap.has(hourString)) {
          const isFirstHour = h === parseInt(sessionHour);
          const isLastHour = h === parseInt(endHour);
          
          let currentStartMinute = 0;
          let currentEndMinute = 59;
          
          if (isFirstHour) {
            currentStartMinute = parseInt(sessionMinute);
          }
          
          if (isLastHour) {
            currentEndMinute = parseInt(endMinute);
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
            exactStartTime: fullTime,
            exactEndTime: formattedEndTime,
            startMinute: currentStartMinute,
            endMinute: currentEndMinute,
            isPartialHour: (isFirstHour && parseInt(sessionMinute) > 0) || (isLastHour && parseInt(endMinute) > 0),
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
            console.log(`COLOR_DEBUG: Set future session at ${sessionDate} ${hourString}`, {
              inGoogleCalendar,
              fromFutureSession: true,
              fromGoogle: existingSlot?.fromGoogle || inGoogleCalendar
            });
          }
          
          // Log for debugging
          if (isFirstHour) {
            console.log(`DB_BUTTON_DEBUG: Set future session slot for ${sessionDate} ${hourString}`, {
              patient: patientName,
              inGoogleCalendar
            });
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
  
  // Detect conflicts between Google Calendar and future sessions
  calendarData = detectMeetingConflicts(calendarData);
  
  return calendarData;
};
