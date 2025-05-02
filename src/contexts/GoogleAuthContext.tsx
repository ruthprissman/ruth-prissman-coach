
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  checkIfSignedIn, 
  signInWithGoogle, 
  signOutFromGoogle, 
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
} from '@/services/GoogleOAuthService';
import { toast } from '@/components/ui/use-toast';
import { getPersistedAuthState } from '@/utils/cookieUtils';
import { GoogleCalendarEvent } from '@/types/calendar';
import { supabaseClient } from '@/lib/supabaseClient';
import { Provider } from '@supabase/supabase-js';

// Define the shape of our context state
interface GoogleAuthContextType {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isLoadingEvents: boolean;
  events: GoogleCalendarEvent[];
  error: string | null;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  fetchEvents: (currentDisplayDate?: Date) => Promise<GoogleCalendarEvent[]>;
  createEvent: (
    summary: string, 
    startDateTime: string, 
    endDateTime: string, 
    description?: string
  ) => Promise<boolean>;
  debugInfo: {
    lastChecked: string;
    authSource: 'session' | 'none';
    stateVersion: number;
    lastEventFetch: string | null;
    tokenExpiryTime: string | null;
  };
}

// Create the context with a default value
const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

// Custom hook to use the context
export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
}

// Track last fetch time globally to prevent excessive fetches
let lastFetchTime = 0;
const FETCH_COOLDOWN_MS = 30000; // Increased to 30 seconds cooldown

// Provider component
interface GoogleAuthProviderProps {
  children: ReactNode;
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  // State for tracking auth
  const [state, setState] = useState({
    isAuthenticated: false, // Initialize as false, we'll check with Supabase directly
    isAuthenticating: true,
    error: null as string | null,
    events: [] as GoogleCalendarEvent[],
    isLoadingEvents: false,
    debugInfo: {
      lastChecked: new Date().toISOString(),
      authSource: 'none' as 'session' | 'none',
      stateVersion: 1,
      lastEventFetch: null as string | null,
      tokenExpiryTime: null as string | null
    }
  });
  
