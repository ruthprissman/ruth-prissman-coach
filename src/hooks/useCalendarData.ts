
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { CalendarSlot, GoogleCalendarEvent } from '@/types/calendar';
import { 
  generateEmptyCalendarData,
  generateWeekDays,
  processGoogleEvents,
  processFutureSessions,
  createGoogleEventsMap
} from '@/utils/calendarDataProcessing';
import {
  fetchAvailabilitySlots,
  fetchBookedSessions
} from '@/utils/calendarDataFetching';

// Version identifier for debugging
const COMPONENT_VERSION = "1.0.2";

export function useCalendarData(
  currentDate: Date,
  googleEvents: GoogleCalendarEvent[],
  isGoogleAuthenticated: boolean
) {
  const [calendarData, setCalendarData] = useState<Map<string, Map<string, CalendarSlot>>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [debugVersion, setDebugVersion] = useState<string>(`LOV_DEBUG_VERSION_${COMPONENT_VERSION}_${new Date().toISOString()}`);

  const fetchAvailabilityData = async () => {
    try {
      console.log(`LOV_DEBUG_CALENDAR_DATA: Starting fetchAvailabilityData at ${new Date().toISOString()}, component version: ${COMPONENT_VERSION}`);
      console.log(`LOV_DEBUG_CALENDAR_DATA: Current date provided:`, currentDate);
      
      setIsLoading(true);
      
      // Always fetch data from the beginning of the week
      console.log(`LOV_DEBUG_CALENDAR_DATA: Fetching availability slots and booked sessions`);
      const [availableSlots, bookedSlots] = await Promise.all([
        fetchAvailabilitySlots(currentDate),
        fetchBookedSessions(currentDate)
      ]);
      
      console.log(`LOV_DEBUG_CALENDAR_DATA: Received availability slots: ${availableSlots.length}, booked slots: ${bookedSlots.length}`);

      // DEBUG: Log details of booked slots to understand structure
      console.log(`FUTURE_SESSION_DEBUG: Booked slots received:`, bookedSlots);
      bookedSlots.forEach((slot, index) => {
        console.log(`FUTURE_SESSION_DEBUG: Slot ${index}:`, {
          id: slot.id,
          patient_id: slot.patient_id,
          session_date: slot.session_date,
          patient_name: slot.patients?.name,
          meeting_type: slot.meeting_type
        });
      });

      console.log('LOV_DEBUG_CALENDAR_DATA: Generating calendar data');
      let newCalendarData = generateEmptyCalendarData(currentDate);
      const days = generateWeekDays(currentDate);
      console.log(`LOV_DEBUG_CALENDAR_DATA: Generated days:`, days.map(d => d.date));
      
      // Process available slots
      console.log(`LOV_DEBUG_CALENDAR_DATA: Processing ${availableSlots.length} available slots`);
      availableSlots.forEach(slot => {
        const dayMap = newCalendarData.get(slot.date);
        if (dayMap && dayMap.has(slot.start_time)) {
          dayMap.set(slot.start_time, {
            ...dayMap.get(slot.start_time)!,
            status: (slot.slot_type || slot.status) as 'available' | 'private' | 'unspecified',
            notes: slot.notes,
            syncStatus: 'synced',
            showBorder: false
          });
        }
      });

      if (isGoogleAuthenticated && googleEvents.length > 0) {
        console.log(`LOV_DEBUG_CALENDAR_DATA: Processing ${googleEvents.length} Google Calendar events`);
        
        // Log first few events for debugging
        googleEvents.slice(0, 3).forEach((event, idx) => {
          console.log(`LOV_DEBUG_CALENDAR_DATA: Google event ${idx} preview:`, {
            id: event.id,
            summary: event.summary,
            start: event.start?.dateTime,
            end: event.end?.dateTime
          });
        });
        
        // Process Google Calendar events FIRST
        newCalendarData = processGoogleEvents(newCalendarData, googleEvents, days);
        
        // Create Google events map for future sessions processing
        const googleEventsMap = createGoogleEventsMap(googleEvents);
        console.log(`LOV_DEBUG_CALENDAR_DATA: Created Google events map with ${googleEventsMap.size} entries`);
        
        // Process future sessions AFTER Google events - this is critical for proper flagging
        console.log(`LOV_DEBUG_CALENDAR_DATA: Processing future sessions with Google Calendar integration`);
        newCalendarData = processFutureSessions(newCalendarData, bookedSlots, googleEventsMap);
      } else {
        console.log(`LOV_DEBUG_CALENDAR_DATA: No Google Calendar integration or events. Auth status: ${isGoogleAuthenticated}, events count: ${googleEvents.length}`);
        // Process future sessions without Google Calendar integration
        const emptyGoogleEventsMap = new Map<string, GoogleCalendarEvent>();
        newCalendarData = processFutureSessions(newCalendarData, bookedSlots, emptyGoogleEventsMap);
      }
      
      console.log('LOV_DEBUG_CALENDAR_DATA: Calendar data processing complete');
      
      // Debug: Check if any data was generated
      let totalSlots = 0;
      let availableCount = 0;
      let bookedCount = 0;
      let googleCount = 0;
      let futureSessionsCount = 0;
      
      newCalendarData.forEach((dayMap, date) => {
        dayMap.forEach((slot, hour) => {
          totalSlots++;
          if (slot.status === 'available') availableCount++;
          if (slot.status === 'booked') bookedCount++;
          if (slot.fromGoogle) googleCount++;
          if (slot.fromFutureSession) futureSessionsCount++;
          
          // Log specific debug info for future sessions
          if (slot.fromFutureSession) {
            console.log(`FUTURE_SESSION_DEBUG: Found future session at ${date} ${hour}:`, {
              notes: slot.notes,
              fromFutureSession: slot.fromFutureSession,
              inGoogleCalendar: slot.inGoogleCalendar,
              futureSession: slot.futureSession
            });
          }
        });
      });
      
      console.log(`LOV_DEBUG_CALENDAR_DATA: Final calendar data stats - 
        Total slots: ${totalSlots}, 
        Available: ${availableCount}, 
        Booked: ${bookedCount}, 
        Google events: ${googleCount},
        Future sessions: ${futureSessionsCount}`
      );
      
      setCalendarData(newCalendarData);
      setDebugVersion(`LOV_DEBUG_VERSION_${COMPONENT_VERSION}_${new Date().toISOString()}`);
      console.log(`LOV_DEBUG_CALENDAR_DATA: State updated with new calendar data, debug version: ${debugVersion}`);
      
    } catch (error: any) {
      console.error('LOV_DEBUG_CALENDAR_DATA: Error fetching calendar data:', error);
      toast({
        title: 'שגיאה בטעינת נתוני יומן',
        description: error.message,
        variant: 'destructive',
      });
      
      setCalendarData(generateEmptyCalendarData(currentDate));
    } finally {
      setIsLoading(false);
      console.log('LOV_DEBUG_CALENDAR_DATA: Finished loading calendar data');
    }
  };

  useEffect(() => {
    console.log(`LOV_DEBUG_CALENDAR_DATA: useEffect triggered with dependencies: 
      currentDate: ${currentDate}, 
      googleEvents count: ${googleEvents.length}, 
      isGoogleAuthenticated: ${isGoogleAuthenticated}`
    );
    fetchAvailabilityData();
    
    // Return cleanup function
    return () => {
      console.log('LOV_DEBUG_CALENDAR_DATA: Cleanup function called');
    };
  }, [currentDate, googleEvents, isGoogleAuthenticated]);

  return {
    calendarData,
    setCalendarData,
    isLoading,
    fetchAvailabilityData,
    debugVersion // Add debug version to the return object
  };
}
