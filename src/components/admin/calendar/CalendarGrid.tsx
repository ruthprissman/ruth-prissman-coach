
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { CalendarSlot } from '@/types/calendar';
import { Check, Calendar, Lock, Clock, ArrowUp, Trash2, Database, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { format, isToday, isPast } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AddMeetingToFutureSessionsDialog from './AddMeetingToFutureSessionsDialog';
import CalendarConflictResolutionDialog from './CalendarConflictResolutionDialog';

// Component version for debugging
const COMPONENT_VERSION = "1.0.11";
console.log(`LOV_DEBUG_CALENDAR_GRID: Component loaded, version ${COMPONENT_VERSION}`);

interface CalendarGridProps {
  days: { date: string; label: string; dayNumber: number }[];
  hours: string[];
  calendarData: Map<string, Map<string, CalendarSlot>>;
  onUpdateSlot: (date: string, hour: string, status: 'available' | 'private' | 'unspecified') => void;
  isLoading: boolean;
  onResolutionComplete: () => void;
  createGoogleCalendarEvent: (summary: string, startDateTime: string, endDateTime: string, description: string) => Promise<boolean>;
  deleteGoogleCalendarEvent: (eventId: string) => Promise<boolean>;
  updateGoogleCalendarEvent: (eventId: string, summary: string, startDateTime: string, endDateTime: string, description: string) => Promise<boolean>;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  days, 
  hours, 
  calendarData, 
  onUpdateSlot,
  isLoading,
  onResolutionComplete,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent
}) => {
  const [debugMode, setDebugMode] = useState(true);
  const [currentTime, setCurrentTime] = useState<{
    date: string;
    hour: string;
    minute: number;
  } | null>(null);
  const navigate = useNavigate();
  const [forceRefreshToken, setForceRefreshToken] = useState<number>(Date.now());
  const [addToFutureSessionDialogOpen, setAddToFutureSessionDialogOpen] = useState<boolean>(false);
  const [selectedMeetingSlot, setSelectedMeetingSlot] = useState<CalendarSlot | null>(null);
  
  // New state for conflict resolution dialog
  const [conflictDialogOpen, setConflictDialogOpen] = useState<boolean>(false);
  const [conflictData, setConflictData] = useState<{
    googleEvent: CalendarSlot | null;
    futureSessionEvent: CalendarSlot | null;
    date: string;
  }>({
    googleEvent: null,
    futureSessionEvent: null,
    date: ''
  });
  
  console.log(`LOV_DEBUG_CALENDAR_GRID: Rendering with ${days.length} days, ${hours.length} hours, loading: ${isLoading}`);
  console.log(`LOV_DEBUG_CALENDAR_GRID: Calendar data contains ${calendarData.size} days`);

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

    console.log(`LOV_DEBUG_CALENDAR_GRID: Setting up current time effect, version: ${COMPONENT_VERSION}`);
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);

    return () => {
      clearInterval(interval);
      console.log('LOV_DEBUG_CALENDAR_GRID: Cleaning up current time interval');
    };
  }, []);

  useEffect(() => {
    console.log(`LOV_DEBUG_CALENDAR_GRID: Calendar data updated or force refresh triggered, token: ${forceRefreshToken}`);
    // This effect runs whenever calendarData or forceRefreshToken changes
  }, [calendarData, forceRefreshToken]);

  // Handle future session creation
  const handleFutureSessionCreated = () => {
    console.log(`MEETING_SAVE_DEBUG: Future session created, forcing refresh`);
    handleForceRefresh();
  };

  const getStatusStyle = (slot: CalendarSlot) => {
    const { status, fromGoogle, isMeeting, isPatientMeeting, fromFutureSession, inGoogleCalendar } = slot;
    
    // Check for conflicts (both in Google Calendar and future_sessions)
    if (slot.hasConflict) {
      console.log(`CONFLICT_RESOLUTION_DEBUG: Using alert color for conflicting slot`);
      return { 
        bg: 'bg-red-100', 
        border: 'border-red-400 border-2', 
        text: 'text-red-800 font-medium',
        colorClass: 'border-red-400'
      };
    }
    
    // First priority: Future sessions from the DB that are not in Google Calendar
    if (fromFutureSession && !inGoogleCalendar) {
      console.log(`COLOR_DEBUG: Using purple color for future session not in Google Calendar`);
      return { 
        bg: 'bg-[#9b87f5]', 
        border: 'border-[#9b87f5]', 
        text: 'text-white font-medium',
        colorClass: 'border-[#9b87f5]'
      };
    }
    
    // Second priority: Patient meetings (always get a specific color)
    if (isPatientMeeting || (isMeeting && (status as string) === 'booked')) {
      console.log(`COLOR_DEBUG: Using dark purple color for patient meeting`);
      return { 
        bg: 'bg-[#5C4C8D]', 
        border: 'border-[#5C4C8D]', 
        text: 'text-[#CFB53B] font-medium',
        colorClass: 'border-[#5C4C8D]'
      };
    }

    // Third priority: Events that are in both DB and Google Calendar
    if (fromFutureSession && inGoogleCalendar) {
      console.log(`COLOR_DEBUG: Using light blue color for future session in Google Calendar`);
      return { 
        bg: 'bg-[#D3E4FD]', 
        border: 'border-[#D3E4FD]', 
        text: 'text-gray-700',
        colorClass: 'border-[#D3E4FD]'
      };
    }
    
    // Fourth priority: Google Calendar events not in DB
    if (fromGoogle && !fromFutureSession) {
      console.log(`COLOR_DEBUG: Using light blue color for Google Calendar event`);
      return { 
        bg: 'bg-[#D3E4FD]', 
        border: 'border-[#D3E4FD]', 
        text: 'text-gray-700',
        colorClass: 'border-[#D3E4FD]'
      };
    }
    
    // Default statuses - unchanged
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

  const logSlotInfo = (date: string, hour: string, slot?: CalendarSlot) => {
    if (debugMode) {
      console.log(`LOV_DEBUG_CALENDAR_GRID: Slot at ${date} ${hour}:`, {
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
        futureSession: slot?.futureSession,
        hasConflict: slot?.hasConflict,
        conflictSlot: slot?.conflictSlot
      });
    }
    return true;
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    console.log(`LOV_DEBUG_CALENDAR_GRID: Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
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

  // Force refresh to help diagnose caching/state issues
  const handleForceRefresh = () => {
    console.log(`MEETING_SAVE_DEBUG: Force refresh triggered at ${new Date().toISOString()}`);
    setForceRefreshToken(Date.now());
    onResolutionComplete();
    // This will cause the component to re-render with a new token value
  };

  // Handle add to future sessions
  const handleAddToFutureSessions = (slot: CalendarSlot, date: string) => {
    console.log(`MEETING_SAVE_DEBUG: Adding meeting to future sessions for ${date} at ${slot.hour}`);
    // Set the selected meeting slot and open the dialog
    setSelectedMeetingSlot(slot);
    setAddToFutureSessionDialogOpen(true);
  };

  // New: Handle conflict resolution
  const handleOpenConflictResolution = (slot: CalendarSlot, date: string) => {
    if (!slot.hasConflict || !slot.conflictSlot) {
      return; // No conflict to resolve
    }
    
    console.log(`CONFLICT_RESOLUTION_DEBUG: Opening conflict dialog for ${date} at ${slot.hour}`);
    
    // Determine which event is from Google Calendar and which is from future_sessions
    let googleEvent: CalendarSlot | null = null;
    let futureSessionEvent: CalendarSlot | null = null;
    
    if (slot.fromGoogle && slot.conflictSlot.fromFutureSession) {
      googleEvent = slot;
      futureSessionEvent = slot.conflictSlot;
    } else if (slot.fromFutureSession && slot.conflictSlot.fromGoogle) {
      googleEvent = slot.conflictSlot;
      futureSessionEvent = slot;
    }
    
    // Set conflict data and open dialog
    setConflictData({
      googleEvent,
      futureSessionEvent,
      date
    });
    
    setConflictDialogOpen(true);
  };

  // Function to check if a slot is a work meeting (starts with "פגישה עם")
  const isWorkMeeting = (slot: CalendarSlot): boolean => {
    return !!slot.notes && 
           typeof slot.notes === 'string' && 
           slot.notes.startsWith('פגישה עם') && 
           ((slot.status as string) === 'booked' || slot.isPatientMeeting || (slot.isMeeting && (slot.status as string) === 'booked'));
  };

  // Extract client name from meeting notes
  const extractClientName = (notes: string | undefined): string => {
    if (!notes || !notes.startsWith('פגישה עם')) return '';
    return notes.replace('פגישה עם', '').trim();
  };

  // Navigate to sessions with client name as search param
  const navigateToSessions = (clientName: string) => {
    navigate(`/admin/sessions?search=${encodeURIComponent(clientName)}`);
  };

  // Render action icons for work meetings - Fixed to be visible only on hover
  const renderActionIcons = (slot: CalendarSlot, date: string) => {
    if (!isWorkMeeting(slot)) return null;

    const meetingDate = new Date(date);
    meetingDate.setHours(parseInt(slot.hour.split(':')[0]), 0, 0, 0);
    const isPastMeeting = isPast(meetingDate);
    const clientName = extractClientName(slot.notes);
    
    // Add debugging logs with unique prefix for this issue
    console.log(`DB_BUTTON_DEBUG: Rendering action icons for meeting on ${date} at ${slot.hour}, is past: ${isPastMeeting}`);
    console.log(`DB_BUTTON_DEBUG: Meeting flags - fromGoogle: ${slot.fromGoogle}, fromFutureSession: ${slot.fromFutureSession}, inGoogleCalendar: ${slot.inGoogleCalendar}, notes: ${slot.notes}`);
    
    return (
      <div className="absolute top-0 right-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {isPastMeeting ? (
          // Past meetings - only show update button that navigates to sessions page
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToSessions(clientName);
                }}
                className="bg-white p-1 rounded-full shadow hover:bg-purple-50"
              >
                <ArrowUp className="w-3.5 h-3.5 text-purple-800" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>עדכן פגישה</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          // Future meetings - show different buttons based on whether it exists in future_sessions
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToSessions(clientName);
                  }}
                  className="bg-white p-1 rounded-full shadow hover:bg-purple-50"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-purple-800" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>עדכן פגישה</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white p-1 rounded-full shadow hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>מחק פגישה</p>
              </TooltipContent>
            </Tooltip>
            
            {slot.fromGoogle && !slot.fromFutureSession && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`DB_BUTTON_DEBUG: Add to DB button clicked for meeting: ${slot.notes}`);
                      handleAddToFutureSessions(slot, date);
                    }}
                    className="bg-white p-1 rounded-full shadow hover:bg-blue-50"
                  >
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>הוסף לטבלת פגישות</p>
                </TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </div>
    );
  };

  // Improved function to render multi-hour events
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
        {/* Only show text in the first hour of a multi-hour event */}
        {slot.isFirstHour && slot.notes && (
          <div className={`p-1 text-xs ${text}`}>
            {slot.notes}
          </div>
        )}
      </div>
    );
  };

  // Simplified function to render event content only in the first hour
  const renderEventContent = (slot: CalendarSlot) => {
    if (!slot.isFirstHour && (slot.fromGoogle || slot.fromFutureSession)) {
      return null; // Don't show content in non-first hours of multi-hour events
    }
    
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
    const isWorkMeetingSlot = isWorkMeeting(slot);
    
    console.log(`LOV_DEBUG_CALENDAR_GRID: Rendering cell ${day} ${hour}, isWorkMeeting: ${isWorkMeetingSlot}, status: ${slot.status}`);
    
    // Handle clicks on conflict cells
    const handleClick = () => {
      if (slot.hasConflict) {
        handleOpenConflictResolution(slot, day);
      }
    };
    
    return (
      <div 
        id={`cell-${day}-${hour}`}
        className={`${slot.isPartialHour ? 'bg-transparent' : bg} ${colorClass} ${text} relative min-h-[60px] h-full w-full group ${slot.hasConflict ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        {isCurrentCell && (
          <div className="absolute top-0 right-0 p-1">
            <Clock className="h-4 w-4 text-[#1EAEDB]" />
          </div>
        )}
        
        {/* Display conflict indicator */}
        {slot.hasConflict && (
          <div className="absolute top-0 left-0 p-1">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          </div>
        )}
        
        {/* Only show action icons for work meetings, and only in the first hour of multi-hour events */}
        {isWorkMeetingSlot && (!slot.isPartialHour || slot.isFirstHour) && renderActionIcons(slot, day)}
        
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

  // Determines if two slots are part of the same event
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

  console.log(`MEETING_SAVE_DEBUG: Rendering calendar grid for days: ${days.map(d => d.date).join(', ')}`);
  console.log(`MEETING_SAVE_DEBUG: Force refresh token: ${forceRefreshToken}`);

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="mb-2 flex justify-between items-center">
          <Button 
            onClick={handleForceRefresh}
            variant="outline"
            size="sm" 
            className="text-xs flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            ריענון יזום ({new Date().toLocaleTimeString()})
          </Button>
          <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
            גרסה: {COMPONENT_VERSION}
          </div>
          <button 
            onClick={toggleDebugMode}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 bg-gray-100 rounded"
          >
            {debugMode ? 'הסתר מידע דיבאג' : 'הצג מידע דיבאג'}
          </button>
        </div>
        
        {/* טבלת היומן */}
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
                  
                  if (!slot) {
                    console.log(`LOV_DEBUG_CALENDAR_GRID: No slot found for ${day.date} ${hour}`);
                    return null;
                  }
                  
                  // Log this slot when in debug mode
                  logSlotInfo(day.date, hour, slot);
                  
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
                        <p className="text-blue-300 mt-1">לא קיים ביומן Google</p>
                      )}
                      {slot.hasConflict && (
                        <p className="text-red-500 mt-1 font-bold">התנגשות פגישות! לחץ לפתרון</p>
                      )}
                    </div>
                  );

                  return (
                    <TableCell 
                      key={`${day.date}-${hour}`}
                      className="p-0 border-l border-gray-200"
                    >
                      {(slot.description || slot.fromGoogle || slot.fromFutureSession) ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-full h-full">
                              {renderCellContent(day.date, hour, slot)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="bottom"
                            className="max-w-xs bg-gray-900 text-white p-2 text-xs rounded z-50"
                          >
                            {tooltipContent}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="w-full h-full">
                          {renderCellContent(day.date, hour, slot)}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Dialog for adding meetings to future sessions */}
        <AddMeetingToFutureSessionsDialog
          open={addToFutureSessionDialogOpen}
          onOpenChange={setAddToFutureSessionDialogOpen}
          meetingSlot={selectedMeetingSlot}
          onSessionCreated={handleFutureSessionCreated}
        />
        
        {/* Dialog for resolving conflicts between Google Calendar and future_sessions */}
        <CalendarConflictResolutionDialog
          open={conflictDialogOpen}
          onOpenChange={setConflictDialogOpen}
          googleCalendarEvent={conflictData.googleEvent}
          futureSessionEvent={conflictData.futureSessionEvent}
          date={conflictData.date}
          onResolutionComplete={onResolutionComplete}
          availableHours={hours}
          createGoogleCalendarEvent={createGoogleCalendarEvent}
          deleteGoogleCalendarEvent={deleteGoogleCalendarEvent}
          updateGoogleCalendarEvent={updateGoogleCalendarEvent}
        />
      </div>
    </TooltipProvider>
  );
};

export default CalendarGrid;
