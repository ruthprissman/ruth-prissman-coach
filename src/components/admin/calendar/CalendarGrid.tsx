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
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Check, Calendar, X, Lock, Clock, CalendarPlus, Info, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, isToday } from 'date-fns';
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
          border: 'border-[#D3E4FD]', 
          text: 'text-gray-700',
          colorClass: 'border-[#D3E4FD]'
        };
      }
      
      return { 
        bg: 'bg-[#9b87f5]', 
        border: 'border-[#9b87f5]', 
        text: 'text-white font-medium',
        colorClass: 'border-[#9b87f5]'
      };
    }
    
    if (isPatientMeeting || (isMeeting && status === 'booked')) {
      return { 
        bg: 'bg-[#5C4C8D]', 
        border: 'border-[#5C4C8D]', 
        text: 'text-[#CFB53B] font-medium',
        colorClass: 'border-[#5C4C8D]'
      };
    }

    if (fromGoogle) {
      return { 
        bg: 'bg-[#D3E4FD]', 
        border: 'border-[#D3E4FD]', 
        text: 'text-gray-700',
        colorClass: 'border-[#D3E4FD]'
      };
    }
    
    switch (status) {
      case 'available':
        return { bg: 'bg-purple-100', border: 'border-purple-100', text: 'text-purple-800', colorClass: 'border-purple-100' };
      case 'booked':
        return { bg: 'bg-[#5C4C8D]', border: 'border-[#5C4C8D]', text: 'text-[#CFB53B]', colorClass: 'border-[#5C4C8D]' };
      case 'completed':
        return { bg: 'bg-gray-200', border: 'border-gray-200', text: 'text-gray-800', colorClass: 'border-gray-200' };
      case 'canceled':
        return { bg: 'bg-red-100', border: 'border-red-100', text: 'text-red-800', colorClass: 'border-red-100' };
      case 'private':
        return { bg: 'bg-amber-100', border: 'border-amber-100', text: 'text-amber-800', colorClass: 'border-amber-100' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-50', text: 'text-gray-800', colorClass: 'border-gray-50' };
    }
  };

  const handleSelectOption = (date: string, hour: string, status: 'available' | 'private' | 'unspecified') => {
    console.log("Selected option:", status, "for date:", date, "hour:", hour);
    onUpdateSlot(date, hour, status);
  };

  const handleCopyToGoogleCalendar = async (futureSession: any) => {
    try {
      console.log("Copying to Google Calendar:", futureSession);
      
      const sessionDateTime = new Date(futureSession.session_date);
      const summary = `פגישה עם ${futureSession.patients?.name || 'לקוח/ה'}`; 
      
      const startDateTime = sessionDateTime.toISOString();
      
      const endDateTime = new Date(sessionDateTime.getTime() + 90 * 60000).toISOString();
      
      const description = `סוג פגישה: ${futureSession.meeting_type}${futureSession.zoom_link ? `\nקישור לזום: ${futureSession.zoom_link}` : ''}`;
      
      const success = await createEvent(
        summary,
        startDateTime,
        endDateTime,
        description
      );
      
      if (success) {
        toast({
          title: "הפגישה נוספה ליומן Google",
          description: `הפגישה עם ${futureSession.patients?.name || 'לקוח/ה'} נוספה בהצלחה ליומן Google`,
        });
        console.log("Successfully added to Google Calendar");
      }
    } catch (error: any) {
      console.error("Failed to add event to Google Calendar:", error);
      toast({
        title: "שגיאה בהוספת פגיש�� ליומן",
        description: error.message || "לא הצלחנו להוסיף את הפגישה ליומן Google",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFutureSession = (futureSession: any) => {
    console.log("Delete future session:", futureSession);
    // Currently just logging, will be implemented in the future
    
    toast({
      title: "פעולה בפיתוח",
      description: "מחיקת פגישה עדיין לא מושלמת, תודה על הסבלנות",
    });
  };

  const handleUpdateFutureSession = (futureSession: any) => {
    console.log("Update future session:", futureSession);
    // Currently just logging, will be implemented in the future
    
    toast({
      title: "פעולה בפיתוח",
      description: "עדכון פגישה עדיין לא מושלם, תודה על הסבלנות",
    });
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
    return (
      <div className="p-1 text-xs overflow-hidden">
        {slot.notes && (
          <div className="font-medium truncate">{slot.notes}</div>
        )}
        {slot.exactStartTime && (
          <div className="text-xs opacity-75">
            {slot.exactStartTime}-{slot.exactEndTime}
          </div>
        )}
      </div>
    );
  };

  const renderCellContent = (day: string, hour: string, slot: CalendarSlot) => {
    const isCurrentCell = isCurrentTimeSlot(day, hour);
    const { bg, text, colorClass } = getStatusStyle(slot);
    
    return (
      <div 
        id={`cell-${day}-${hour}`}
        className={`${slot.isPartialHour ? 'bg-transparent' : bg} ${colorClass} ${text} transition-colors cursor-pointer hover:opacity-80 relative min-h-[60px] h-full w-full`}
        onContextMenu={(e) => {
          // To help debug
          console.log("Context menu triggered on cell", day, hour);
        }}
      >
        {isCurrentCell && (
          <div className="absolute top-0 right-0 p-1">
            <Clock className="h-4 w-4 text-[#1EAEDB]" />
          </div>
        )}
        
        {slot.isPartialHour ? (
          renderPartialHourEvent(slot)
        ) : slot.fromGoogle || slot.fromFutureSession || (slot.notes && slot.status === 'booked') ? (
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
              {days.map((day) => {
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
          <TableBody className="relative">
            {hours.map((hour, hourIndex) => (
              <TableRow key={hour} className="border-b border-gray-200">
                <TableCell className="font-medium bg-purple-50 text-purple-800 border-l border-gray-200">
                  {hour}
                </TableCell>
                {days.map((day) => {
                  const dayMap = calendarData.get(day.date);
                  const slot = dayMap?.get(hour);
                  
                  if (!slot) return null;
                  
                  const prevHour = hourIndex > 0 ? hours[hourIndex - 1] : null;
                  const prevHourSlot = prevHour ? dayMap?.get(prevHour) : undefined;
                  const isConnectedToPrevHour = isSameEvent(slot, prevHourSlot);
                  
                  // Tooltip content for the cell
                  const tooltipContent = (
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
                  );

                  // Render different context menus based on whether it's a future session or regular slot
                  if (slot.fromFutureSession) {
                    return (
                      <TableCell 
                        key={`${day.date}-${hour}`}
                        className="p-0 border-l border-gray-200"
                        onContextMenu={(e) => {
                          // Debug info
                          console.log("Context menu triggered for future session", day.date, hour);
                        }}
                      >
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            {(slot.description || slot.fromGoogle || slot.fromFutureSession) ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {renderCellContent(day.date, hour, slot)}
                                </TooltipTrigger>
                                <TooltipContent 
                                  side="bottom"
                                  className="max-w-xs bg-gray-900 text-white p-2 text-xs rounded z-50"
                                >
                                  {tooltipContent}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              renderCellContent(day.date, hour, slot)
                            )}
                          </ContextMenuTrigger>
                          <ContextMenuContent className="min-w-[160px] z-[9999] bg-white border-2 border-gray-300 shadow-xl" onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Context menu content preventing default");
                          }}>
                            <ContextMenuItem 
                              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50"
                              onClick={() => handleCopyToGoogleCalendar(slot.futureSession)}
                            >
                              <CalendarPlus className="h-4 w-4" />
                              <span>העתק ליומן Google</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem 
                              className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteFutureSession(slot.futureSession)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>מחיקה</span>
                            </ContextMenuItem>
                            <ContextMenuItem 
                              className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100"
                              onClick={() => handleUpdateFutureSession(slot.futureSession)}
                            >
                              <Edit className="h-4 w-4" />
                              <span>עדכון</span>
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </TableCell>
                    );
                  } else {
                    // Regular slot context menu
                    return (
                      <TableCell 
                        key={`${day.date}-${hour}`}
                        className="p-0 border-l border-gray-200"
                        onContextMenu={(e) => {
                          // Debug info
                          console.log("Context menu triggered for regular slot", day.date, hour);
                        }}
                      >
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            {(slot.description || slot.fromGoogle) ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {renderCellContent(day.date, hour, slot)}
                                </TooltipTrigger>
                                <TooltipContent 
                                  side="bottom"
                                  className="max-w-xs bg-gray-900 text-white p-2 text-xs rounded z-50"
                                >
                                  {tooltipContent}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              renderCellContent(day.date, hour, slot)
                            )}
                          </ContextMenuTrigger>
                          <ContextMenuContent className="min-w-[160px] z-[9999] bg-white border-2 border-gray-300 shadow-xl" onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Context menu content preventing default");
                          }}>
                            <ContextMenuItem 
                              className="flex items-center gap-2 text-purple-600 hover:bg-purple-50"
                              onClick={() => handleSelectOption(day.date, hour, 'available')}
                              disabled={slot.status === 'booked'}
                            >
                              <Check className="h-4 w-4" />
                              <span>הגדר כזמין</span>
                            </ContextMenuItem>
                            <ContextMenuItem 
                              className="flex items-center gap-2 text-amber-600 hover:bg-amber-50"
                              onClick={() => handleSelectOption(day.date, hour, 'private')}
                              disabled={slot.status === 'booked'}
                            >
                              <Lock className="h-4 w-4" />
                              <span>הגדר כזמן פרטי</span>
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem 
                              className="flex items-center gap-2 text-gray-600 hover:bg-gray-50"
                              onClick={() => handleSelectOption(day.date, hour, 'unspecified')}
                              disabled={slot.status === 'booked'}
                            >
                              <X className="h-4 w-4" />
                              <span>נקה סטטוס</span>
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </TableCell>
                    );
                  }
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
