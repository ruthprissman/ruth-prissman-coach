
import { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';

export function useGoogleOAuth() {
  const navigate = useNavigate();
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
        
        const isSignedIn = await checkIfSignedIn();
        console.log('Google OAuth init check - isSignedIn:', isSignedIn);
        
        setState({
          isAuthenticated: isSignedIn,
          isAuthenticating: false,
          error: null
        });
        
        if (isSignedIn) {
          console.log('User is signed in to Google, fetching calendar events');
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
      console.log('Fetching Google Calendar events...');
      const calendarEvents = await fetchGoogleCalendarEvents();
      setEvents(calendarEvents);
      
      if (calendarEvents.length > 0) {
        console.log(`Fetched ${calendarEvents.length} Google Calendar events`);
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
      console.log('Starting Google sign-in process...');
      
      const success = await signInWithGoogle();
      
      // This code will only run if the OAuth flow returns directly (not after redirect)
      console.log('Google sign-in result:', success);
      setState({
        isAuthenticated: success,
        isAuthenticating: false,
        error: success ? null : 'שגיאה בהתחברות ל-Google'
      });
      
      return success;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
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
