
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { CalendarSlot, GoogleCalendarEvent } from '@/types/calendar';

// Version identifier for debugging
const PROCESSING_VERSION = "1.0.3";

console.log(`CALENDAR_PROCESSING: Module loaded, version ${PROCESSING_VERSION}`);

export function generateEmptyCalendarData(currentDate: Date): Map<string, Map<string, CalendarSlot>> {
  const calendarData = new Map<string, Map<string, CalendarSlot>>();
  const days = generateWeekDays(currentDate);
  
  console.log(`CALENDAR_PROCESSING: Generating empty calendar data for ${days.length} days`);
  
  days.forEach(day => {
    const dayMap = new Map<string, CalendarSlot>();
    
    // Generate hourly slots from 8:00 to 23:00
    for (let hour = 8; hour < 24; hour++) {
      const hourStr = `${String(hour).padStart(2, '0')}:00`;
      dayMap.set(hourStr, {
        date: day.date,
        day: day.dayNumber,
        hour: hourStr,
        status: 'unspecified',
        syncStatus: 'synced',
        showBorder: false
      });
    }
    
    calendarData.set(day.date, dayMap);
  });
  
  console.log(`CALENDAR_PROCESSING: Generated empty calendar with ${calendarData.size} days`);
  return calendarData;
}

export function generateWeekDays(currentDate: Date) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start week on Sunday
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    days.push({
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE dd/MM'),
      dayNumber: date.getDay()
    });
  }
  
  console.log(`CALENDAR_PROCESSING: Generated week days:`, days);
  return days;
}

export function createGoogleEventsMap(googleEvents: GoogleCalendarEvent[]): Map<string, GoogleCalendarEvent> {
  const eventsMap = new Map<string, GoogleCalendarEvent>();
  
  googleEvents.forEach(event => {
    if (event.start?.dateTime) {
      const startDate = new Date(event.start.dateTime);
      const dateStr = format(startDate, 'yyyy-MM-dd');
      const hourStr = `${String(startDate.getHours()).padStart(2, '0')}:00`;
      const key = `${dateStr}_${hourStr}`;
      eventsMap.set(key, event);
      
      console.log(`GOOGLE_EVENTS_MAP: Added event "${event.summary}" at key ${key}`);
    }
  });
  
  console.log(`GOOGLE_EVENTS_MAP: Created map with ${eventsMap.size} events`);
  return eventsMap;
}

export function processGoogleEvents(
  calendarData: Map<string, Map<string, CalendarSlot>>,
  googleEvents: GoogleCalendarEvent[],
  days: { date: string; label: string; dayNumber: number }[]
): Map<string, Map<string, CalendarSlot>> {
  
  console.log(`GOOGLE_EVENTS_PROCESSING: Processing ${googleEvents.length} Google Calendar events`);
  
  googleEvents.forEach((event, eventIndex) => {
    console.log(`GOOGLE_EVENTS_PROCESSING: Processing event ${eventIndex}: "${event.summary}"`);
    
    if (!event.start?.dateTime || !event.end?.dateTime) {
      console.log(`GOOGLE_EVENTS_PROCESSING: Skipping event ${eventIndex} - missing start/end time`);
      return;
    }

    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    
    const startDate = format(startTime, 'yyyy-MM-dd');
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    console.log(`GOOGLE_EVENTS_PROCESSING: Event "${event.summary}" from ${startDate} ${startHour}:${startMinute} to ${endHour}:${endMinute}`);
    
    // Check if this date is in our current week view
    const dayExists = days.some(day => day.date === startDate);
    if (!dayExists) {
      console.log(`GOOGLE_EVENTS_PROCESSING: Skipping event ${eventIndex} - date ${startDate} not in current week view`);
      return;
    }

    const dayMap = calendarData.get(startDate);
    if (!dayMap) {
      console.log(`GOOGLE_EVENTS_PROCESSING: No day map found for ${startDate}`);
      return;
    }

    // Calculate duration in hours
    const durationHours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    console.log(`GOOGLE_EVENTS_PROCESSING: Event duration: ${durationHours} hours`);

    // Handle multi-hour events
    for (let hourOffset = 0; hourOffset < durationHours; hourOffset++) {
      const currentHour = startHour + hourOffset;
      if (currentHour >= 24) break; // Don't go past midnight
      
      const hourStr = `${String(currentHour).padStart(2, '0')}:00`;
      
      if (dayMap.has(hourStr)) {
        const isFirstHour = hourOffset === 0;
        const isLastHour = hourOffset === durationHours - 1;
        
        const eventStartMinute = isFirstHour ? startMinute : 0;
        const eventEndMinute = isLastHour ? endMinute : 60;
        
        const slot: CalendarSlot = {
          date: startDate,
          day: startTime.getDay(),
          hour: hourStr,
          status: 'booked',
          notes: event.summary,
          description: event.description,
          fromGoogle: true,
          isMeeting: true,
          syncStatus: 'google-only',
          googleEvent: event,
          startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
          endTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
          exactStartTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
          exactEndTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
          hoursSpan: durationHours,
          isFirstHour,
          isLastHour,
          startMinute: eventStartMinute,
          endMinute: eventEndMinute,
          isPartialHour: startMinute !== 0 || endMinute !== 0,
          showBorder: true
        };
        
        dayMap.set(hourStr, slot);
        console.log(`GOOGLE_EVENTS_PROCESSING: Set Google event at ${startDate} ${hourStr} (hour ${hourOffset + 1}/${durationHours})`);
      }
    }
  });
  
  console.log(`GOOGLE_EVENTS_PROCESSING: Finished processing Google events`);
  return calendarData;
}

