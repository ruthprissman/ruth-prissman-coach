import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { CalendarSlot, ContextMenuOptions } from '@/types/calendar';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Check, Calendar, X, Lock, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [contextMenu, setContextMenu] = useState<ContextMenuOptions | null>(null);
  const [debugMode, setDebugMode] = useState(true);

  useEffect(() => {
    console.log('CalendarGrid rendered with data:', {
      daysCount: days.length,
      hoursCount: hours.length,
      datesWithData: calendarData.size
    });

    let googleEventsFound = 0;
    calendarData.forEach((dayMap, date) => {
      dayMap.forEach((slot, hour) => {
        if (slot.fromGoogle || slot.syncStatus === 'google-only') {
          googleEventsFound++;
          console.log(`Found Google event at ${date} ${hour}:`, {
            summary: slot.notes,
            description: slot.description,
            fromGoogle: slot.fromGoogle,
            syncStatus: slot.syncStatus,
            startTime: slot.startTime,
            endTime: slot.endTime
          });
        }
      });
    });
    console.log(`Total Google events found in calendar data: ${googleEventsFound}`);
  }, [calendarData, days, hours]);

  const getStatusStyle = (slot: CalendarSlot) => {
    const { status, fromGoogle, isMeeting } = slot;

    if (fromGoogle) {
      if (isMeeting) {
        return { bg: 'bg-[#5C4C8D]', border: 'border-[#5C4C8D]', text: 'text-[#CFB53B]' };
      }
      return { bg: 'bg-[#D3E4FD]', border: 'border-[#D3E4FD]', text: 'text-gray-700' };
    }
    
    switch (status) {
      case 'available':
        return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' };
      case 'booked':
        return { bg: 'bg-[#5C4C8D]', border: 'border-[#5C4C8D]', text: 'text-[#CFB53B]' };
      case 'completed':
        return { bg: 'bg-gray-200', border: 'border-gray-300', text: 'text-gray-800' };
      case 'canceled':
        return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' };
      case 'private':
        return { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800' };
    }
  };

  const handleContextMenu = (e: React.MouseEvent, date: string, hour: string, status: any) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      date,
      day: new Date(date).getDay(),
      hour,
      status
    });
  };

  const handleSelectOption = (status: 'available' | 'private' | 'unspecified') => {
    if (contextMenu) {
      onUpdateSlot(contextMenu.date, contextMenu.hour, status);
      setContextMenu(null);
    }
  };

  const logSlotInfo = (date: string, hour: string, slot?: CalendarSlot) => {
    console.log(`CalendarGrid: Slot at ${date} ${hour}:`, {
      slot,
      status: slot?.status,
      syncStatus: slot?.syncStatus,
      fromGoogle: slot?.fromGoogle,
      notes: slot?.notes,
      description: slot?.description,
      isGoogleEvent: slot?.syncStatus === 'google-only' || slot?.fromGoogle,
      googleEvent: slot?.googleEvent,
      startTime: slot?.startTime,
      endTime: slot?.endTime
    });
    return true;
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    console.log(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
    if (!debugMode) {
      calendarData.forEach((dayMap, date) => {
        dayMap.forEach((slot, hour) => {
          if (slot.fromGoogle || slot.syncStatus === 'google-only') {
            logSlotInfo(date, hour, slot);
          }
        });
      });
    }
  };

  const isMeetingEvent = (summary?: string) => {
    if (!summary) return false;
    return summary.startsWith("פגישה עם") || summary.startsWith("שיחה עם");
  };

  const formatEventTime = (startTime?: string, endTime?: string) => {
    if (!startTime) return "";
    if (!endTime) return startTime;
    return `${startTime}-${endTime}`;
  };

  const renderEventContent = (slot: CalendarSlot) => {
    if (!slot.fromGoogle && !slot.notes) return null;

    const timeDisplay = `${slot.exactStartTime || slot.startTime}-${slot.exactEndTime || slot.endTime}`;
    const showFullContent = slot.isFirstHour;

    if (!showFullContent && slot.hoursSpan > 1) {
      return <div className="w-full h-full bg-inherit" />;
    }

    return (
      <div className={`flex flex-col items-start p-1 overflow-hidden h-full ${slot.isMeeting ? 'text-[#CFB53B]' : 'text-gray-700'}`}>
        {showFullContent && (
          <>
            <div className="text-xs font-semibold w-full truncate">
              {slot.notes}
            </div>
            {slot.description && (
              <div className="text-xs w-full truncate mt-0.5 opacity-90">
                {slot.description}
              </div>
            )}
            <div className="text-xs mt-auto opacity-75">
              {timeDisplay}
            </div>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="mb-2 flex justify-end">
          <button 
            onClick={toggleDebugMode}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 bg-gray-100 rounded"
          >
            {debugMode ? 'הסתר מידע דיבאג' : 'הצג מידע דיבאג'}
          </button>
        </div>
        <Table className="border rounded-md">
          <TableHeader className="bg-purple-50">
            <TableRow>
              <TableHead className="w-20 font-bold text-purple-800">שעה</TableHead>
              {days.map((day) => (
                <TableHead 
                  key={day.date} 
                  className="font-bold text-purple-800 text-center min-w-[120px]"
                >
                  {day.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {hours.map((hour) => (
              <TableRow key={hour} className="border-b">
                <TableCell className="font-medium bg-purple-50 text-purple-800">
                  {hour}
                </TableCell>
                {days.map((day) => {
                  const dayMap = calendarData.get(day.date);
                  const slot = dayMap?.get(hour);
                  
                  if (debugMode) {
                    logSlotInfo(day.date, hour, slot);
                  }
                  
                  if (!slot) return null;
                  
                  const { bg, border, text } = getStatusStyle(slot);
                  
                  const slotContent = (
                    <TableCell 
                      className={`${bg} ${border} ${text} border transition-colors cursor-pointer hover:opacity-80 relative min-h-[60px]`}
                      onContextMenu={(e) => handleContextMenu(e, day.date, hour, slot.status)}
                    >
                      {slot.fromGoogle || (slot.notes && slot.status === 'booked') ? (
                        renderEventContent(slot)
                      ) : (
                        <>
                          {slot.status === 'available' && <Check className="h-4 w-4 mx-auto text-purple-600" />}
                          {slot.status === 'booked' && <Calendar className="h-4 w-4 mx-auto text-[#CFB53B]" />}
                          {slot.status === 'completed' && <Calendar className="h-4 w-4 mx-auto text-gray-600" />}
                          {slot.status === 'canceled' && <Calendar className="h-4 w-4 mx-auto text-red-600" />}
                          {slot.status === 'private' && <Lock className="h-4 w-4 mx-auto text-amber-600" />}
                        </>
                      )}
                      
                      {(slot.syncStatus === 'google-only' || slot.syncStatus === 'supabase-only') && (
                        <AlertTriangle className="h-4 w-4 absolute top-1 right-1 text-orange-600" />
                      )}
                    </TableCell>
                  );
                  
                  return (
                    <ContextMenu key={`${day.date}-${hour}`}>
                      <ContextMenuTrigger asChild>
                        {(slot.description || slot.fromGoogle) ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {slotContent}
                            </TooltipTrigger>
                            <TooltipContent 
                              side="bottom"
                              className="max-w-xs bg-gray-900 text-white p-2 text-xs rounded"
                            >
                              <div>
                                <p className="font-bold">{slot.notes}</p>
                                {slot.description && <p>{slot.description}</p>}
                                {slot.exactStartTime && (
                                  <p className="mt-1">{slot.exactStartTime}-{slot.exactEndTime}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          slotContent
                        )}
                      </ContextMenuTrigger>
                      <ContextMenuContent className="min-w-[160px]">
                        <ContextMenuItem 
                          className="flex items-center gap-2 text-purple-600"
                          onClick={() => handleSelectOption('available')}
                          disabled={slot.status === 'booked' || slot.fromGoogle}
                        >
                          <Check className="h-4 w-4" />
                          <span>הגדר כזמין</span>
                        </ContextMenuItem>
                        <ContextMenuItem 
                          className="flex items-center gap-2 text-amber-600"
                          onClick={() => handleSelectOption('private')}
                          disabled={slot.status === 'booked' || slot.fromGoogle}
                        >
                          <Lock className="h-4 w-4" />
                          <span>הגדר כזמן פרטי</span>
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          className="flex items-center gap-2 text-gray-600"
                          onClick={() => handleSelectOption('unspecified')}
                          disabled={slot.status === 'booked' || slot.fromGoogle}
                        >
                          <X className="h-4 w-4" />
                          <span>נקה סטטוס</span>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default CalendarGrid;
