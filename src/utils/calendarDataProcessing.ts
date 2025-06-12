
import { format, isSameDay, addMinutes } from 'date-fns';
import { CalendarSlot, GoogleCalendarEvent } from '@/types/calendar';

// Utility function to generate empty calendar data
export const generateEmptyCalendarData = (currentDate: Date): Map<string, Map<string, CalendarSlot>> => {
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start on Sunday

  const calendarData: Map<string, Map<string, CalendarSlot>> = new Map();

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateString = format(date, 'yyyy-MM-dd');
    calendarData.set(dateString, new Map());

    for (let hour = 8; hour <= 23; hour++) {
      const hourString = `${hour.toString().padStart(2, '0')}:00`;
      calendarData.get(dateString)!.set(hourString, {
        date: dateString,
        day: i,
        hour: hourString,
        status: 'unspecified',
        fromGoogle: false,
        isMeeting: false,
        syncStatus: 'synced',
		    isFirstHour: false,
        isLastHour: false,
        isPartialHour: false,
        isPatientMeeting: false,
        showBorder: false,
        fromFutureSession: false,
        inGoogleCalendar: false
      });
    }
  }

  return calendarData;
};

// Utility function to generate week days
export const generateWeekDays = (currentDate: Date) => {
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start on Sunday

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateString = format(date, 'yyyy-MM-dd');
    const label = format(date, 'EEE');
    days.push({ date: dateString, label: label, dayNumber: i });
  }
  return days;
};

// Utility function to determine the hours an event spans
export const getEventHours = (startTime: Date, endTime: Date) => {
  const startHour = startTime.getHours();
  const endHour = endTime.getHours();
  const totalHours = endHour - startHour;
  const hours = [];

  for (let i = 0; i <= totalHours; i++) {
    const hourTime = new Date(startTime);
    hourTime.setHours(startHour + i, 0, 0, 0);
    const hourString = `${hourTime.getHours().toString().padStart(2, '0')}:00`;

    let exactStartTime = null;
    let exactEndTime = null;
    let startMinute = 0;
    let endMinute = 0;
    let isPartialHour = false;

    if (i === 0) {
      // First hour
      exactStartTime = format(startTime, 'HH:mm');
      startMinute = startTime.getMinutes();
      isPartialHour = startMinute > 0;
    }
    if (i === totalHours) {
      // Last hour
      exactEndTime = format(endTime, 'HH:mm');
      endMinute = endTime.getMinutes();
      isPartialHour = endMinute < 60;
    }

    hours.push({
      hour: hourString,
      startTime: `${hourTime.getHours().toString().padStart(2, '0')}:00`,
      endTime: `${(hourTime.getHours() + 1).toString().padStart(2, '0')}:00`,
      exactStartTime: exactStartTime,
      exactEndTime: exactEndTime,
      startMinute: startMinute,
      endMinute: endMinute,
      isPartialHour: isPartialHour
    });
  }

  return hours;
};

export const processGoogleEvents = (
  calendarData: Map<string, Map<string, CalendarSlot>>,
  googleEvents: GoogleCalendarEvent[],
  days: { date: string; label: string; dayNumber: number }[]
): Map<string, Map<string, CalendarSlot>> => {
  console.log('LOV_DEBUG_PROCESSING: Processing Google Calendar events...');
  
  const daysSet = new Set(days.map(d => d.date));
  
  googleEvents.forEach((event, eventIndex) => {
    try {
      console.log(`LOV_DEBUG_PROCESSING: Processing Google event ${eventIndex}:`, {
        id: event.id,
        summary: event.summary,
        start: event.start?.dateTime,
        end: event.end?.dateTime
      });

      if (!event.start?.dateTime || !event.end?.dateTime) {
        console.log('LOV_DEBUG_PROCESSING: Skipping event - missing start or end time');
        return;
      }

      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end.dateTime);
      const eventDate = format(startTime, 'yyyy-MM-dd');
      
      // Only process events that fall within the current week view
      if (!daysSet.has(eventDate)) {
        console.log(`LOV_DEBUG_PROCESSING: Skipping event - date ${eventDate} not in current view`);
        return;
      }

      console.log(`LOV_DEBUG_PROCESSING: Event ${eventIndex} is in view, processing slots...`);

      // Extract session type from event summary if it contains session type indicators
      let sessionTypeId: number | undefined;
      if (event.summary) {
        if (event.summary.includes('קוד הנפש') || event.summary.includes('פגישה רגילה')) {
          sessionTypeId = 1; // Regular session
        } else if (event.summary.includes('אינטייק') || event.summary.includes('intake')) {
          sessionTypeId = 2; // Intake session
        } else if (event.summary.includes('SEFT') || event.summary.includes('seft')) {
          sessionTypeId = 3; // SEFT session
        }
      }

      // Get all the hours this event spans
      const eventHours = getEventHours(startTime, endTime);
      
      eventHours.forEach((hourInfo, hourIndex) => {
        const dayMap = calendarData.get(eventDate);
        if (!dayMap) {
          console.log(`LOV_DEBUG_PROCESSING: No day map found for ${eventDate}`);
          return;
        }

        const existingSlot = dayMap.get(hourInfo.hour);
        if (!existingSlot) {
          console.log(`LOV_DEBUG_PROCESSING: No existing slot for ${eventDate} ${hourInfo.hour}`);
          return;
        }

        const updatedSlot: CalendarSlot = {
          ...existingSlot,
          status: 'booked',
          description: event.summary || 'Google Calendar Event',
          fromGoogle: true,
          isMeeting: true,
          syncStatus: 'synced',
          googleEvent: {
            ...event,
            sessionTypeId // Add session type to Google event
          },
          startTime: hourInfo.startTime,
          endTime: hourInfo.endTime,
          exactStartTime: hourInfo.exactStartTime,
          exactEndTime: hourInfo.exactEndTime,
          hoursSpan: eventHours.length,
          isFirstHour: hourIndex === 0,
          isLastHour: hourIndex === eventHours.length - 1,
          startMinute: hourInfo.startMinute,
          endMinute: hourInfo.endMinute,
          isPartialHour: hourInfo.isPartialHour,
          isPatientMeeting: false,
          showBorder: true
        };

        dayMap.set(hourInfo.hour, updatedSlot);
        console.log(`LOV_DEBUG_PROCESSING: Updated slot for ${eventDate} ${hourInfo.hour} with Google event`);
      });

    } catch (error) {
      console.error(`LOV_DEBUG_PROCESSING: Error processing Google event ${eventIndex}:`, error);
    }
  });

  console.log('LOV_DEBUG_PROCESSING: Finished processing Google Calendar events');
  return calendarData;
};

