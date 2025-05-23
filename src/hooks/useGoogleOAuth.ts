
import { useState, useEffect, useRef } from 'react';
import { 
  checkIfSignedIn, 
  signInWithGoogle, 
  signOutFromGoogle,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  GoogleOAuthState
} from '@/services/GoogleOAuthService';
import { toast } from '@/components/ui/use-toast';
import { GoogleCalendarEvent } from '@/types/calendar';
import { persistAuthState, getPersistedAuthState } from '@/utils/cookieUtils';
import { isEqual, addDays, startOfWeek } from 'date-fns';

// Hook version for debugging
const HOOK_VERSION = "1.1.0"; // Updated version
console.log(`LOV_DEBUG_GOOGLE_OAUTH_HOOK: Hook loaded, version ${HOOK_VERSION}`);

// Cache types
interface EventCache {
  events: GoogleCalendarEvent[];
  fetchDate: Date;
  startDate: Date;
  endDate: Date;
}

export function useGoogleOAuth() {
  const [state, setState] = useState<GoogleOAuthState>({
    isAuthenticated: getPersistedAuthState().isAuthenticated, // Extract the boolean from the object
    isAuthenticating: true,
    error: null
  });
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);
  
  // Event cache reference - stored in ref to persist between renders without triggering re-renders
  const eventCacheRef = useRef<EventCache | null>(null);
  // Track if we've done the initial fetch
  const hasInitialFetchRef = useRef<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        setState(prev => ({ ...prev, isAuthenticating: true }));
        
        const isSignedIn = await checkIfSignedIn();
        console.log('Google OAuth initialized, signed in:', isSignedIn);
        
        setState({
          isAuthenticated: isSignedIn,
          isAuthenticating: false,
          error: null
        });
        
        // Only fetch events on initial load, without checking the cache
        if (isSignedIn && !hasInitialFetchRef.current) {
          console.log('User is signed in to Google, doing initial event fetch');
          hasInitialFetchRef.current = true;
          fetchEvents();
        }
      } catch (error: any) {
        console.error('Google OAuth initialization error:', error);
        setState({
          isAuthenticated: false,
          isAuthenticating: false,
          error: error.message
        });
      }
    };
    
    initialize();
    
    // Modify visibility change handler to not automatically fetch events
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[auth] Page became visible, checking Google auth state (but NOT refetching events)');
        // Only check authentication status, don't fetch events
        checkIfSignedIn().then((isSignedIn) => {
          if (state.isAuthenticated !== isSignedIn) {
            setState(prev => ({ ...prev, isAuthenticated: isSignedIn }));
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Check if the requested date range is already in cache
  const isDateInCache = (requestDate?: Date): boolean => {
    if (!eventCacheRef.current || !requestDate) return false;
    
    const cache = eventCacheRef.current;
    
    // If cache is less than 15 minutes old, use it
    const cacheAge = new Date().getTime() - cache.fetchDate.getTime();
    const cacheMaxAge = 15 * 60 * 1000; // 15 minutes
    if (cacheAge > cacheMaxAge) {
      console.log('LOV_DEBUG_GOOGLE_OAUTH_HOOK: Cache expired, will fetch new data');
      return false;
    }
    
    // Get the week range for the requested date
    const weekStart = startOfWeek(requestDate, { weekStartsOn: 0 });
    const weekEnd = addDays(weekStart, 7);
    
    // Check if this range is within our cached range
    const isWithinCache = weekStart >= cache.startDate && weekEnd <= cache.endDate;
    
    if (isWithinCache) {
      console.log('LOV_DEBUG_GOOGLE_OAUTH_HOOK: Requested date range is in cache', {
        requestedWeekStart: weekStart,
        requestedWeekEnd: weekEnd,
        cacheStart: cache.startDate,
        cacheEnd: cache.endDate
      });
    } else {
      console.log('LOV_DEBUG_GOOGLE_OAUTH_HOOK: Requested date range is NOT in cache', {
        requestedWeekStart: weekStart,
        requestedWeekEnd: weekEnd,
        cacheStart: cache.startDate,
        cacheEnd: cache.endDate
      });
    }
    
    return isWithinCache;
  };

  const fetchEvents = async (currentDisplayDate?: Date, forceRefresh: boolean = false) => {
    try {
      // Check if we already have data for this date range in cache
      if (!forceRefresh && isDateInCache(currentDisplayDate)) {
        console.log('LOV_DEBUG_GOOGLE_OAUTH_HOOK: Using cached events');
        return eventCacheRef.current?.events || [];
      }
      
      setIsLoadingEvents(true);
      console.log('LOV_DEBUG_GOOGLE_OAUTH_HOOK: Starting to fetch Google Calendar events', 
        currentDisplayDate ? `for date: ${currentDisplayDate.toISOString()}` : '', 
        forceRefresh ? '(force refresh)' : '');
      
      const calendarEvents = await fetchGoogleCalendarEvents(currentDisplayDate);
      setEvents(calendarEvents);
      
      // Update the cache
      if (currentDisplayDate) {
        const weekStart = startOfWeek(currentDisplayDate, { weekStartsOn: 0 });
        const twoMonthsLater = addDays(weekStart, 60); // Approximately 2 months
        
        eventCacheRef.current = {
          events: calendarEvents,
          fetchDate: new Date(),
          startDate: weekStart,
          endDate: twoMonthsLater
        };
        
        console.log('LOV_DEBUG_GOOGLE_OAUTH_HOOK: Updated event cache:', {
          eventCount: calendarEvents.length,
          fetchDate: new Date().toISOString(),
          startDate: weekStart.toISOString(),
          endDate: twoMonthsLater.toISOString()
        });
      }
      
      console.log(`LOV_DEBUG_GOOGLE_OAUTH_HOOK: Fetched ${calendarEvents.length} Google Calendar events`);
      
      if (calendarEvents.length > 0) {
        // לוג מפורט של האירועים הראשונים
        calendarEvents.slice(0, 3).forEach((event, idx) => {
          console.log(`Event ${idx + 1}:`, {
            summary: event.summary,
            start: event.start?.dateTime,
            end: event.end?.dateTime,
            description: event.description?.substring(0, 30) + '...' || 'No description'
          });
        });
        
        toast({
          title: 'אירועי יומן Google נטענו',
          description: `נטענו ${calendarEvents.length} אירועים מיומן Google`,
        });
      } else {
        console.log('No Google Calendar events found');
        toast({
          title: 'לא נמצאו אירועים',
          description: 'לא נמצאו אירועים ביומן Google',
        });
      }
      
      return calendarEvents;
    } catch (error: any) {
      console.error('Error fetching Google Calendar events:', error);
      toast({
        title: 'שגיאה בטעינת אירועי יומן',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const createEvent = async (
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description: string = '',
  ) => {
    try {
      console.log(`LOV_DEBUG_GOOGLE_OAUTH_HOOK: Creating event "${summary}" from ${startDateTime} to ${endDateTime}`);
      setIsCreatingEvent(true);
      
      const eventId = await createGoogleCalendarEvent(summary, startDateTime, endDateTime, description);
      
      if (eventId) {
        console.log(`LOV_DEBUG_GOOGLE_OAUTH_HOOK: Event created with ID: ${eventId}`);
        // Refresh events to include the newly created one, with force refresh
        await fetchEvents(undefined, true);
        
        toast({
          title: 'האירוע נוצר בהצלחה',
          description: 'האירוע נוסף ליומן Google שלך',
        });
        return eventId;
      } else {
        console.log(`LOV_DEBUG_GOOGLE_OAUTH_HOOK: Event creation failed, no ID returned`);
        throw new Error('לא הצלחנו ליצור את האירוע ביומן');
      }
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      toast({
        title: 'שגיאה ביצירת האירוע',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const signIn = async () => {
    try {
      setState(prev => ({ ...prev, isAuthenticating: true, error: null }));
      
      const success = await signInWithGoogle();
      
      setState({
        isAuthenticated: success,
        isAuthenticating: false,
        error: success ? null : 'שגיאה בהתחברות ל-Google'
      });
      
      // Persist authentication state
      persistAuthState(success);
      
      if (success) {
        toast({
          title: 'התחברת בהצלחה ליומן גוגל',
          description: 'מתחיל בטעינת אירועי יומן...',
        });
      } else {
        toast({
          title: 'ההתחברות ליומן גוגל נכשלה',
          description: 'לא הצלחנו לקבל הרשאות ליומן שלך',
          variant: 'destructive',
        });
      }
      
      return success;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setState({
        isAuthenticated: false,
        isAuthenticating: false,
        error: error.message
      });
      
      // Clear persisted state on error
      persistAuthState(false);
      
      const errorMessage = error.message || 'שגיאה בהתחברות ל-Google';
      
      if (errorMessage.includes('בוטל') || errorMessage === 'ההתחברות בוטלה') {
        toast({
          title: 'ההתחברות בוטלה',
          description: 'תהליך ההתחברות לגוגל בוטל',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'ההתחברות ליומן גוגל נכשלה',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return false;
    }
  };

  const signOut = async () => {
    try {
      await signOutFromGoogle();
      setEvents([]);
      setState({
        isAuthenticated: false,
        isAuthenticating: false,
        error: null
      });
      
      // Clear persisted state and cache
      persistAuthState(false);
      eventCacheRef.current = null;
      
      toast({
        title: 'התנתקת מיומן גוגל',
        description: 'המידע מיומן Google נמחק',
      });
    } catch (error: any) {
      console.error('Google sign-out error:', error);
      toast({
        title: 'שגיאה בהתנתקות מיומן גוגל',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    ...state,
    events,
    isLoadingEvents,
    isCreatingEvent,
    signIn,
    signOut,
    fetchEvents,
    createEvent
  };
}
