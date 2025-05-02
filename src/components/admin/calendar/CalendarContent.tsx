
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarSlot } from '@/types/calendar';
import CalendarGrid from './CalendarGrid';
import { DatePicker } from '../DatePicker';

// Component version for debugging
const COMPONENT_VERSION = "1.0.1";
console.log(`LOV_DEBUG_CALENDAR_CONTENT: Component loaded, version ${COMPONENT_VERSION}`);

interface CalendarContentProps {
  days: { date: string; label: string; dayNumber: number }[];
  hours: string[];
  currentDate: Date;
  calendarData: Map<string, Map<string, CalendarSlot>>;
  isLoading: boolean;
  onNavigateWeek: (direction: 'next' | 'prev') => void;
  onUpdateSlot: (date: string, hour: string, status: 'available' | 'private' | 'unspecified') => void;
  onSetCurrentDate: (date: Date) => void;
  onRecurringDialogOpen: () => void;
  onResolutionComplete: () => void;
  createGoogleCalendarEvent: (summary: string, startDateTime: string, endDateTime: string, description: string) => Promise<boolean>;
  deleteGoogleCalendarEvent: (eventId: string) => Promise<boolean>;
  updateGoogleCalendarEvent: (eventId: string, summary: string, startDateTime: string, endDateTime: string, description: string) => Promise<boolean>;
}

const CalendarContent: React.FC<CalendarContentProps> = ({ 
  days, 
  hours, 
  currentDate, 
  calendarData,
  isLoading,
  onNavigateWeek,
  onUpdateSlot,
  onSetCurrentDate,
  onRecurringDialogOpen,
  onResolutionComplete,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button onClick={() => onNavigateWeek('prev')} variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
            <span className="ml-2">שבוע קודם</span>
          </Button>
          
          <Button onClick={() => onNavigateWeek('next')} variant="outline" size="sm">
            <span className="mr-2">שבוע הבא</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <DatePicker
            currentDate={currentDate}
            onSelect={onSetCurrentDate}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={onRecurringDialogOpen} variant="default" size="sm">
            <Calendar className="h-4 w-4 ml-2" />
            הוסף זמינות חוזרת
          </Button>
        </div>
      </div>
      
      <CalendarGrid 
        days={days}
        hours={hours}
        calendarData={calendarData}
        onUpdateSlot={onUpdateSlot}
        isLoading={isLoading}
        onResolutionComplete={onResolutionComplete}
        createGoogleCalendarEvent={createGoogleCalendarEvent}
        deleteGoogleCalendarEvent={deleteGoogleCalendarEvent}
        updateGoogleCalendarEvent={updateGoogleCalendarEvent}
      />
    </div>
  );
};

export default CalendarContent;
