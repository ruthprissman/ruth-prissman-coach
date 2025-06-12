
import React from 'react';
import { CalendarSlot } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { getSessionTypeIcon, getSessionTypeIconColor } from '@/utils/sessionTypeIcons';
import { useSessionTypes } from '@/hooks/useSessionTypes';

interface CalendarGridSlotProps {
  slot: CalendarSlot;
  onUpdateSlot: (date: string, hour: string, status: 'available' | 'private' | 'unspecified') => void;
}

const CalendarGridSlot: React.FC<CalendarGridSlotProps> = ({ slot, onUpdateSlot }) => {
  const { data: sessionTypes } = useSessionTypes();

  const handleClick = () => {
    if (slot.status === 'available') {
      onUpdateSlot(slot.date, slot.hour, 'private');
    } else if (slot.status === 'private') {
      onUpdateSlot(slot.date, slot.hour, 'unspecified');
    } else {
      onUpdateSlot(slot.date, slot.hour, 'available');
    }
  };

  const getSlotColor = () => {
    switch (slot.status) {
      case 'available':
        return 'bg-purple-100 hover:bg-purple-200';
      case 'private':
        return 'bg-amber-100 hover:bg-amber-200';
      case 'booked':
        return slot.fromGoogle 
          ? 'bg-[#D3E4FD] hover:bg-blue-200' 
          : slot.fromFutureSession 
            ? slot.inGoogleCalendar 
              ? 'bg-[#5C4C8D] hover:bg-[#4A3A7A]' 
              : 'bg-[#9b87f5] hover:bg-[#8B77E5]'
            : 'bg-[#5C4C8D] hover:bg-[#4A3A7A]';
      case 'completed':
        return 'bg-green-100 hover:bg-green-200';
      case 'canceled':
        return 'bg-red-100 hover:bg-red-200';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  const getTextColor = () => {
    if (slot.status === 'booked' && !slot.fromGoogle) {
      return 'text-white';
    }
    return 'text-gray-800';
  };

  // Get session type icon for future sessions or Google events
  const sessionTypeId = slot.futureSession?.session_type_id || slot.googleEvent?.sessionTypeId;
  const sessionTypeIcon = getSessionTypeIcon(sessionTypeId, sessionTypes);
  const iconColorClass = getSessionTypeIconColor(sessionTypeId, sessionTypes);

  return (
    <div
      className={cn(
        'h-12 border border-gray-200 cursor-pointer text-xs p-1 relative transition-colors',
        getSlotColor(),
        getTextColor()
      )}
      onClick={handleClick}
      title={slot.notes || slot.description || ''}
    >
      {/* Session type icon */}
      {sessionTypeIcon && (
        <div className={cn(
          'absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold leading-none',
          iconColorClass
        )}>
          {sessionTypeIcon}
        </div>
      )}
      
      {/* Slot content */}
      <div className="truncate">
        {slot.notes || (slot.status === 'booked' && (slot.description || 'פגישה'))}
      </div>
      
      {/* Time indicators for partial hours */}
      {slot.isPartialHour && (
        <div className="text-xs opacity-75">
          {slot.exactStartTime} - {slot.exactEndTime}
        </div>
      )}
    </div>
  );
};

export default CalendarGridSlot;
