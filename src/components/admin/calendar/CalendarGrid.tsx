import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { CalendarSlot, GoogleCalendarEvent } from '@/types/calendar';
import { Check, Calendar, Lock, Clock, ArrowUp, Trash2, Database, RefreshCw, Pencil } from 'lucide-react';
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
import DeleteFutureSessionDialog from '../sessions/DeleteFutureSessionDialog';
import { toast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { addFutureSessionToGoogleCalendar } from '@/utils/googleCalendarUtils';
import DeleteGoogleCalendarEventDialog from './DeleteGoogleCalendarEventDialog';

// Component version for debugging
const COMPONENT_VERSION = "1.0.24";
console.log(`LOV_DEBUG_CALENDAR_GRID: Component loaded, version ${COMPONENT_VERSION}`);

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
  const navigate = useNavigate();
  const [forceRefreshToken, setForceRefreshToken] = useState<number>(Date.now());
  const [addToFutureSessionDialogOpen, setAddToFutureSessionDialogOpen] = useState<boolean>(false);
  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<GoogleCalendarEvent | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [meetingToDelete, setMeetingToDelete] = useState<any>(null);
  const [deleteGoogleEventDialogOpen, setDeleteGoogleEventDialogOpen] = useState<boolean>(false);
  const [googleEventToDelete, setGoogleEventToDelete] = useState<GoogleCalendarEvent | null>(null);
  const [inspectSlot, setInspectSlot] = useState<any>(null);
  
  // Add the Google OAuth hook to get access to the createEvent function
  const { createEvent, deleteEvent } = useGoogleOAuth();
  
  console.log(`LOV_DEBUG_CALENDAR_GRID: Rendering with ${days.length} days, ${hours.length} hours, loading: ${isLoading}`);
  console.log(`LOV_DEBUG_CALENDAR_GRID: Calendar data contains ${calendarData.size} days`);

  // New function to handle adding a future session to Google Calendar
  const handleAddToGoogleCalendar = async (slot: CalendarSlot) => {
    console.log(`GOOGLE_CALENDAR_DEBUG: Adding to Google Calendar:`, slot.futureSession);
    
    if (!slot.fromFutureSession) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף ליומן, זו אינה פגישה מטבלת הפגישות",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Use the utility function to add the session to Google Calendar
      const success = await addFutureSessionToGoogleCalendar(slot, createEvent);
      
      if (success) {
        // Force refresh the calendar to show updated status
        handleForceRefresh();
      }
    } catch (error: any) {
      console.error("Error adding to Google Calendar:", error);
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהוספה ליומן Google",
        variant: "destructive"
      });
    }
  };

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

  // Add the missing handleFutureSessionCreated function
  const handleFutureSessionCreated = () => {
    console.log(`MEETING_SAVE_DEBUG: Future session created, forcing refresh`);
    handleForceRefresh();
  };

  const getStatusStyle = (slot: CalendarSlot) => {
    const { status, fromGoogle, isMeeting, isPatientMeeting, fromFutureSession, inGoogleCalendar } = slot;
    
    console.log(`COLOR_DEBUG: Slot status check - fromFutureSession: ${fromFutureSession}, inGoogleCalendar: ${inGoogleCalendar}, fromGoogle: ${fromGoogle}, isMeeting: ${isMeeting}, status: ${status}`);
    
    // First priority: Future sessions from the DB that are not in Google Calendar
    if (fromFutureSession && !inGoogleCalendar) {
      console.log(`COLOR_DEBUG: Using purple color for future session not in Google Calendar`);
      return { 
        bg: 'bg-[#9b87f5]', 
        border: 'border-[#9b87f5]', 
        text: 'text-white font-medium',
        colorClass: 'border-[#9b87f5]',
        borderColor: '#9b87f5'
      };
    }
    
    // Second priority: Patient meetings (always get a specific color)
    if (isPatientMeeting) {
      console.log(`COLOR_DEBUG: Using dark purple color for patient meeting`);
      return { 
        bg: 'bg-[#5C4C8D]', 
        border: 'border-[#5C4C8D]', 
        text: 'text-[#CFB53B] font-medium',
        colorClass: 'border-[#5C4C8D]',
        borderColor: '#5C4C8D'
      };
    }

    // Third priority: Events that are in both DB and Google Calendar
    if (fromFutureSession && inGoogleCalendar) {
      console.log(`COLOR_DEBUG: Using light blue color for future session in Google Calendar`);
      return { 
        bg: 'bg-[#D3E4FD]', 
        border: 'border-[#D3E4FD]', 
        text: 'text-gray-700',
        colorClass: 'border-[#D3E4FD]',
        borderColor: '#D3E4FD'
      };
    }
    
    // Fourth priority: Google Calendar events not in DB
    if (fromGoogle && !fromFutureSession) {
      console.log(`COLOR_DEBUG: Using light blue color for Google Calendar event`);
      return { 
        bg: 'bg-[#D3E4FD]', 
        border: 'border-[#D3E4FD]', 
        text: 'text-gray-700',
        colorClass: 'border-[#D3E4FD]',
        borderColor: '#D3E4FD'
      };
    }
    
    // Default statuses
    switch (status) {
      case 'available':
        return { bg: 'bg-purple-100', border: 'border-purple-100', text: 'text-purple-800', colorClass: 'border-purple-100', borderColor: '#F3E8FF' };
      case 'booked':
        return { bg: 'bg-[#5C4C8D]', border: 'border-[#5C4C8D]', text: 'text-[#CFB53B]', colorClass: 'border-[#5C4C8D]', borderColor: '#5C4C8D' };
      case 'completed':
        return { bg: 'bg-gray-200', border: 'border-gray-200', text: 'text-gray-800', colorClass: 'border-gray-200', borderColor: '#E5E7EB' };
      case 'canceled':
        return { bg: 'bg-red-100', border: 'border-red-100', text: 'text-red-800', colorClass: 'border-red-100', borderColor: '#FEE2E2' };
      case 'private':
        return { bg: 'bg-amber-100', border: 'border-amber-100', text: 'text-amber-800', colorClass: 'border-amber-100', borderColor: '#FEF3C7' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-50', text: 'text-gray-800', colorClass: 'border-gray-50', borderColor: '#F9FAFB' };
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
        futureSession: slot?.futureSession
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
    // This will cause the component to re-render with a new token value
  };

  // Handle delete future session
  const handleDeleteFutureSession = (slot: CalendarSlot) => {
    // לוגים מפורטים לכל מקרה
    console.log("DELETE_DEBUG: Slot Received:", slot);
    console.log("DELETE_DEBUG: slot.futureSession:", slot.futureSession);
    console.log("DELETE_DEBUG: slot.fromFutureSession:", slot.fromFutureSession, "slot.fromGoogle:", slot.fromGoogle);

    // ניתן למחוק רק אם קיים futureSession.id
    if (slot.fromFutureSession && slot.futureSession?.id) {
      setMeetingToDelete(slot.futureSession);
      setDeleteDialogOpen(true);
      console.log("DELETE_DEBUG: Opened Modal for DB futureSession id", slot.futureSession.id);
      return;
    }

    // אם זה Google בלבד - אין אפשרות למחוק מפה
    if (slot.fromGoogle && !slot.fromFutureSession) {
      toast({
        title: "מחיקה דרך Google Calendar בלבד",
        description: "פגישה זו מקורה ביומן Google בלבד, לא ניתן למחוק אותה כאן. מחיקה יש לעשות דרך היומן.",
        variant: "destructive"
      });
      console.log("DELETE_DEBUG: Toast for Google Calendar only event");
      return;
    }
    
    // כל מקרה אחר: אין מזהה/לא מזוהה
    toast({
      title: "שגיאה",
      description: "לא ניתן למחוק את הפגישה - חסר מזהה או מקור לא מזוהה. ראה לוג בדפדפן.",
      variant: "destructive"
    });
    console.log("DELETE_DEBUG: Error - missing id or unknown source for slot", slot);
  };

  // Confirm delete future session
  const confirmDeleteSession = async () => {
    if (!meetingToDelete?.id) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את הפגישה, חסר מזהה ב-meetingToDelete",
        variant: "destructive"
      });
      console.log("DELETE_DEBUG: Tried deleting with missing id", meetingToDelete);
      return;
    }

    try {
      const supabase = await supabaseClient();
      const { error } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', meetingToDelete.id);

      if (error) throw error;

      toast({
        title: "הפגישה נמחקה בהצלחה",
        description: "הפגישה נמחקה ממסד הנתונים",
      });
      console.log("DELETE_DEBUG: Meeting deleted successfully", meetingToDelete.id);
      
      // Force refresh to update the calendar
      handleForceRefresh();
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting future session:", error);
      toast({
        title: "שגיאה במחיקת הפגישה",
        description: error.message,
        variant: "destructive"
      });
      console.log("DELETE_DEBUG: Error from Supabase", error);
    }
  };

  // Format date for delete dialog
  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle add to future sessions
  const handleAddToFutureSessions = (slot: CalendarSlot, date: string) => {
    console.log(`MEETING_SAVE_DEBUG: Adding meeting to future sessions for ${date} at ${slot.hour}`);
    
    // Extract client ID from the notes if it contains "פגישה עם"
    const clientName = extractClientName(slot.notes);
    // For now, we'll set clientId to null since we don't have a way to map names to IDs
    // This will need to be enhanced to lookup the actual client ID
    
    setSelectedGoogleEvent(slot.googleEvent || null);
    setSelectedClientId(null); // This should be enhanced to get actual client ID
    setAddToFutureSessionDialogOpen(true);
  };

  // Function to check if a slot is a work meeting (starts with "פגישה עם" OR is a future session OR is a patient meeting)
  const isWorkMeeting = (slot: CalendarSlot): boolean => {
    // If it's a future session, consider it a work meeting regardless of notes
    if (slot.fromFutureSession === true) {
      console.log(`ICON_DEBUG: isWorkMeeting - detected future session, returning true`);
      return true;
    }
    
    // Check if it's a patient meeting (90 minutes duration)
    if (slot.isPatientMeeting === true) {
      console.log(`ICON_DEBUG: isWorkMeeting - detected patient meeting, returning true`);
      return true;
    }
    
    // Check if notes exists and starts with the required prefix for work meetings
    const notesContent = slot.notes || '';
    const isMeeting = typeof notesContent === 'string' && notesContent.startsWith('פגישה עם');
    
    console.log(`ICON_DEBUG: isWorkMeeting check for notes "${notesContent}" => ${isMeeting}, fromFutureSession: ${slot.fromFutureSession}, fromGoogle: ${slot.fromGoogle}, isPatientMeeting: ${slot.isPatientMeeting}`);
    return isMeeting;
  };

  // Extract client name from meeting notes
  const extractClientName = (notes: string | undefined): string => {
    if (!notes) return '';
    if (!notes.startsWith('פגישה עם')) return '';
    return notes.replace('פגישה עם', '').trim();
  };

  // Navigate to sessions with client name as search param
  const navigateToSessions = (clientName: string) => {
    navigate(`/admin/sessions?search=${encodeURIComponent(clientName)}`);
  };

  // NEW: Checks if a slot is a past meeting (uses session or google date)
  const isPastMeeting = (slot: CalendarSlot): boolean => {
    let dateStr: string | null = null;
    // Prefer DB event date
    if (slot.futureSession?.session_date) {
      dateStr = slot.futureSession.session_date;
    } else if (slot.googleEvent?.start?.dateTime) {
      dateStr = slot.googleEvent.start.dateTime;
    } else {
      // fallback: combine slot.date+hour as ISO (not reliable, fallback only)
      dateStr = slot.date && slot.hour ? `${slot.date}T${slot.hour}` : null;
    }
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  // Only change this logic!
  const renderActionIcons = (slot: CalendarSlot, date: string) => {
    const isWorkMeetingSlot = isWorkMeeting(slot);
    if (!isWorkMeetingSlot) return null;
    const clientName = extractClientName(slot.notes);

    // NEW: Show ONLY trash icon if meeting is in the past
    if (isPastMeeting(slot)) {
      // --- NEW: אפשרות למחוק גם פגישות ממקור Google בלבד
      return (
        <div className="absolute top-0 right-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (slot.fromGoogle && !slot.fromFutureSession) {
                    // Google only event
                    handleDeleteGoogleEvent(slot);
                  } else {
                    // רגיל
                    handleDeleteFutureSession(slot);
                  }
                }}
                className="bg-white p-1 rounded-full shadow hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>מחק פגישה</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }

    return (
      <div className="absolute top-0 right-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {/* Update button */}
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
        
        {/* Delete button for future sessions */}
        {slot.fromFutureSession && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFutureSession(slot);
                }}
                className="bg-white p-1 rounded-full shadow hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>מחק פגישה</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Google Calendar delete button for Google-only events */}
        {slot.fromGoogle && !slot.fromFutureSession && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteGoogleEvent(slot);
                }}
                className="bg-white p-1 rounded-full shadow hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>מחק מגוגל</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Google Calendar add button */}
        {slot.fromFutureSession && !slot.inGoogleCalendar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToGoogleCalendar(slot);
                }}
                className="bg-white p-1 rounded-full shadow hover:bg-green-50"
              >
                <Calendar className="w-3.5 h-3.5 text-green-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>הוסף ליומן Google</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Add to DB button for Google events not in DB */}
        {slot.fromGoogle && !slot.fromFutureSession && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
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
    const isWorkMeetingSlot = isWorkMeeting(slot);
    
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
          <div className={`p-1 text-xs ${text} flex items-center gap-1`}>
            {/* Display icon for work meetings - ALWAYS GOLD */}
            {slot.icon && isWorkMeetingSlot && (
              <span className="text-[#CFB53B] text-base font-bold flex-shrink-0">
                {slot.icon}
              </span>
            )}
            <span className="truncate">{slot.notes}</span>
          </div>
        )}
      </div>
    );
  };

  // Simplified function to render event content only in the first hour
  const renderEventContent = (slot: CalendarSlot) => {
    // DEBUG הגברת הגלוי אך ורק כשיש פגישה
    if (slot.fromFutureSession || slot.fromGoogle) {
      console.log(
        `[ICON_UI_DEBUG] Rendering slot UI: date=${slot.date} hour=${slot.hour} icon=${slot.icon} fromFutureSession=${slot.fromFutureSession} fromGoogle=${slot.fromGoogle}`,
        slot
      );
    }

    const isWorkMeetingSlot = isWorkMeeting(slot);

    // ניתן להציג את הכל בלחיצה עם ALT - ויזואלי
    return (
      <div 
        className="p-1 text-xs overflow-hidden cursor-pointer"
        onClick={e => {
          if (e.altKey) {
            setInspectSlot(slot);
          }
        }}
      >
        <div className="flex items-center gap-1">
          {/* Remove all icon rendering - no icons displayed */}
          <span 
            className="font-medium truncate"
            title={slot.notes}
          >
            {slot.notes}
          </span>
          {/* Debug info - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <span className="ml-1 text-[10px] text-purple-700">
                {slot.fromFutureSession ? "fromFutureSession" : ""}
              </span>
              <span className="ml-1 text-[10px] text-blue-700">
                {slot.fromGoogle ? "fromGoogle" : ""}
              </span>
            </>
          )}
        </div>
        {process.env.NODE_ENV === 'development' && (
          <>
            <div className="text-[10px] opacity-40">
              hour: {slot.hour}, date: {slot.date}
            </div>
            {slot.futureSession && (
              <div className="text-[10px] opacity-70">
                futureSession.id: {slot.futureSession?.id || "(no id)"}
              </div>
            )}
          </>
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
    const { bg, text, colorClass, borderColor } = getStatusStyle(slot);
    const isWorkMeetingSlot = isWorkMeeting(slot);
    
    console.log(`LOV_DEBUG_CALENDAR_GRID: Rendering cell ${day} ${hour}, isWorkMeeting: ${isWorkMeetingSlot}, status: ${slot.status}, fromFutureSession: ${slot.fromFutureSession}`);
    
    return (
      <div 
        id={`cell-${day}-${hour}`}
        className={`${slot.isPartialHour ? 'bg-transparent' : bg} ${colorClass} ${text} relative min-h-[60px] h-full w-full group`}
      >
        {isCurrentCell && (
          <div className="absolute top-0 right-0 p-1">
            <Clock className="h-4 w-4 text-[#1EAEDB]" />
          </div>
        )}
        
        {/* Show action icons for work meetings, and only in the first hour of multi-hour events */}
        {(!slot.isPartialHour || slot.isFirstHour) && renderActionIcons(slot, day)}
        
        {/* Render partial hour events and other cell content */}
        {slot.isPartialHour ? (
          renderPartialHourEvent(slot)
        ) : slot.fromGoogle || slot.fromFutureSession || (slot.notes && slot.status === 'booked') ? (
          renderEventContent(slot)
        ) : (
          <>
            {/* Remove all status icons - no icons displayed */}
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

  // --- ADD: Handler to open delete dialog for Google event (sets state) ---
  const handleDeleteGoogleEvent = (slot: CalendarSlot) => {
    if (slot.googleEvent) {
      setGoogleEventToDelete(slot.googleEvent);
      setDeleteGoogleEventDialogOpen(true);
    }
  };

  // --- ADD: Handler to confirm deletion of Google event ---
  const confirmDeleteGoogleEvent = async () => {
    if (!googleEventToDelete?.id) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את האירוע, חסר מזהה",
        variant: "destructive"
      });
      setDeleteGoogleEventDialogOpen(false);
      return;
    }
    try {
      await deleteEvent(googleEventToDelete.id);
      toast({
        title: "האירוע נמחק מיומן Google",
        description: "האירוע נמחק בהצלחה מהיומן",
      });
      setDeleteGoogleEventDialogOpen(false);
      setGoogleEventToDelete(null);
      handleForceRefresh();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה במחיקת האירוע מגוגל",
        variant: "destructive"
      });
      setDeleteGoogleEventDialogOpen(false);
      setGoogleEventToDelete(null);
    }
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

  console.log(`ICON_DEBUG: Rendering calendar grid for days: ${days.map(d => d.date).join(', ')}`);
  console.log(`ICON_DEBUG: Force refresh token: ${forceRefreshToken}`);

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
                  
                  // Get color style for border
                  const { borderColor } = getStatusStyle(slot);
                  
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
                    </div>
                  );

                  return (
                    <TableCell 
                      key={`${day.date}-${hour}`}
                      className={`p-0 border-l border-gray-200`}
                      style={{
                        ...(isConnectedToPrevHour ? {
                          borderTop: `1px solid ${borderColor}`,
                        } : {})
                      }}
                    >
                      <div 
                        className={`w-full h-full`}
                        style={{
                          ...(isConnectedToPrevHour && { 
                            marginTop: '-1px',  // Compensate for the border
                            height: 'calc(100% + 1px)', // Extend height to cover the gap
                            borderTop: `0px solid ${borderColor}`,
                          })
                        }}
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
                      </div>
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
          googleEvent={selectedGoogleEvent}
          clientId={selectedClientId}
          onAdded={handleFutureSessionCreated}
        />

        {/* Dialog for deleting future sessions */}
        <DeleteFutureSessionDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          session={meetingToDelete}
          onConfirm={confirmDeleteSession}
          formatDate={formatDate}
        />

        {/* Dialog for deleting Google Calendar events */}
        <DeleteGoogleCalendarEventDialog
          open={deleteGoogleEventDialogOpen}
          onOpenChange={setDeleteGoogleEventDialogOpen}
          googleEvent={googleEventToDelete}
          onConfirm={confirmDeleteGoogleEvent}
        />

        {/* Debug modal */}
        {inspectSlot && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setInspectSlot(null)}
          >
            <div
              className="bg-white rounded p-6 max-w-lg shadow-lg overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-lg font-bold mb-2 text-center">Slot debug info</div>
              <pre className="text-xs text-left break-all">{JSON.stringify(inspectSlot, null, 2)}</pre>
              <button
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded"
                onClick={() => setInspectSlot(null)}
              >
                סגור
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CalendarGrid;
