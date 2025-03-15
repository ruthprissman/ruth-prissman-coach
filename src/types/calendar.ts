
export type TimeSlotStatus = 'available' | 'booked' | 'private' | 'unspecified';

export interface TimeSlot {
  id?: number;
  day: number; // 0-6 (Sunday-Saturday)
  date: string; // ISO string format
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  status: TimeSlotStatus;
  isRecurring: boolean;
  recurringPattern?: string; // e.g., "weekly"
  recurringCount?: number; // How many times it repeats (max 10)
  sourceId?: string; // Google Calendar event ID if applicable
  notes?: string;
}

export interface CalendarSlot {
  date: string;
  day: number;
  hour: string;
  status: TimeSlotStatus;
  eventId?: string;
  notes?: string;
}

export interface ContextMenuOptions {
  x: number;
  y: number;
  date: string;
  day: number;
  hour: string;
  status: TimeSlotStatus;
}

export interface GoogleCalendarEvent {
  id: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  summary: string;
}

export interface RecurringRule {
  day: number;
  startTime: string;
  endTime: string;
  pattern: 'weekly';
  count: number;
  startDate: string;
}
