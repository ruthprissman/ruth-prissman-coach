
import { useState, useEffect, useRef } from 'react';
import { 
  checkIfSignedIn, 
  signInWithGoogle, 
  signOutFromGoogle,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  GoogleOAuthState
} from '@/services/GoogleOAuthService';
import { useToast } from '@/hooks/use-toast';
import { GoogleCalendarEvent } from '@/types/calendar';
import { persistAuthState, getPersistedAuthState } from '@/utils/cookieUtils';
import { isEqual, addDays, startOfWeek } from 'date-fns';

// Hook version for debugging
const HOOK_VERSION = "1.2.1"; // Updated version with fixes
const isDevelopment = import.meta.env.DEV;

// Only log in development mode
const secureLog = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(`LOV_DEBUG_GOOGLE_OAUTH_HOOK: ${message}`, data || '');
  }
};

// Cache types
interface EventCache {
  events: GoogleCalendarEvent[];
  fetchDate: Date;
  startDate: Date;
  endDate: Date;
}

export const useGoogleOAuth = () => {
  const [state, setState] = useState<GoogleOAuthState>({
    isAuthenticated: getPersistedAuthState().isAuthenticated,
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
  
  const { toast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      try {
        setState(prev => ({ ...prev, isAuthenticating: true }));
        
        const isSignedIn = await checkIfSignedIn();
        secureLog('Google OAuth initialized, signed in:', isSignedIn);
        
        setState({
          isAuthenticated: isSignedIn,
          isAuthenticating: false,
          error: null
        });
        
        // Only fetch events on initial load, without checking the cache
        if (isSignedIn && !hasInitialFetchRef.current) {
          secureLog('User is signed in to Google, doing initial event fetch');
          hasInitialFetchRef.current = true;
          fetchEvents();
        }
      } catch (error: any) {
        console.error('Google OAuth initialization error:', error);
        setState({
          isAuthenticated: false,
          isAuthenticating: false,
          error: 'שגיאה בהתחברות לגוגל'
        });
      }
    };
    
    initialize();
    
    // Modify visibility change handler to not automatically fetch events
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        secureLog('Page became visible, checking Google auth state (but NOT refetching events)');
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
      secureLog('Cache expired, will fetch new data');
      return false;
    }
    
    // Get the week range for the requested date
    const weekStart = startOfWeek(requestDate, { weekStartsOn: 0 });
    const weekEnd = addDays(weekStart, 7);
    
    // Check if this range is within our cached range
    const isWithinCache = weekStart >= cache.startDate && weekEnd <= cache.endDate;
    
    secureLog(isWithinCache ? 'Requested date range is in cache' : 'Requested date range is NOT in cache', {
      requestedWeekStart: weekStart,
      requestedWeekEnd: weekEnd,
      cacheStart: cache.startDate,
      cacheEnd: cache.endDate
    });
    
    return isWithinCache;
  };

  const fetchEvents = async (currentDisplayDate?: Date, forceRefresh: boolean = false) => {
    try {
      // Check if we already have data for this date range in cache
      if (!forceRefresh && isDateInCache(currentDisplayDate)) {
        secureLog('Using cached events');
        return eventCacheRef.current?.events || [];
      }
      
      setIsLoadingEvents(true);
      secureLog('Starting to fetch Google Calendar events', 
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
        
        secureLog('Updated event cache:', {
          eventCount: calendarEvents.length,
          fetchDate: new Date().toISOString(),
          startDate: weekStart.toISOString(),
          endDate: twoMonthsLater.toISOString()
        });
      }
      
      secureLog(`Fetched ${calendarEvents.length} Google Calendar events`);
      
      if (calendarEvents.length > 0) {
        toast({
          title: 'אירועי יומן Google נטענו',
          description: `נטענו ${calendarEvents.length} אירועים מיומן Google`,
        });
      } else {
        secureLog('No Google Calendar events found');
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
        description: 'לא ניתן לטעון את אירועי היומן כעת',
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
      secureLog(`Creating event "${summary}" from ${startDateTime} to ${endDateTime}`);
      setIsCreatingEvent(true);
      
      const eventId = await createGoogleCalendarEvent(summary, startDateTime, endDateTime, description);
      
      if (eventId) {
        secureLog(`Event created with ID: ${eventId}`);
        // Refresh events to include the newly created one, with force refresh
        await fetchEvents(undefined, true);
        
        toast({
          title: 'האירוע נוצר בהצלחה',
          description: 'האירוע נוסף ליומן Google שלך',
        });
        return eventId;
      } else {
        secureLog('Event creation failed, no ID returned');
        throw new Error('לא הצלחנו ליצור את האירוע ביומן');
      }
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      toast({
        title: 'שגיאה ביצירת האירוע',
        description: error.message || 'אירעה שגיאה ביצירת האירוע',
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
        error: 'שגיאה בהתחברות ל-Google'
      });
      
      toast({
        title: 'שגיאה בהתחברות',
        description: error.message || 'אירעה שגיאה בהתחברות ל-Google',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isAuthenticating: true }));
      
      await signOutFromGoogle();
      
      setState({
        isAuthenticated: false,
        isAuthenticating: false,
        error: null
      });
      
      // Clear persisted state
      persistAuthState(false);
      
      // Clear events
      setEvents([]);
      eventCacheRef.current = null;
      
      toast({
        title: 'התנתקת בהצלחה',
        description: 'התנתקת מיומן Google',
      });
      
      return true;
    } catch (error: any) {
      console.error('Google sign-out error:', error);
      setState(prev => ({ ...prev, isAuthenticating: false }));
      
      toast({
        title: 'שגיאה בהתנתקות',
        description: 'אירעה שגיאה בהתנתקות מ-Google',
        variant: 'destructive',
      });
      
      return false;
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
    createEvent,
  };
}
