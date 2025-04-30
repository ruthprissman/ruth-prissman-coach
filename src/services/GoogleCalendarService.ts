import { GoogleCalendarEvent } from '@/types/calendar';
import { addMonths, format, startOfWeek } from 'date-fns';

// This service is now optional as we're using OAuth2 for Google Calendar integration
// It remains for API key-based authentication if needed

export interface GoogleCalendarSyncResult {
  events: GoogleCalendarEvent[];
  logs: string[];
  success: boolean;
}

export async function fetchGoogleCalendarEvents(
  apiKey: string,
  calendarId: string
): Promise<GoogleCalendarSyncResult> {
  const logs: string[] = [];
  try {
    logs.push(`${new Date().toISOString()} - תחילת סנכרון יומן Google`);
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const twoMonthsLater = addMonths(weekStart, 2);
    
    const timeMin = weekStart.toISOString();
    const timeMax = twoMonthsLater.toISOString();
    
    const encodedCalendarId = encodeURIComponent(calendarId);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&key=${apiKey}`;
    
    logs.push(`${new Date().toISOString()} - בקשת API נשלחה: ${url}`);
    
    const response = await fetch(url);
    logs.push(`${new Date().toISOString()} - סטטוס תגובה: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`API שגיאה: ${response.status}`);
    }
    
    const data = await response.json();
    logs.push(`${new Date().toISOString()} - התקבלו ${data.items?.length || 0} אירועים מיומן Google`);
    
    const events: GoogleCalendarEvent[] = data.items?.map((item: any) => ({
      id: item.id,
      summary: item.summary || 'אירוע ללא כותרת',
      description: item.description || '',
      start: item.start,
      end: item.end,
      status: item.status || 'confirmed',
      syncStatus: 'google-only'
    })) || [];
    
    logs.push(`${new Date().toISOString()} - עיבוד אירועים הסתיים בהצלחה`);
    
    return {
      events,
      logs,
      success: true
    };
  } catch (error: any) {
    console.error('Error fetching Google Calendar events:', error);
    logs.push(`${new Date().toISOString()} - שגיאה: ${error.message}`);
    
    return {
      events: [],
      logs,
      success: false
    };
  }
}

export function compareCalendarData(
  googleEvents: GoogleCalendarEvent[],
  supabaseSlots: any[]
): {
  matchingEvents: any[];
  onlyInGoogle: GoogleCalendarEvent[];
  onlyInSupabase: any[];
} {
  // Convert Google events to a format we can compare
  const googleEventsMap = new Map<string, GoogleCalendarEvent>();
  
  googleEvents.forEach((event) => {
    if (event.start?.dateTime) {
      const startDate = new Date(event.start.dateTime);
      const key = `${format(startDate, 'yyyy-MM-dd')}_${format(startDate, 'HH:mm')}`;
      googleEventsMap.set(key, event);
    }
  });
  
  // Convert Supabase slots to a format we can compare
  const supabaseSlotsMap = new Map<string, any>();
  
  supabaseSlots.forEach((slot) => {
    if (slot.date && slot.start_time) {
      const key = `${slot.date}_${slot.start_time}`;
      supabaseSlotsMap.set(key, slot);
    }
  });
  
  // Find matching, only in Google, and only in Supabase
  const matchingEvents: any[] = [];
  const onlyInGoogle: GoogleCalendarEvent[] = [];
  const onlyInSupabase: any[] = [];
  
  // Check Google events
  googleEventsMap.forEach((event, key) => {
    if (supabaseSlotsMap.has(key)) {
      matchingEvents.push({
        googleEvent: event,
        supabaseSlot: supabaseSlotsMap.get(key)
      });
    } else {
      onlyInGoogle.push(event);
    }
  });
  
  // Check Supabase slots
  supabaseSlotsMap.forEach((slot, key) => {
    if (!googleEventsMap.has(key)) {
      onlyInSupabase.push(slot);
    }
  });
  
  return {
    matchingEvents,
    onlyInGoogle,
    onlyInSupabase
  };
}