  // Check token expiration and refresh if needed
  const checkAndRefreshToken = useCallback(async (forceRefresh = false): Promise<boolean> => {
    try {
      console.log('[GoogleAuthContext] Checking token validity');
      
      // Get current session from Supabase
      const supabase = supabaseClient();
      const { data } = await supabase.auth.getSession();
      
      if (!data.session?.provider_token) {
        console.log('[GoogleAuthContext] No provider token found in session');
        return false;
      }
      
      // If we have a token, consider the user authenticated
      const isAuthenticated = !!data.session?.provider_token;
      
      if (isAuthenticated) {
        // Check if we need to refresh the token
        // For Google OAuth, we don't need to manually decode the token
        // Just refresh if forced or periodically
        if (forceRefresh) {
          console.log('[GoogleAuthContext] Force refreshing token');
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('[GoogleAuthContext] Error refreshing session:', refreshError);
            throw refreshError;
          }
          
          // Get updated session
          const { data: refreshedData } = await supabase.auth.getSession();
          
          // Update token expiry time in debug info
          setState(prev => ({
            ...prev,
            isAuthenticated: !!refreshedData.session?.provider_token,
            debugInfo: {
              ...prev.debugInfo,
              lastChecked: new Date().toISOString(),
              authSource: refreshedData.session?.provider_token ? 'session' : 'none',
              tokenExpiryTime: new Date(Date.now() + 3600000).toISOString() // Approximate 1 hour expiry
            }
          }));
          
          return !!refreshedData.session?.provider_token;
        }
        
        // Update state with info
        setState(prev => ({
          ...prev,
          isAuthenticated,
          isAuthenticating: false,
          error: null,
          debugInfo: {
            ...prev.debugInfo,
            lastChecked: new Date().toISOString(),
            authSource: 'session',
            tokenExpiryTime: new Date(Date.now() + 3600000).toISOString() // Approximate 1 hour expiry
          }
        }));
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isAuthenticating: false,
          debugInfo: {
            ...prev.debugInfo,
            lastChecked: new Date().toISOString(),
            authSource: 'none',
            tokenExpiryTime: null
          }
        }));
      }
      
      return isAuthenticated;
    } catch (error: any) {
      console.error('[GoogleAuthContext] Error checking/refreshing token:', error);
      
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isAuthenticating: false,
        error: `שגיאה בבדיקת הטוקן: ${error.message}`,
        debugInfo: {
          ...prev.debugInfo,
          lastChecked: new Date().toISOString(),
          authSource: 'none',
          tokenExpiryTime: null
        }
      }));
      
      return false;
    }
  }, []);
  
  // Load auth state on mount - now using Supabase session directly
  useEffect(() => {
    console.log("[GoogleAuthContext] Initializing auth state");
    
    const checkAuthState = async () => {
      try {
        // Check if we've checked auth recently to prevent excessive checks
        const now = Date.now();
        const lastCheckedTime = new Date(state.debugInfo.lastChecked).getTime();
        if (now - lastCheckedTime < 5000 && state.debugInfo.stateVersion > 1) {
          console.log('[GoogleAuthContext] Skipping auth check, checked recently');
          return;
        }
        
        setState(prev => ({ 
          ...prev, 
          isAuthenticating: true,
          debugInfo: {
            ...prev.debugInfo,
            lastChecked: new Date().toISOString(),
            stateVersion: prev.debugInfo.stateVersion + 1
          }
        }));
        
        // Use the token check function which relies directly on Supabase session
        const isAuthenticated = await checkAndRefreshToken();
        console.log('[GoogleAuthContext] Auth check result:', isAuthenticated);
        
        setState(prev => ({
          ...prev,
          isAuthenticated,
          isAuthenticating: false,
          error: null,
          debugInfo: {
            ...prev.debugInfo,
            authSource: isAuthenticated ? 'session' : 'none',
            lastChecked: new Date().toISOString()
          }
        }));
      } catch (error: any) {
        console.error('[GoogleAuthContext] Error checking auth state:', error);
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isAuthenticating: false,
          error: error.message,
          debugInfo: {
            ...prev.debugInfo,
            lastChecked: new Date().toISOString(),
            authSource: 'none'
          }
        }));
      }
    };
    
    checkAuthState();
    
    // Add visibility change listener to recheck auth when the page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[GoogleAuthContext] Page became visible, rechecking auth state');
        checkAuthState();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set an interval to periodically refresh token in the background
    const tokenRefreshInterval = setInterval(() => {
      if (state.isAuthenticated) {
        console.log('[GoogleAuthContext] Periodic token refresh check');
        checkAndRefreshToken(true);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(tokenRefreshInterval);
    };
  }, [checkAndRefreshToken, state.debugInfo.lastChecked, state.debugInfo.stateVersion, state.isAuthenticated]);
  
  // Sign in - modified to use Supabase session directly
  const signIn = async () => {
    try {
      setState(prev => ({ 
        ...prev, 
        isAuthenticating: true, 
        error: null,
        debugInfo: {
          ...prev.debugInfo,
          lastChecked: new Date().toISOString(),
          stateVersion: prev.debugInfo.stateVersion + 1
        }
      }));
      
      const success = await signInWithGoogle();
      
      console.log('[GoogleAuthContext] Sign in result:', success);
      
      // After sign-in, check token validity immediately
      await checkAndRefreshToken();
      
      if (state.isAuthenticated) {
        toast({
          title: 'התחברת בהצלחה ליומן גוגל',
          description: 'מתחיל בטעינת אירועי יומן...',
        });
        
        // Don't auto-fetch events to avoid loops
        // Let the component request them explicitly
      } else {
        toast({
          title: 'ההתחברות ליומן גוגל נכשלה',
          description: 'לא הצלחנו לקבל הרשאות ליומן שלך',
          variant: 'destructive',
        });
      }
      
      return state.isAuthenticated;
    } catch (error: any) {
      console.error('[GoogleAuthContext] Google sign-in error:', error);
      
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isAuthenticating: false,
        error: error.message,
        debugInfo: {
          ...prev.debugInfo,
          authSource: 'none',
          lastChecked: new Date().toISOString()
        }
      }));
      
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
  
  // Sign out - improved to clear all state
  const signOut = async () => {
    try {
      await signOutFromGoogle();
      
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isAuthenticating: false,
        error: null,
        events: [],
        debugInfo: {
          ...prev.debugInfo,
          authSource: 'none',
          lastChecked: new Date().toISOString(),
          stateVersion: prev.debugInfo.stateVersion + 1,
          tokenExpiryTime: null
        }
      }));
      
      toast({
        title: 'התנתקת מיומן גוגל',
        description: 'המידע מיומן Google נמחק',
      });
    } catch (error: any) {
      console.error('[GoogleAuthContext] Google sign-out error:', error);
      toast({
        title: 'שגיאה בהתנתקות מיומן גוגל',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  // Fetch events with debouncing and improved error handling
  const fetchEvents = async (currentDisplayDate?: Date) => {
    try {
      // First, make sure token is valid
      const isValid = await checkAndRefreshToken(true);
      
      if (!isValid) {
        toast({
          title: 'אין הרשאות ליומן Google',
          description: 'יש להתחבר מחדש לחשבון Google',
          variant: 'destructive',
        });
        return [];
      }
      
      // Check if we've fetched events recently to prevent excessive fetches
      const now = Date.now();
      if (now - lastFetchTime < FETCH_COOLDOWN_MS) {
        console.log(`[GoogleAuthContext] Skipping fetch, cooldown active (${Math.round((FETCH_COOLDOWN_MS - (now - lastFetchTime))/1000)}s remaining)`);
        toast({
          title: 'בקשה נדחתה',
          description: `יש להמתין ${Math.round((FETCH_COOLDOWN_MS - (now - lastFetchTime))/1000)} שניות בין סנכרונים`,
        });
        return state.events; // Return current events instead of fetching again
      }
      
      setState(prev => ({ 
        ...prev, 
        isLoadingEvents: true,
        debugInfo: {
          ...prev.debugInfo,
          lastEventFetch: new Date().toISOString()
        }
      }));
      
      console.log('[GoogleAuthContext] Starting to fetch Google Calendar events', 
        currentDisplayDate ? `for date: ${currentDisplayDate.toISOString()}` : '');
      
      lastFetchTime = now; // Update last fetch time
      const calendarEvents = await fetchGoogleCalendarEvents(currentDisplayDate);
      
      console.log(`[GoogleAuthContext] Fetched ${calendarEvents.length} Google Calendar events`);
      
      setState(prev => ({ 
        ...prev, 
        events: calendarEvents, 
        isLoadingEvents: false,
        debugInfo: {
          ...prev.debugInfo,
          lastChecked: new Date().toISOString(),
          lastEventFetch: new Date().toISOString()
        }
      }));
      
      if (calendarEvents.length > 0) {
        toast({
          title: 'אירועי יומן Google נטענו',
          description: `נטענו ${calendarEvents.length} אירועים מיומן Google`,
        });
      } else {
        toast({
          title: 'לא נמצאו אירועים',
          description: 'לא נמצאו אירועים ביומן Google',
        });
      }
      
      return calendarEvents;
    } catch (error: any) {
      console.error('[GoogleAuthContext] Error fetching Google Calendar events:', error);
      
      // If we get an auth error, update the auth state and try to refresh
      if (error.message?.includes('אין הרשאות') || 
          error.message?.includes('token') ||
          error.message?.includes('unauthorized')) {
          
        console.log('[GoogleAuthContext] Detected auth error, attempting refresh');
        
        // Try to refresh the token
        const refreshed = await checkAndRefreshToken(true);
        
        if (!refreshed) {
          setState(prev => ({ 
            ...prev, 
            isAuthenticated: false,
            error: 'פג תוקף ההרשאות ליומן Google. יש להתחבר מחדש.',
            isLoadingEvents: false,
            debugInfo: {
              ...prev.debugInfo,
              authSource: 'none',
              lastChecked: new Date().toISOString(),
              tokenExpiryTime: null
            }
          }));
          
          toast({
            title: 'פג תוקף ההרשאות',
            description: 'יש להתחבר שוב לחשבון Google',
            variant: 'destructive',
          });
        } else {
          // If refresh worked, try fetching again, but don't create infinite loop
          setState(prev => ({ 
            ...prev, 
            isLoadingEvents: false,
            debugInfo: {
              ...prev.debugInfo,
              lastEventFetch: new Date().toISOString()
            }
          }));
          
          toast({
            title: 'רענון הרשאות',
            description: 'ההרשאות חודשו, נסה שוב לטעון אירועים',
          });
        }
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoadingEvents: false,
          debugInfo: {
            ...prev.debugInfo,
            lastEventFetch: new Date().toISOString()
          }
        }));
        
        toast({
          title: 'שגיאה בטעינת אירועי יומן',
          description: error.message,
          variant: 'destructive',
        });
      }
      
      return [];
    }
  };
  
  // Create event with improved token handling
  const createEvent = async (
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description: string = '',
  ) => {
    try {
      // Make sure token is valid first
      const isValid = await checkAndRefreshToken(true);
      
      if (!isValid) {
        toast({
          title: 'אין הרשאות ליומן Google',
          description: 'יש להתחבר מחדש לחשבון Google',
          variant: 'destructive',
        });
        return false;
      }
      
      const eventId = await createGoogleCalendarEvent(summary, startDateTime, endDateTime, description);
      if (eventId) {
        await fetchEvents();
        
        toast({
          title: 'האירוע נוצר בהצלחה',
          description: 'האירוע נוסף ליומן Google שלך',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('[GoogleAuthContext] Error creating calendar event:', error);
      
      // If we get an auth error, update the auth state
      if (error.message?.includes('אין הרשאות') || 
          error.message?.includes('token') ||
          error.message?.includes('unauthorized')) {
          
        // Try to refresh the token
        const refreshed = await checkAndRefreshToken(true);
        
        if (!refreshed) {
          setState(prev => ({ 
            ...prev, 
            isAuthenticated: false,
            error: error.message,
            debugInfo: {
              ...prev.debugInfo,
              authSource: 'none',
              lastChecked: new Date().toISOString(),
              tokenExpiryTime: null
            }
          }));
          
          toast({
            title: 'פג תוקף ההרשאות',
            description: 'יש להתחבר שוב לחשבון Google',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'רענון הרשאות',
            description: 'ההרשאות חודשו, נסה שוב ליצור אירוע',
          });
        }
      } else {
        toast({
          title: 'שגיאה ביצירת האירוע',
          description: error.message,
          variant: 'destructive',
        });
      }
      return false;
    }
  };
  
  const contextValue = {
    isAuthenticated: state.isAuthenticated,
    isAuthenticating: state.isAuthenticating,
    isLoadingEvents: state.isLoadingEvents,
    events: state.events,
    error: state.error,
    signIn,
    signOut,
    fetchEvents,
    createEvent,
    debugInfo: state.debugInfo
  };
  
  return (
    <GoogleAuthContext.Provider value={contextValue}>
      {children}
    </GoogleAuthContext.Provider>
  );
}
