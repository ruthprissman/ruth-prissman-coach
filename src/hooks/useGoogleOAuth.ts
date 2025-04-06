
import { useState, useEffect } from 'react';
import { 
  initGoogleAuth, 
  checkIfSignedIn, 
  signInWithGoogle, 
  signOutFromGoogle,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  GoogleOAuthState
} from '@/services/GoogleOAuthService';
import { toast } from '@/components/ui/use-toast';
import { GoogleCalendarEvent } from '@/types/calendar';

export function useGoogleOAuth() {
  const [state, setState] = useState<GoogleOAuthState>({
    isAuthenticated: false,
    isAuthenticating: true,
    error: null
  });
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);

  // Initialize and check the sign-in status on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setState(prev => ({ ...prev, isAuthenticating: true }));
        
        // Initialize Google Auth
        await initGoogleAuth();
        
        // Check if already signed in
        const isSignedIn = await checkIfSignedIn();
        
        setState({
          isAuthenticated: isSignedIn,
          isAuthenticating: false,
          error: null
        });
        
        // Fetch events if already signed in
        if (isSignedIn) {
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
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      const calendarEvents = await fetchGoogleCalendarEvents();
      setEvents(calendarEvents);
      
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
      const eventId = await createGoogleCalendarEvent(summary, startDateTime, endDateTime, description);
      if (eventId) {
        // Refresh events list after creating a new event
        await fetchEvents();
        
        toast({
          title: 'האירוע נוצר בהצלחה',
          description: 'האירוע נוסף ליומן Google שלך',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
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
      const success = await signInWithGoogle();
      
      setState({
        isAuthenticated: success,
        isAuthenticating: false,
        error: success ? null : 'שגיאה בהתחברות ל-Google'
      });
      
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
      
      const errorMessage = error.message || 'שגיאה בהתחברות ל-Google';
      
      // Handle cancellation specifically
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
    signIn,
    signOut,
    fetchEvents,
    createEvent
  };
}
