export interface TimeSlot {
  day: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'private' | 'unspecified' | 'booked' | 'completed' | 'canceled';
  notes?: string;
  isRecurring: boolean;
}

export interface CalendarSlot {
  date: string;
  day: number;
  hour: string;
  status: 'available' | 'private' | 'unspecified' | 'booked' | 'completed' | 'canceled';
  notes?: string;
  description?: string; // For Google Calendar event description
  fromGoogle?: boolean; // Flag to indicate if this came from Google Calendar
  syncStatus?: 'synced' | 'google-only' | 'supabase-only';
  googleEvent?: GoogleCalendarEvent; // מאחסן את האירוע המקורי מגוגל
}

export interface ContextMenuOptions {
  x: number;
  y: number;
  date: string;
  day: number;
  hour: string;
  status: string;
}

export interface RecurringRule {
  day: number;
  startTime: string;
  endTime: string;
  pattern: 'weekly' | 'monthly';
  count: number;
  startDate: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  status?: string;
  syncStatus?: 'synced' | 'google-only';
}

// Settings interfaces
export interface CalendarSettings {
  googleCalendarApiKey?: string;
  defaultCalendarId?: string;
}

// Calendar view options
export interface CalendarViewOptions {
  view: 'week' | 'month';
  startDate: Date;
}

// Sync comparison results
export interface CalendarSyncComparison {
  matchingEvents: any[];
  onlyInGoogle: GoogleCalendarEvent[];
  onlyInSupabase: any[];
}