export function processFutureSessions(
  calendarData: Map<string, Map<string, CalendarSlot>>,
  bookedSlots: any[],
  googleEventsMap: Map<string, GoogleCalendarEvent>
): Map<string, Map<string, CalendarSlot>> {
  
  console.log(`FUTURE_SESSIONS_PROCESSING: Processing ${bookedSlots.length} future sessions`);
  console.log(`FUTURE_SESSIONS_PROCESSING: Google events map has ${googleEventsMap.size} entries`);
  
  bookedSlots.forEach((session, sessionIndex) => {
    console.log(`FUTURE_SESSIONS_PROCESSING: Processing session ${sessionIndex}:`, {
      id: session.id,
      patient_id: session.patient_id,
      session_date: session.session_date,
      patient_name: session.patients?.name,
      meeting_type: session.meeting_type
    });
    
    if (!session.session_date) {
      console.log(`FUTURE_SESSIONS_PROCESSING: Skipping session ${sessionIndex} - no session_date`);
      return;
    }

    const sessionDateTime = parseISO(session.session_date);
    const sessionDate = format(sessionDateTime, 'yyyy-MM-dd');
    const sessionHour = sessionDateTime.getHours();
    const sessionHourStr = `${String(sessionHour).padStart(2, '0')}:00`;
    
    console.log(`FUTURE_SESSIONS_PROCESSING: Session ${sessionIndex} scheduled for ${sessionDate} at ${sessionHourStr}`);
    
    const dayMap = calendarData.get(sessionDate);
    if (!dayMap) {
      console.log(`FUTURE_SESSIONS_PROCESSING: No day map found for ${sessionDate}`);
      return;
    }

    if (!dayMap.has(sessionHourStr)) {
      console.log(`FUTURE_SESSIONS_PROCESSING: No hour slot found for ${sessionHourStr}`);
      return;
    }

    // Check if this session has a matching Google Calendar event
    const googleEventKey = `${sessionDate}_${sessionHourStr}`;
    const matchingGoogleEvent = googleEventsMap.get(googleEventKey);
    const inGoogleCalendar = !!matchingGoogleEvent;
    
    console.log(`FUTURE_SESSIONS_PROCESSING: Session ${sessionIndex} Google Calendar check:`, {
      googleEventKey,
      hasMatchingEvent: inGoogleCalendar,
      matchingEventSummary: matchingGoogleEvent?.summary
    });

    // Get existing slot (might be from Google Calendar)
    const existingSlot = dayMap.get(sessionHourStr)!;
    
    // Create meeting notes
    const patientName = session.patients?.name || 'לקוח לא ידוע';
    const meetingNotes = `פגישה עם ${patientName}`;
    
    // CRITICAL: Always mark as fromFutureSession for sessions from the database
    const updatedSlot: CalendarSlot = {
      ...existingSlot,
      status: 'booked',
      notes: meetingNotes,
      isMeeting: true,
      isPatientMeeting: true,
      fromFutureSession: true, // CRITICAL: This must always be true for database sessions
      futureSession: session,
      inGoogleCalendar,
      // If there's a Google event, preserve its data but mark it as synced
      ...(matchingGoogleEvent && {
        fromGoogle: true,
        googleEvent: matchingGoogleEvent,
        syncStatus: 'synced',
        description: matchingGoogleEvent.description
      })
    };
    
    dayMap.set(sessionHourStr, updatedSlot);
    
    console.log(`FUTURE_SESSIONS_PROCESSING: Set future session at ${sessionDate} ${sessionHourStr}:`, {
      notes: updatedSlot.notes,
      fromFutureSession: updatedSlot.fromFutureSession,
      inGoogleCalendar: updatedSlot.inGoogleCalendar,
      fromGoogle: updatedSlot.fromGoogle,
      syncStatus: updatedSlot.syncStatus,
      patientName
    });
  });
  
  console.log(`FUTURE_SESSIONS_PROCESSING: Finished processing future sessions`);
  return calendarData;
}
