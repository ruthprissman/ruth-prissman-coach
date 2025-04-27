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
            syncStatus: slot.syncStatus
          });
        }
      });
    });
    console.log(`Total Google events found in calendar data: ${googleEventsFound}`);
  }, [calendarData, days, hours]);

  const getStatusStyle = (status: string, syncStatus?: string, isGoogleEvent?: boolean, isMeeting?: boolean) => {
    if (isGoogleEvent) {
      if (isMeeting) {
        return { bg: 'bg-[#9b87f5]', border: 'border-[#9b87f5]', text: 'text-white' };
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
      googleEvent: slot?.googleEvent
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

  const formatEventTime = (hour: string, date: string) => {
    const [hourPart] = hour.split(':');
    const nextHour = `${(parseInt(hourPart) + 1).toString().padStart(2, '0')}:00`;
    return `${hour}-${nextHour}`;
  };

  const isMeetingEvent = (summary?: string) => {
    if (!summary) return false;
    return summary.startsWith("פגישה עם") || summary.startsWith("שיחה עם");
  };

  const renderEventContent = (slot: CalendarSlot) => {
    if (!slot.fromGoogle) return null;

    const isMeeting = isMeetingEvent(slot.notes);
    const timeDisplay = formatEventTime(slot.hour, slot.date);

    return (
      <div className={`flex flex-col items-start p-1 overflow-hidden h-full ${isMeeting ? 'text-white' : 'text-gray-700'}`}>
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
                  
                  const status = slot?.status || 'unspecified';
                  const syncStatus = slot?.syncStatus;
                  const isGoogleEvent = syncStatus === 'google-only' || slot?.fromGoogle;
                  const isMeeting = slot?.fromGoogle && isMeetingEvent(slot?.notes);
                  
                  const { bg, border, text } = getStatusStyle(status, syncStatus, isGoogleEvent, isMeeting);
                  
                  const slotContent = (
                    <TableCell 
                      className={`${bg} ${border} ${text} border transition-colors cursor-pointer hover:opacity-80 relative min-h-[60px]`}
                      onContextMenu={(e) => handleContextMenu(e, day.date, hour, status)}
                    >
                      {isGoogleEvent ? (
                        renderEventContent(slot!)
                      ) : (
                        <>
                          {status === 'available' && <Check className="h-4 w-4 mx-auto text-purple-600" />}
                          {status === 'booked' && <Calendar className="h-4 w-4 mx-auto text-[#CFB53B]" />}
                          {status === 'completed' && <Calendar className="h-4 w-4 mx-auto text-gray-600" />}
                          {status === 'canceled' && <Calendar className="h-4 w-4 mx-auto text-red-600" />}
                          {status === 'private' && <Lock className="h-4 w-4 mx-auto text-amber-600" />}
                        </>
                      )}
                      
                      {(syncStatus === 'google-only' || syncStatus === 'supabase-only') && (
                        <AlertTriangle className="h-4 w-4 absolute top-1 right-1 text-orange-600" />
                      )}
                    </TableCell>
                  );
                  
                  return (
                    <ContextMenu key={`${day.date}-${hour}`}>
                      <ContextMenuTrigger asChild>
                        {(slot?.description || isGoogleEvent) ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {slotContent}
                            </TooltipTrigger>
                            <TooltipContent 
                              side="bottom"
                              className="max-w-xs bg-gray-900 text-white p-2 text-xs rounded"
                            >
                              {isGoogleEvent ? (
                                <div>
                                  <p className="font-bold">{slot?.notes}</p>
                                  {slot?.description && <p>{slot.description}</p>}
                                </div>
                              ) : (
                                slot?.description
                              )}
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
                          disabled={status === 'booked' || isGoogleEvent}
                        >
                          <Check className="h-4 w-4" />
                          <span>הגדר כזמין</span>
                        </ContextMenuItem>
                        <ContextMenuItem 
                          className="flex items-center gap-2 text-amber-600"
                          onClick={() => handleSelectOption('private')}
                          disabled={status === 'booked' || isGoogleEvent}
                        >
                          <Lock className="h-4 w-4" />
                          <span>הגדר כזמן פרטי</span>
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          className="flex items-center gap-2 text-gray-600"
                          onClick={() => handleSelectOption('unspecified')}
                          disabled={status === 'booked' || isGoogleEvent}
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
