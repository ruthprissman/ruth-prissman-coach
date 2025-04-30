
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

export function useCalendarData(
  currentDate: Date,
  googleEvents: GoogleCalendarEvent[],
  isGoogleAuthenticated: boolean
) {
  const [calendarData, setCalendarData] = useState<Map<string, Map<string, CalendarSlot>>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAvailabilityData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching calendar data for', currentDate);
      
      // Always fetch data from the beginning of the week
      const [availableSlots, bookedSlots] = await Promise.all([
        fetchAvailabilitySlots(currentDate),
        fetchBookedSessions(currentDate)
      ]);

      console.log('Generating calendar data');
      let newCalendarData = generateEmptyCalendarData(currentDate);
      const days = generateWeekDays(currentDate);
      
      // Process available slots
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
        console.log('Processing Google Calendar events', googleEvents.length);
        // Process Google Calendar events
        newCalendarData = processGoogleEvents(newCalendarData, googleEvents, days);
        
        // Create Google events map for future sessions processing
        const googleEventsMap = createGoogleEventsMap(googleEvents);
        
        // Process future sessions
        newCalendarData = processFutureSessions(newCalendarData, bookedSlots, googleEventsMap);
      } else {
        console.log('No Google Calendar integration or events');
        // Process future sessions without Google Calendar integration
        const emptyGoogleEventsMap = new Map<string, GoogleCalendarEvent>();
        newCalendarData = processFutureSessions(newCalendarData, bookedSlots, emptyGoogleEventsMap);
      }
      
      console.log('Calendar data processing complete');
      setCalendarData(newCalendarData);
      
    } catch (error: any) {
      console.error('Error fetching calendar data:', error);
      toast({
        title: 'שגיאה בטעינת נתוני יומן',
        description: error.message,
        variant: 'destructive',
      });
      
      setCalendarData(generateEmptyCalendarData(currentDate));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailabilityData();
  }, [currentDate, googleEvents, isGoogleAuthenticated]);

  return {
    calendarData,
    setCalendarData,
    isLoading,
    fetchAvailabilityData
  };
}
