
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

export function useGoogleOAuth() {
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
        console.log('Google OAuth initialized, signed in:', isSignedIn);
        
        setState({
          isAuthenticated: isSignedIn,
          isAuthenticating: false,
          error: null
        });
        
        if (isSignedIn) {
          console.log('User is signed in to Google, fetching events');
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

  const fetchEvents = async (currentDisplayDate?: Date) => {
    try {
      setIsLoadingEvents(true);
      console.log('Starting to fetch Google Calendar events', currentDisplayDate ? `for date: ${currentDisplayDate.toISOString()}` : '');
      
      const calendarEvents = await fetchGoogleCalendarEvents(currentDisplayDate);
      setEvents(calendarEvents);
      
      console.log(`Fetched ${calendarEvents.length} Google Calendar events`);
      
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
