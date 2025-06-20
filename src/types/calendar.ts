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
  description?: string;
  fromGoogle?: boolean;
  isMeeting?: boolean;
  syncStatus?: 'synced' | 'google-only' | 'supabase-only';
  googleEvent?: GoogleCalendarEvent;
  startTime?: string;    // Format: "HH:mm"
  endTime?: string;      // Format: "HH:mm"
  exactStartTime?: string; // For non-round times, format: "HH:mm"
  exactEndTime?: string;   // For non-round times, format: "HH:mm"
  hoursSpan?: number;    // Number of hours the event spans
  isFirstHour?: boolean; // Is this the first hour of a multi-hour event
  isLastHour?: boolean;  // Is this the last hour of a multi-hour event
  startMinute?: number;  // For partial hour rendering, 0-59
  endMinute?: number;    // For partial hour rendering, 0-59
  isPartialHour?: boolean; // Indicates this slot has a non-round start or end time
  isPatientMeeting?: boolean; // Indicates if this is a patient meeting (always 90 minutes)
  showBorder?: boolean; // Whether to show border around the event
  fromFutureSession?: boolean; // New: Indicates if this event is from future_sessions table
  futureSession?: any; // New: Stores the original future session data for reference
  inGoogleCalendar?: boolean; // New: Indicates if this future session exists in Google Calendar
  icon?: string; // NEW: Icon for meeting type
}

export interface ContextMenuOptions {
  x: number;
  y: number;
  date: string;
  day: number;
  hour: string;
  status: string;
  fromFutureSession?: boolean; // New: Indicates if the context menu is for a future session
  futureSession?: any; // New: Holds the future session data
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