export const processFutureSessions = (
  calendarData: Map<string, Map<string, CalendarSlot>>,
  futureSessions: any[],
  googleEventsMap: Map<string, GoogleCalendarEvent>
): Map<string, Map<string, CalendarSlot>> => {
  console.log('LOV_DEBUG_PROCESSING: Processing future sessions...');

  futureSessions.forEach((session, sessionIndex) => {
    try {
      console.log(`LOV_DEBUG_PROCESSING: Processing session ${sessionIndex}:`, {
        id: session.id,
        session_date: session.session_date,
        patient_id: session.patient_id
      });

      if (!session.session_date) {
        console.log('LOV_DEBUG_PROCESSING: Skipping session - missing session_date');
        return;
      }

      const sessionDate = new Date(session.session_date);
      const eventDate = format(sessionDate, 'yyyy-MM-dd');
      const sessionHour = sessionDate.getHours().toString().padStart(2, '0');
      const sessionMinute = sessionDate.getMinutes().toString().padStart(2, '0');
      const startTime = `${sessionHour}:${sessionMinute}`;
      const endTime = format(addMinutes(sessionDate, 90), 'HH:mm'); // Sessions are 90 minutes

      const dayMap = calendarData.get(eventDate);
      if (!dayMap) {
        console.log(`LOV_DEBUG_PROCESSING: No day map found for ${eventDate}`);
        return;
      }

      const existingSlot = dayMap.get(`${sessionHour}:00`);
      if (!existingSlot) {
        console.log(`LOV_DEBUG_PROCESSING: No existing slot for ${eventDate} ${sessionHour}:00`);
        return;
      }

      // Check if this session exists in Google Calendar
      const googleEventId = session.google_event_id;
      const inGoogleCalendar = googleEventId !== null && googleEventsMap.has(googleEventId);

      const updatedSlot: CalendarSlot = {
        ...existingSlot,
        status: 'booked',
        description: 'פגישה',
        fromGoogle: false,
        isMeeting: true,
        syncStatus: 'synced',
        startTime: startTime,
        endTime: endTime,
        exactStartTime: startTime,
        exactEndTime: endTime,
        hoursSpan: 1.5,
        isFirstHour: true,
        isLastHour: true,
        startMinute: parseInt(sessionMinute),
        endMinute: 30,
        isPartialHour: true,
        isPatientMeeting: true,
        showBorder: true,
        fromFutureSession: true,
        futureSession: session,
        inGoogleCalendar: inGoogleCalendar
      };

      dayMap.set(`${sessionHour}:00`, updatedSlot);
      console.log(`LOV_DEBUG_PROCESSING: Updated slot for ${eventDate} ${sessionHour}:00 with future session`);

    } catch (error) {
      console.error(`LOV_DEBUG_PROCESSING: Error processing future session ${sessionIndex}:`, error);
    }
  });

  console.log('LOV_DEBUG_PROCESSING: Finished processing future sessions');
  return calendarData;
};

// Utility function to create a map of Google Calendar events by ID
export const createGoogleEventsMap = (googleEvents: GoogleCalendarEvent[]): Map<string, GoogleCalendarEvent> => {
  const eventsMap = new Map<string, GoogleCalendarEvent>();
  googleEvents.forEach(event => {
    if (event.id) {
      eventsMap.set(event.id, event);
    }
  });
  return eventsMap;
};
