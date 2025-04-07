
import { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';

// Debug flag
const DEBUG_HOOK = true;

export function useGoogleOAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<GoogleOAuthState>({
    isAuthenticated: false,
    isAuthenticating: true,
    error: null
  });
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        setState(prev => ({ ...prev, isAuthenticating: true }));
        
        if (DEBUG_HOOK) {
          console.log('🔄 useGoogleOAuth: Initializing and checking sign-in status');
        }
        
        const isSignedIn = await checkIfSignedIn();
        
        if (DEBUG_HOOK) {
          console.log('🔍 useGoogleOAuth: Sign-in check result:', isSignedIn);
        }
        
        setState({
          isAuthenticated: isSignedIn,
          isAuthenticating: false,
          error: null
        });
        
        if (isSignedIn) {
          if (DEBUG_HOOK) {
            console.log('✅ useGoogleOAuth: User is signed in, fetching calendar events');
          }
          fetchEvents();
        }
      } catch (error: any) {
        console.error('❌ useGoogleOAuth initialization error:', error);
        setState({
          isAuthenticated: false,
          isAuthenticating: false,
          error: error.message
        });
      }
    };
    
    initialize();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      
      if (DEBUG_HOOK) {
        console.log('📅 useGoogleOAuth: Fetching calendar events');
      }
      
      const calendarEvents = await fetchGoogleCalendarEvents();
      setEvents(calendarEvents);
      
      if (calendarEvents.length > 0) {
        if (DEBUG_HOOK) {
          console.log(`✅ useGoogleOAuth: Fetched ${calendarEvents.length} calendar events`);
        }
        
        toast({
          title: 'אירועי יומן Google נטענו',
          description: `נטענו ${calendarEvents.length} אירועים מיומן Google`,
        });
      } else {
        if (DEBUG_HOOK) {
          console.log('ℹ️ useGoogleOAuth: No calendar events found');
        }
        
        toast({
          title: 'לא נמצאו אירועים',
          description: 'לא נמצאו אירועים ביומן Google',
        });
      }
      
      return calendarEvents;
    } catch (error: any) {
      console.error('❌ useGoogleOAuth: Error fetching calendar events:', error);
      
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
      if (DEBUG_HOOK) {
        console.log('📝 useGoogleOAuth: Creating calendar event');
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
      console.error('❌ useGoogleOAuth: Error creating calendar event:', error);
      
      toast({
        title: 'שגיאה ביצירת האירוע',
        description: error.message,
        variant: 'destructive',
      });
      
      return false;
    }
  };

  const signIn = async () => {
    try {
      setState(prev => ({ ...prev, isAuthenticating: true, error: null }));
      
      if (DEBUG_HOOK) {
        console.log('🔑 useGoogleOAuth: Starting Google sign-in');
      }
      
      const success = await signInWithGoogle();
      
      if (DEBUG_HOOK) {
        console.log('ℹ️ useGoogleOAuth: Sign-in initiated, redirecting...');
      }
      
      // We won't update the state here since we're redirecting
      // The redirect handler in main.tsx will take over
      
      return success;
    } catch (error: any) {
      console.error('❌ useGoogleOAuth: Google sign-in error:', error);
      
      setState({
        isAuthenticated: false,
        isAuthenticating: false,
        error: error.message
      });
      
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
      if (DEBUG_HOOK) {
        console.log('🚪 useGoogleOAuth: Signing out');
      }
      
      await signOutFromGoogle();
      setEvents([]);
      
      setState({
        isAuthenticated: false,
        isAuthenticating: false,
        error: null
      });
      
      toast({
        title: 'התנתקת מיומן גוגל',
        description: 'המידע מיומן Google נמחק',
      });
    } catch (error: any) {
      console.error('❌ useGoogleOAuth: Google sign-out error:', error);
      
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
    signIn,
    signOut,
    fetchEvents,
    createEvent
  };
}
