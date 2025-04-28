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
import { Check, Calendar, X, Lock, Clock, CalendarPlus, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, isToday, isSameDay } from 'date-fns';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { toast } from '@/components/ui/use-toast';

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
  const [currentTime, setCurrentTime] = useState<{
    date: string;
    hour: string;
    minute: number;
  } | null>(null);
  const { createEvent } = useGoogleOAuth();

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour >= 8 && currentHour < 24) {
        const formattedDate = format(now, 'yyyy-MM-dd');
        const formattedHour = `${String(currentHour).padStart(2, '0')}:00`;
        
        setCurrentTime({
          date: formattedDate,
          hour: formattedHour,
          minute: currentMinute
        });
      } else {
        setCurrentTime(null);
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, []);

  const getStatusStyle = (slot: CalendarSlot) => {
    const { status, fromGoogle, isMeeting, isPatientMeeting, fromFutureSession, inGoogleCalendar } = slot;
    
    if (fromFutureSession) {
      if (inGoogleCalendar) {
        return { 
          bg: 'bg-[#D3E4FD]', 
          text: 'text-gray-700',
          colorClass: ''
        };
      }
      
      return { 
        bg: 'bg-[#9b87f5]', 
        text: 'text-white font-medium',
        colorClass: ''
      };
    }
    
    if (isPatientMeeting || (isMeeting && status === 'booked')) {
      return { 
        bg: 'bg-[#5C4C8D]', 
        text: 'text-[#CFB53B] font-medium',
        colorClass: ''
      };
    }

    if (fromGoogle) {
      return { 
        bg: 'bg-[#D3E4FD]', 
        text: 'text-gray-700',
        colorClass: ''
      };
    }
    
    switch (status) {
      case 'available':
        return { bg: 'bg-purple-100', text: 'text-purple-800', colorClass: '' };
      case 'booked':
        return { bg: 'bg-[#5C4C8D]', text: 'text-[#CFB53B]', colorClass: '' };
      case 'completed':
        return { bg: 'bg-gray-200', text: 'text-gray-800', colorClass: '' };
      case 'canceled':
        return { bg: 'bg-red-100', text: 'text-red-800', colorClass: '' };
      case 'private':
        return { bg: 'bg-amber-100', text: 'text-amber-800', colorClass: '' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-800', colorClass: '' };
    }
  };

  const handleContextMenu = (e: React.MouseEvent, date: string, hour: string, status: any, fromFutureSession?: boolean, futureSession?: any) => {
    console.log('Context menu event triggered:', {
      type: e.type,
      button: e.button,
      clientX: e.clientX,
      clientY: e.clientY,
      date,
      hour,
      status
    });

    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      date,
      day: new Date(date).getDay(),
      hour,
      status,
      fromFutureSession,
      futureSession
    });
  };

  const handleSelectOption = (status: 'available' | 'private' | 'unspecified') => {
    if (contextMenu) {
      onUpdateSlot(contextMenu.date, contextMenu.hour, status);
      setContextMenu(null);
    }
  };

  const handleCopyToGoogleCalendar = async () => {
    if (!contextMenu?.fromFutureSession || !contextMenu?.futureSession) {
      setContextMenu(null);
      return;
    }

    try {
      const session = contextMenu.futureSession;
      
      const sessionDateTime = new Date(session.session_date);
      const summary = `פגישה עם ${session.patients?.name || 'לקוח/ה'}`; 
      
      const startDateTime = sessionDateTime.toISOString();
      
      const endDateTime = new Date(sessionDateTime.getTime() + 90 * 60000).toISOString();
      
      const description = `סוג פגישה: ${session.meeting_type}${session.zoom_link ? `\nקישור לזום: ${session.zoom_link}` : ''}`;
      
      const success = await createEvent(
        summary,
        startDateTime,
        endDateTime,
        description
      );
      
      if (success) {
        toast({
          title: "הפגישה נוספה ליומן Google",
          description: `הפגישה עם ${session.patients?.name || 'לקוח/ה'} נוספה בהצלחה ליומן Google`,
        });
      }
    } catch (error: any) {
      console.error("Failed to add event to Google Calendar:", error);
      toast({
        title: "שגיאה בהוספת פגישה ליומן",
        description: error.message || "לא הצלחנו להוסיף את הפגישה ליומן Google",
        variant: "destructive"
      });
    }
    
    setContextMenu(null);
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
      isPatientMeeting: slot?.isPatientMeeting,
      fromFutureSession: slot?.fromFutureSession,
      inGoogleCalendar: slot?.inGoogleCalendar,
      futureSession: slot?.futureSession
    });
    return true;
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    console.log(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
    if (!debugMode) {
      calendarData.forEach((dayMap, date) => {
        dayMap.forEach((slot, hour) => {
          if (slot.fromGoogle || slot.syncStatus === 'google-only' || slot.fromFutureSession) {
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
    
    const { bg, text } = getStatusStyle(slot);
    
    return (
      <div 
        className={`absolute left-0 right-0 ${bg}`} 
        style={{ 
          top: `${startPercent}%`,
          height: `${heightPercent}%`,
          borderTop: slot.isFirstHour ? 'none' : 'none', // Remove border
          borderBottom: slot.isLastHour ? 'none' : 'none' // Remove border
        }}
      >
        {slot.isFirstHour && slot.notes && (
          <div className={`p-1 text-xs ${text}`}>
            {slot.notes}
          </div>
        )}
      </div>
    );
  };

  const renderEventContent = (slot: CalendarSlot) => {
    if (!slot.fromGoogle && !slot.notes && !slot.fromFutureSession) return null;

    if (slot.isPartialHour) {
      return renderPartialHourEvent(slot);
    }

    const showNotInGoogleIcon = slot.fromFutureSession && !slot.inGoogleCalendar;
    const { text } = getStatusStyle(slot);

    return (
      <div className={`flex flex-col items-start p-1 overflow-hidden h-full ${text}`}>
        {slot.isFirstHour && (
          <>
            <div className="text-xs font-semibold w-full truncate flex items-center gap-1">
              {showNotInGoogleIcon && <Info className="h-3 w-3 text-white" />}
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
    
    if (currentSlot.fromFutureSession && prevSlot.fromFutureSession) {
      return currentSlot.futureSession?.id === prevSlot.futureSession?.id;
    }
    
    return false;
  };

  const isCurrentTimeSlot = (date: string, hourStr: string): boolean => {
    if (!currentTime) return false;
    
    return currentTime.date === date && currentTime.hour === hourStr;
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
              {days.map((day, index) => {
                const dayDate = new Date(day.date);
                const isCurrentDay = dayDate && isToday(dayDate);
                
                return (
                  <TableHead 
                    key={day.date} 
                    className={`font-bold text-purple-800 text-center min-w-[120px] border-l border-gray-200
                      ${isCurrentDay ? 'bg-purple-100/50' : ''}`}
                  >
                    {day.label}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {hours.map((hour, hourIndex) => (
              <TableRow key={hour} className="border-b border-gray-200">
                <TableCell className="font-medium bg-purple-50 text-purple-800">
                  {hour}
                </TableCell>
                {days.map((day, index) => {
                  const dayMap = calendarData.get(day.date);
                  const slot = dayMap?.get(hour);
                  
                  if (!slot) return null;
                  
                  const prevHour = hourIndex > 0 ? hours[hourIndex - 1] : null;
                  const prevHourSlot = prevHour ? dayMap?.get(prevHour) : undefined;
                  const isConnectedToPrevHour = isSameEvent(slot, prevHourSlot);
                  
                  const { bg, text } = getStatusStyle(slot);
                  const isMultiHourEvent = slot.hoursSpan && slot.hoursSpan > 1;
                  
                  const cellClasses = `
                    ${slot.isPartialHour ? 'bg-transparent' : bg} 
                    ${text} 
                    transition-colors 
                    cursor-pointer 
                    hover:opacity-80 
                    relative 
                    min-h-[60px]
                    ${isConnectedToPrevHour ? 'border-t-0' : ''}
                  `.trim();

                  const cellContent = (
                    <div className={`w-full h-full relative ${isMultiHourEvent ? 'overflow-visible' : ''}`}>
                      {slot.isPartialHour ? (
                        renderPartialHourEvent(slot)
                      ) : slot.fromGoogle || slot.fromFutureSession || (slot.notes && slot.status === 'booked') ? (
                        renderEventContent(slot)
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          {slot.status === 'available' && <Check className="h-4 w-4 text-purple-600" />}
                          {slot.status === 'booked' && <Calendar className="h-4 w-4 text-[#CFB53B]" />}
                          {slot.status === 'completed' && <Calendar className="h-4 w-4 text-gray-600" />}
                          {slot.status === 'canceled' && <Calendar className="h-4 w-4 text-red-600" />}
                          {slot.status === 'private' && <Lock className="h-4 w-4 text-amber-600" />}
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <ContextMenu key={`${day.date}-${hour}`}>
                      <ContextMenuTrigger
                        onContextMenu={(e) => {
                          console.log('ContextMenuTrigger onContextMenu fired');
                          handleContextMenu(e, day.date, hour, slot.status, slot.fromFutureSession, slot.futureSession);
                        }}
                        className="w-full h-full"
                      >
                        <TableCell className={cellClasses}>
                          {(slot.description || slot.fromGoogle || slot.fromFutureSession) ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {cellContent}
                              </TooltipTrigger>
                              <TooltipContent 
                                side="bottom"
                                className="max-w-xs bg-gray-900 text-white p-2 text-xs rounded z-50"
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
                                  {slot.fromFutureSession && !slot.inGoogleCalendar && (
                                    <p className="text-blue-300 mt-1">לא קיים ביומן Google (לחץ ימני להעתקה)</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            cellContent
                          )}
                        </TableCell>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="min-w-[160px] z-[100]">
                        {slot.fromFutureSession && !slot.inGoogleCalendar ? (
                          <ContextMenuItem 
                            className="flex items-center gap-2 text-blue-600"
                            onClick={handleCopyToGoogleCalendar}
                          >
                            <CalendarPlus className="h-4 w-4" />
                            <span>העתק ליומן Google</span>
                          </ContextMenuItem>
                        ) : (
                          <>
                            <ContextMenuItem 
                              className="flex items-center gap-2 text-purple-600"
                              onClick={() => handleSelectOption('available')}
                              disabled={slot.status === 'booked' || slot.fromGoogle || slot.fromFutureSession}
                            >
                              <Check className="h-4 w-4" />
                              <span>הגדר כזמין</span>
                            </ContextMenuItem>
                            <ContextMenuItem 
                              className="flex items-center gap-2 text-amber-600"
                              onClick={() => handleSelectOption('private')}
                              disabled={slot.status === 'booked' || slot.fromGoogle || slot.fromFutureSession}
                            >
                              <Lock className="h-4 w-4" />
                              <span>הגדר כזמן פרטי</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem 
                              className="flex items-center gap-2 text-gray-600"
                              onClick={() => handleSelectOption('unspecified')}
                              disabled={slot.status === 'booked' || slot.fromGoogle || slot.fromFutureSession}
                            >
                              <X className="h-4 w-4" />
                              <span>נקה סטטוס</span>
                            </ContextMenuItem>
                          </>
                        )}
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
