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
import { Check, Calendar, X, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';

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
  const [currentTimePosition, setCurrentTimePosition] = useState<{ day: string; percentage: number } | null>(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = format(now, 'yyyy-MM-dd');
      
      if (currentHour >= 8 && currentHour < 24) {
        const percentage = ((currentHour - 8) * 60 + currentMinute) / (16 * 60) * 100;
        setCurrentTimePosition({ day: currentDay, percentage });
      } else {
        setCurrentTimePosition(null);
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, []);

  const getStatusStyle = (slot: CalendarSlot) => {
    const { status, fromGoogle, isMeeting, isPatientMeeting } = slot;
    
    if (isPatientMeeting || (isMeeting && status === 'booked')) {
      return { 
        bg: 'bg-[#5C4C8D]', 
        border: '#5C4C8D', 
        text: 'text-[#CFB53B]',
        colorClass: 'border-[#5C4C8D]'
      };
    }

    if (fromGoogle) {
      return { 
        bg: 'bg-[#D3E4FD]', 
        border: '#D3E4FD', 
        text: 'text-gray-700',
        colorClass: 'border-[#D3E4FD]'
      };
    }
    
    switch (status) {
      case 'available':
        return { bg: 'bg-purple-100', border: 'rgb(243 232 255)', text: 'text-purple-800', colorClass: 'border-purple-100' };
      case 'booked':
        return { bg: 'bg-[#5C4C8D]', border: '#5C4C8D', text: 'text-[#CFB53B]', colorClass: 'border-[#5C4C8D]' };
      case 'completed':
        return { bg: 'bg-gray-200', border: 'rgb(229 231 235)', text: 'text-gray-800', colorClass: 'border-gray-200' };
      case 'canceled':
        return { bg: 'bg-red-100', border: 'rgb(254 226 226)', text: 'text-red-800', colorClass: 'border-red-100' };
      case 'private':
        return { bg: 'bg-amber-100', border: 'rgb(254 243 199)', text: 'text-amber-800', colorClass: 'border-amber-100' };
      default:
        return { bg: 'bg-gray-50', border: 'rgb(249 250 251)', text: 'text-gray-800', colorClass: 'border-gray-50' };
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
      endTime: slot?.endTime,
      exactStartTime: slot?.exactStartTime,
      exactEndTime: slot?.exactEndTime,
      startMinute: slot?.startMinute,
      endMinute: slot?.endMinute,
      isPartialHour: slot?.isPartialHour,
      isPatientMeeting: slot?.isPatientMeeting
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

  const renderPartialHourEvent = (slot: CalendarSlot) => {
    if (!slot.isPartialHour) return null;
    
    const startPercent = slot.isFirstHour && slot.startMinute ? (slot.startMinute / 60) * 100 : 0;
    const endPercent = slot.isLastHour && slot.endMinute ? (slot.endMinute / 60) * 100 : 100;
    const heightPercent = endPercent - startPercent;
    
    const { bg, border } = getStatusStyle(slot);
    
    return (
      <div 
        className={`absolute left-0 right-0 ${bg}`} 
        style={{ 
          top: `${startPercent}%`,
          height: `${heightPercent}%`,
          borderTop: slot.isFirstHour ? 'none' : `1px solid ${border}`,
          borderBottom: slot.isLastHour ? 'none' : `1px solid ${border}`
        }}
      >
        {slot.isFirstHour && slot.notes && (
          <div className={`p-1 text-xs ${slot.isPatientMeeting || slot.isMeeting ? 'text-[#CFB53B]' : 'text-gray-700'}`}>
            {slot.notes}
          </div>
        )}
      </div>
    );
  };

  const renderEventContent = (slot: CalendarSlot) => {
    if (!slot.fromGoogle && !slot.notes) return null;

    if (slot.isPartialHour) {
      return renderPartialHourEvent(slot);
    }

    if (!slot.isFirstHour && slot.hoursSpan && slot.hoursSpan > 1) {
      return <div className="w-full h-full bg-inherit" />;
    }

    return (
      <div className={`flex flex-col items-start p-1 overflow-hidden h-full ${slot.isPatientMeeting || slot.isMeeting ? 'text-[#CFB53B]' : 'text-gray-700'}`}>
        {slot.isFirstHour && (
          <>
            <div className="text-xs font-semibold w-full truncate">
              {slot.notes}
            </div>
            {slot.description && (
              <div className="text-xs w-full truncate mt-0.5 opacity-90">
                {slot.description}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const isSameEvent = (currentSlot: CalendarSlot, prevSlot?: CalendarSlot): boolean => {
    if (!prevSlot) return false;
    
    if (currentSlot.fromGoogle && prevSlot.fromGoogle) {
      return currentSlot.googleEvent?.id === prevSlot.googleEvent?.id;
    }
    
    if (currentSlot.isPatientMeeting && prevSlot.isPatientMeeting) {
      return currentSlot.notes === prevSlot.notes;
    }
    
    return false;
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
        <Table className="border border-gray-200 rounded-md">
          <TableHeader className="bg-purple-50 sticky top-0 z-10">
            <TableRow className="border-b border-gray-300">
              <TableHead className="w-20 font-bold text-purple-800 border-l border-gray-200">שעה</TableHead>
              {days.map((day, index) => (
                <TableHead 
                  key={day.date} 
                  className={`font-bold text-purple-800 text-center min-w-[120px] border-l border-gray-200 
                    ${index === days.length - 1 ? '' : 'border-r'} 
                    ${day.date === currentTimePosition?.day ? 'bg-purple-100/50' : ''}`}
                >
                  {day.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="relative">
            {hours.map((hour, hourIndex) => (
              <TableRow key={hour} className="border-b border-gray-200">
                <TableCell className="font-medium bg-purple-50 text-purple-800 border-l border-gray-200">
                  {hour}
                </TableCell>
                {days.map((day, index) => {
                  const dayMap = calendarData.get(day.date);
                  const slot = dayMap?.get(hour);
                  
                  if (!slot) return null;
                  
                  const prevHour = hourIndex > 0 ? hours[hourIndex - 1] : null;
                  const prevHourSlot = prevHour ? dayMap?.get(prevHour) : undefined;
                  const isConnectedToPrevHour = isSameEvent(slot, prevHourSlot);
                  
                  const { bg, border, text, colorClass } = getStatusStyle(slot);

                  const borderStyle = isConnectedToPrevHour 
                    ? { borderTop: `1px solid ${border}` }
                    : {};

                  const cellContent = (
                    <TableCell 
                      className={`${slot.isPartialHour ? 'bg-transparent' : bg} ${colorClass} ${text} transition-colors cursor-pointer hover:opacity-80 relative min-h-[60px] ${index === days.length - 1 ? '' : 'border-r border-gray-200'}`}
                      style={borderStyle}
                      onContextMenu={(e) => handleContextMenu(e, day.date, hour, slot.status)}
                    >
                      {currentTimePosition?.day === day.date && (
                        <div 
                          className="absolute left-0 w-full border-t-2 border-[#1EAEDB] z-10"
                          style={{ 
                            top: `${currentTimePosition.percentage}%`,
                            borderColor: '#1EAEDB'
                          }}
                        />
                      )}
                      {slot.isPartialHour ? (
                        renderPartialHourEvent(slot)
                      ) : slot.fromGoogle || (slot.notes && slot.status === 'booked') ? (
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
                    </TableCell>
                  );
                  
                  return (
                    <ContextMenu key={`${day.date}-${hour}`}>
                      <ContextMenuTrigger asChild>
                        {(slot.description || slot.fromGoogle) ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {cellContent}
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
                                {slot.isPartialHour && (
                                  <p className="text-xs opacity-75">
                                    {slot.isFirstHour ? `התחלה: דקה ${slot.startMinute}` : ''}
                                    {slot.isFirstHour && slot.isLastHour ? ' | ' : ''}
                                    {slot.isLastHour ? `סיום: דקה ${slot.endMinute}` : ''}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          cellContent
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
