import { CalendarSlot, GoogleCalendarEvent } from '@/types/calendar';
import { format, parseISO, getDay, getHours, getMinutes, addHours, differenceInMinutes, startOfHour, addMinutes, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { getMeetingIcon } from './meetingIconUtils';

const COMPONENT_VERSION = "1.0.18";
console.log(`LOV_DEBUG_CALENDAR_PROCESSING: Component loaded, version ${COMPONENT_VERSION}`);

/**
 * Generates an array of day objects for the week of the given date.
 */
export function generateWeekDays(currentDate: Date): { date: string; label: string; dayNumber: number }[] {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const end = endOfWeek(currentDate, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end }).map(date => ({
    date: format(date, 'yyyy-MM-dd'),
    label: format(date, 'E', { locale: he }),
    dayNumber: getDay(date)
  }));
}

/**
 * Generates an empty calendar data structure for a given week.
 */
export function generateEmptyCalendarData(currentDate: Date): Map<string, Map<string, CalendarSlot>> {
  const calendarData = new Map<string, Map<string, CalendarSlot>>();
  const days = generateWeekDays(currentDate);
  const hours = Array.from({ length: 16 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

  days.forEach(day => {
    const dayMap = new Map<string, CalendarSlot>();
    hours.forEach(hour => {
      dayMap.set(hour, {
        date: day.date,
        day: day.dayNumber,
        hour: hour,
        status: 'unspecified',
        notes: '',
        fromGoogle: false,
        isMeeting: false,
        syncStatus: 'synced',
        showBorder: false
      });
    });
    calendarData.set(day.date, dayMap);
  });
  return calendarData;
}

/**
 * Creates a map of Google Calendar events for quick lookup.
 */
export function createGoogleEventsMap(googleEvents: GoogleCalendarEvent[]): Map<string, GoogleCalendarEvent> {
  const map = new Map<string, GoogleCalendarEvent>();
  googleEvents.forEach(event => {
    if (event.start?.dateTime) {
      const start = parseISO(event.start.dateTime);
      // Key format: YYYY-MM-DDTHH
      const key = `${format(start, 'yyyy-MM-dd')}T${String(getHours(start)).padStart(2, '0')}`;
      map.set(key, event);
    }
  });
  return map;
}


/**
 * Processes Google Calendar events and converts them to calendar slots
 */
export function processGoogleCalendarEvents(
  googleEvents: GoogleCalendarEvent[],
  calendarData: Map<string, Map<string, CalendarSlot>>
): void {
  console.log(`[ICON_DEBUG_TRACE] processGoogleCalendarEvents: called with ${googleEvents.length} events`);

  googleEvents.forEach((event, index) => {
    try {
      console.log(`LOV_DEBUG_CALENDAR_PROCESSING: Processing event ${index + 1}:`, {
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end
      });

      if (!event.start?.dateTime || !event.end?.dateTime) {
        console.warn(`LOV_DEBUG_CALENDAR_PROCESSING: Event ${event.id} missing dateTime, skipping`);
        return;
      }

      const startDate = parseISO(event.start.dateTime!);
      const endDate = parseISO(event.end.dateTime!);
      const dateStr = format(startDate, 'yyyy-MM-dd');
      const dayOfWeek = getDay(startDate);

      // Calculate the duration and number of hours the event spans
      const durationMinutes = differenceInMinutes(endDate, startDate);
      const startHour = getHours(startDate);
      const startMinute = getMinutes(startDate);
      const endHour = getHours(endDate);
      const endMinute = getMinutes(endDate);

      // Get or create the day map
      if (!calendarData.has(dateStr)) {
        calendarData.set(dateStr, new Map());
      }
      const dayMap = calendarData.get(dateStr)!;

      let currentHour = startHour;
      let isFirstHour = true;

      // --- USE UNIFIED ICON LOGIC ---
      const summary = event.summary || '';
      let sessionIcon = getMeetingIcon(summary);
      // Fallback: לוגיקת אייקון נוספת אם יש צורך
      if (!sessionIcon && summary.includes('intake')) sessionIcon = "📝";
      else if (!sessionIcon && summary.includes('seft')) sessionIcon = "⚡";
      else if (!sessionIcon && summary.includes('פגישה')) sessionIcon = "👤";
      else sessionIcon = '👤'; // ודא שתמיד יהיה משהו

      // DEBUG: Always log icon logic (even if icon is missing)
      console.log(`[ICON_DEBUG] [GOOGLE] summary="${summary}" -> icon="${sessionIcon}" | event=`, event);

      while (currentHour <= endHour) {
        const hourStr = `${String(currentHour).padStart(2, '0')}:00`;
        const isLastHour = currentHour === endHour;
        if (isLastHour && endMinute === 0 && currentHour > startHour) break;

        const slot: CalendarSlot = {
          date: dateStr,
          day: dayOfWeek,
          hour: hourStr,
          status: 'booked',
          notes: event.summary,
          description: event.description || '',
          fromGoogle: true,
          isMeeting: true,
          syncStatus: 'google-only',
          googleEvent: event,
          startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
          endTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
          exactStartTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
          exactEndTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
          hoursSpan: Math.ceil(durationMinutes / 60),
          isFirstHour,
          isLastHour,
          startMinute: isFirstHour ? startMinute : 0,
          endMinute: isLastHour ? endMinute : 60,
          isPartialHour: startMinute !== 0 || endMinute !== 60 || durationMinutes > 60,
          isPatientMeeting: summary.trim().startsWith('פגישה עם'),
          showBorder: true,
          icon: sessionIcon ?? '👤'
        };

        // Always log out for debug
        console.log(`[ICON_DEBUG] [GOOGLE] Creating slot:`, slot);

        dayMap.set(hourStr, slot);

        currentHour++;
        isFirstHour = false;
      }
    } catch (error) {
      console.error(`LOV_DEBUG_CALENDAR_PROCESSING: Error processing event ${event.id}:`, error);
    }
  });

  console.log(`[ICON_DEBUG_TRACE] processGoogleCalendarEvents: finished processing all events`);
}

/**
 * Processes future sessions and converts them to calendar slots
 */
export function processFutureSessions(
  futureSessions: any[],
  calendarData: Map<string, Map<string, CalendarSlot>>,
  googleEvents: GoogleCalendarEvent[]
): void {
  console.log(`[ICON_DEBUG_TRACE] processFutureSessions: called with ${futureSessions.length} future sessions`);

  futureSessions.forEach((session, index) => {
    try {
      console.log(`LOV_DEBUG_CALENDAR_PROCESSING: Processing future session ${index + 1}:`, session);

      if (!session.session_date) {
        console.warn(`LOV_DEBUG_CALENDAR_PROCESSING: Future session ${session.id} missing session_date, skipping`);
        return;
      }

      const sessionDate = new Date(session.session_date);
      const dateStr = format(sessionDate, 'yyyy-MM-dd');
      const dayOfWeek = getDay(sessionDate);

      const matchingGoogleEvent = googleEvents.find(event => {
        if (!event.start?.dateTime) return false;
        const eventStart = parseISO(event.start.dateTime);
        return Math.abs(sessionDate.getTime() - eventStart.getTime()) < 60000; // Within 1 minute
      });

      const inGoogleCalendar = !!matchingGoogleEvent;

      let durationMinutes;
      let endTime;

      if (session.end_time) {
        endTime = new Date(session.end_time);
        durationMinutes = differenceInMinutes(endTime, sessionDate);
      } else {
        durationMinutes = session.session_type?.duration_minutes || 90;
        endTime = addMinutes(sessionDate, durationMinutes);
      }
      
      const startHour = getHours(sessionDate);
      const startMinute = getMinutes(sessionDate);
      const endHour = getHours(endTime);
      const endMinute = getMinutes(endTime);

      let currentHour = startHour;
      let isFirstHour = true;

      const patientName = session.patients?.name || 'לקוח לא ידוע';
      const summaryString = `פגישה עם ${patientName}`;

      // Only set icon according to session_type.code
      let icon: string | undefined = undefined;
      const sessionTypeCode = session.session_type?.code;
      if (sessionTypeCode === 'seft') icon = '⚡';
      else if (sessionTypeCode === 'intake') icon = '📝';
      else if (sessionTypeCode === 'regular') icon = '👤';
      else icon = '👤'; // ודא שתמיד יהיה משהו

      // Debug always
      console.log(`[ICON_DEBUG] [FUTURE] summary="${summaryString}", type="${sessionTypeCode}" -> icon="${icon}" | session=`, session);

      if (!calendarData.has(dateStr)) {
        calendarData.set(dateStr, new Map());
      }
      const dayMap = calendarData.get(dateStr)!;

      while (currentHour <= endHour) {
        const currentHourStr = `${String(currentHour).padStart(2, '0')}:00`;
        const isLastHour = currentHour === endHour;
        if (isLastHour && endMinute === 0 && currentHour > startHour) break;
        const slotStartMinute = isFirstHour ? startMinute : 0;
        const slotEndMinute = isLastHour ? endMinute : 60;
        const existingSlot = dayMap.get(currentHourStr);

        // איחוד חכם: אל תאפס futureSession ואייקון אם יש ב־existingSlot
        const newFutureSessionData: Partial<CalendarSlot> = {
          notes: summaryString,
          description: `פגישה ${session.meeting_type || 'לא צוין'} עם ${patientName}`,
          fromFutureSession: true,
          futureSession: session,
          inGoogleCalendar,
          isMeeting: true,
          syncStatus: inGoogleCalendar ? 'synced' : 'supabase-only',
          startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
          endTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
          exactStartTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
          exactEndTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
          hoursSpan: Math.ceil(durationMinutes / 60),
          isFirstHour,
          isLastHour,
          startMinute: slotStartMinute,
          endMinute: slotEndMinute,
          isPartialHour: startMinute !== 0 || endMinute !== 60 || durationMinutes > 60,
          isPatientMeeting: true,
          showBorder: true,
          icon: icon ?? (existingSlot?.icon) ?? '👤',
        };

        // שמור תמיד futureSession אם קיים ב־existingSlot
        const slotWithMergedSession: CalendarSlot = {
          ...(existingSlot || {
            date: dateStr,
            day: dayOfWeek,
            hour: currentHourStr,
            status: 'booked',
          }),
          ...newFutureSessionData,
          futureSession: existingSlot?.futureSession ?? session,
          icon: newFutureSessionData.icon ?? existingSlot?.icon ?? '👤',
          status: 'booked',
          fromFutureSession: true,
        };

        // לוג
        console.log(`[ICON_DEBUG] [FUTURE] Creating slot:`, slotWithMergedSession);

        dayMap.set(currentHourStr, slotWithMergedSession);

        currentHour++;
        isFirstHour = false;
      }
    } catch (error) {
      console.error(`LOV_DEBUG_CALENDAR_PROCESSING: Error processing future session ${session.id}:`, error);
    }
  });

  // מיפוי סופי - יצירת לוג לסקירה כוללת
  calendarData.forEach((dayMap, date) => {
    dayMap.forEach((slot, hour) => {
      if (slot?.fromFutureSession) {
        console.log(`[ICON_DEBUG_POST] [FUTURE][${date} ${hour}] slot.futureSession:`, slot.futureSession, 'icon:', slot.icon);
      }
    });
  });

  console.log(`[ICON_DEBUG_TRACE] processFutureSessions: finished processing all sessions`);
}

/**
 * Merges calendar slots data ensuring Google events take precedence where appropriate
 */
export function mergeCalendarData(
  calendarSlots: any[],
  googleEvents: GoogleCalendarEvent[],
  futureSessions: any[]
): Map<string, Map<string, CalendarSlot>> {
  console.log(`LOV_DEBUG_CALENDAR_PROCESSING: Merging calendar data - slots: ${calendarSlots.length}, Google events: ${googleEvents.length}, future sessions: ${futureSessions.length}`);
  
  const calendarData = new Map<string, Map<string, CalendarSlot>>();

  // First, process regular calendar slots (available/private time)
  calendarSlots.forEach(slot => {
    const dateStr = slot.date;
    const hourStr = slot.start_time.substring(0, 5) + ':00'; // Convert HH:MM:SS to HH:00
    
    if (!calendarData.has(dateStr)) {
      calendarData.set(dateStr, new Map());
    }
    
    const dayMap = calendarData.get(dateStr)!;
    dayMap.set(hourStr, {
      date: dateStr,
      day: new Date(dateStr).getDay(),
      hour: hourStr,
      status: slot.status,
      notes: '',
      fromGoogle: false,
      isMeeting: false,
      syncStatus: 'synced'
    });
  });

  // Process Google Calendar events (these can span multiple hours)
  processGoogleCalendarEvents(googleEvents, calendarData);

  // Process future sessions (these can also span multiple hours and may override Google events)
  processFutureSessions(futureSessions, calendarData, googleEvents);

  console.log(`LOV_DEBUG_CALENDAR_PROCESSING: Merge complete, calendar data has ${calendarData.size} days`);
  return calendarData;
}
