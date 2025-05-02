
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  checkIfSignedIn, 
  signInWithGoogle, 
  signOutFromGoogle, 
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
} from '@/services/GoogleOAuthService';
import { toast } from '@/components/ui/use-toast';
import { persistAuthState, getPersistedAuthState } from '@/utils/cookieUtils';
import { GoogleCalendarEvent } from '@/types/calendar';

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
    authSource: 'cookie' | 'localStorage' | 'session' | 'none';
    stateVersion: number;
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

// Provider component
interface GoogleAuthProviderProps {
  children: ReactNode;
}

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  // State for tracking auth
  const [state, setState] = useState({
    isAuthenticated: getPersistedAuthState(),
    isAuthenticating: true,
    error: null as string | null,
    events: [] as GoogleCalendarEvent[],
    isLoadingEvents: false,
    debugInfo: {
      lastChecked: new Date().toISOString(),
      authSource: getPersistedAuthState() ? 'localStorage' : 'none' as 'cookie' | 'localStorage' | 'session' | 'none',
      stateVersion: 1
    }
  });
  
  // Load auth state on mount
  useEffect(() => {
    console.log("[GoogleAuthContext] Initializing auth state");
    
    const checkAuthState = async () => {
      try {
        setState(prev => ({ 
          ...prev, 
          isAuthenticating: true,
          debugInfo: {
            ...prev.debugInfo,
            lastChecked: new Date().toISOString(),
            stateVersion: prev.debugInfo.stateVersion + 1
          }
        }));
        
        const isSignedIn = await checkIfSignedIn();
        console.log('[GoogleAuthContext] Initial auth check result:', isSignedIn);
        
        let authSource: 'cookie' | 'localStorage' | 'session' | 'none' = 'none';
        if (isSignedIn) {
          authSource = 'session';
        } else if (getPersistedAuthState()) {
          authSource = 'localStorage';
        }
        
        setState(prev => ({
          ...prev,
          isAuthenticated: isSignedIn,
          isAuthenticating: false,
          error: null,
          debugInfo: {
            ...prev.debugInfo,
            authSource,
            lastChecked: new Date().toISOString()
          }
        }));
        
        if (isSignedIn) {
          console.log('[GoogleAuthContext] User is signed in, fetching events');
          fetchEvents();
        }
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
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Sign in
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
      
      setState(prev => ({
        ...prev,
        isAuthenticated: success,
        isAuthenticating: false,
        error: success ? null : 'שגיאה בהתחברות ל-Google',
        debugInfo: {
          ...prev.debugInfo,
          authSource: success ? 'session' : 'none',
          lastChecked: new Date().toISOString()
        }
      }));
      
      // Persist authentication state
      persistAuthState(success);
      
      if (success) {
        toast({
          title: 'התחברת בהצלחה ליומן גוגל',
          description: 'מתחיל בטעינת אירועי יומן...',
        });
        
        // Fetch events
        await fetchEvents();
      } else {
        toast({
          title: 'ההתחברות ליומן גוגל נכשלה',
          description: 'לא הצלחנו לקבל הרשאות ליומן שלך',
          variant: 'destructive',
        });
      }
      
      return success;
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
  
  // Sign out
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
          stateVersion: prev.debugInfo.stateVersion + 1
        }
      }));
      
      // Clear persisted state
      persistAuthState(false);
      
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
  
  // Fetch events
  const fetchEvents = async (currentDisplayDate?: Date) => {
    try {
      setState(prev => ({ ...prev, isLoadingEvents: true }));
      
      console.log('[GoogleAuthContext] Starting to fetch Google Calendar events', 
        currentDisplayDate ? `for date: ${currentDisplayDate.toISOString()}` : '');
      
      const calendarEvents = await fetchGoogleCalendarEvents(currentDisplayDate);
      
      console.log(`[GoogleAuthContext] Fetched ${calendarEvents.length} Google Calendar events`);
      
      setState(prev => ({ 
        ...prev, 
        events: calendarEvents, 
        isLoadingEvents: false,
        debugInfo: {
          ...prev.debugInfo,
          lastChecked: new Date().toISOString()
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
      
      // If we get an auth error, update the auth state
      if (error.message?.includes('אין הרשאות') || 
          error.message?.includes('token') ||
          error.message?.includes('unauthorized')) {
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: false,
          error: error.message,
          isLoadingEvents: false,
          debugInfo: {
            ...prev.debugInfo,
            authSource: 'none',
            lastChecked: new Date().toISOString()
          }
        }));
        
        // Clear persisted state
        persistAuthState(false);
      } else {
        setState(prev => ({ ...prev, isLoadingEvents: false }));
      }
      
      toast({
        title: 'שגיאה בטעינת אירועי יומן',
        description: error.message,
        variant: 'destructive',
      });
      
      return [];
    }
  };
  
  // Create event
  const createEvent = async (
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description: string = '',
  ) => {
    try {
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
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: false,
          error: error.message,
          debugInfo: {
            ...prev.debugInfo,
            authSource: 'none',
            lastChecked: new Date().toISOString()
          }
        }));
        
        // Clear persisted state
        persistAuthState(false);
      }
      
      toast({
        title: 'שגיאה ביצירת האירוע',
        description: error.message,
        variant: 'destructive',
      });
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
