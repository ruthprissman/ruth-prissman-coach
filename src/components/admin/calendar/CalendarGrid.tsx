
import React from 'react';
import { CalendarSlot } from '@/types/calendar';
import CalendarGridSlot from './CalendarGridSlot';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  days: { date: string; label: string; dayNumber: number }[];
  hours: string[];
  calendarData: Map<string, Map<string, CalendarSlot>>;
  onUpdateSlot: (date: string, hour: string, status: 'available' | 'private' | 'unspecified') => void;
  isLoading: boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  hours,
  calendarData,
  onUpdateSlot,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-purple-600">טוען נתוני יומן...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        {/* Header */}
        <div className="grid grid-cols-8 gap-0 border-b-2 border-purple-200">
          <div className="p-2 text-sm font-medium text-purple-800 bg-purple-50 border-r border-purple-200">
            שעה
          </div>
          {days.map((day) => (
            <div
              key={day.date}
              className="p-2 text-sm font-medium text-center text-purple-800 bg-purple-50 border-r border-purple-200"
            >
              <div>{day.label}</div>
              <div className="text-xs text-purple-600">{day.date.split('-')[2]}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 gap-0">
            <div className="p-2 text-sm font-medium text-purple-800 bg-purple-50 border-r border-purple-200 border-b border-gray-200">
              {hour}
            </div>
            {days.map((day) => {
              const slot = calendarData.get(day.date)?.get(hour) || {
                date: day.date,
                day: day.dayNumber,
                hour,
                status: 'unspecified' as const,
                fromGoogle: false,
                isMeeting: false,
                syncStatus: 'synced' as const,
                isFirstHour: false,
                isLastHour: false,
                isPartialHour: false,
                isPatientMeeting: false,
                showBorder: false,
                fromFutureSession: false,
                inGoogleCalendar: false
              };

              return (
                <CalendarGridSlot
                  key={`${day.date}-${hour}`}
                  slot={slot}
                  onUpdateSlot={onUpdateSlot}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
