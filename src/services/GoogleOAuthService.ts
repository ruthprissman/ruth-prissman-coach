
import { GoogleCalendarEvent } from '@/types/calendar';
import { supabase } from '@/lib/supabase';
import { getDashboardRedirectUrl, saveEnvironmentForAuth } from '@/utils/urlUtils';
import { startOfWeek, format } from 'date-fns';

// OAuth2 configuration
const CLIENT_ID = '216734901779-csrnrl4nmkilae4blbolsip8mmibsk3t.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar';
// Use the utility to get the correct redirect URL
const REDIRECT_URI = getDashboardRedirectUrl();

export interface GoogleOAuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
}

// Get access token from Supabase session
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (session?.provider_token) {
      return session.provider_token;
    }
    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export async function checkIfSignedIn(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

export async function signInWithGoogle(): Promise<boolean> {
  try {
    // Save the current environment before redirecting
    console.log('[auth] Starting Google OAuth flow');
    saveEnvironmentForAuth();
    
    // Use Supabase OAuth with the exact scopes and configuration
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
        redirectTo: window.location.origin + '/admin/dashboard',  // Use origin for correct domain
        queryParams: {
          // Force re-authentication even if already authenticated
          prompt: 'consent',
          access_type: 'offline'
        }
      }
    });
    
    if (error) {
      console.error('[auth] Error signing in with Google via Supabase:', error);
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error('[auth] Error signing in with Google:', error);
    // Check if the error is about cancellation
    if (error.error === 'popup_closed_by_user' || 
        error.message?.includes('popup') || 
        error.message?.includes('בוטל')) {
      throw new Error('ההתחברות בוטלה');
    }
    return false;
  }
}

export async function signOutFromGoogle(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out from Google:', error);
  }
}

export async function fetchGoogleCalendarEvents(currentDisplayDate?: Date): Promise<GoogleCalendarEvent[]> {
  try {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('אין הרשאות גישה ליומן Google');
    }
    
    // Start from the beginning of the current displayed week (Sunday) or today if no date is provided
    const now = currentDisplayDate || new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Start week on Sunday
    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(now.getMonth() + 3);
    
    const timeMin = encodeURIComponent(weekStart.toISOString());
    const timeMax = encodeURIComponent(threeMonthsLater.toISOString());
    
    console.log('Fetching Google Calendar events from API, time range:', {
      from: weekStart.toISOString(),
      to: threeMonthsLater.toISOString()
    });
    
    // Make a direct fetch to Google Calendar API
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch calendar events');
    }
    
    const data = await response.json();
    console.log('Google Calendar API response - events count:', data.items.length);
    
    // Transform the response to our GoogleCalendarEvent format and add logging
    const events: GoogleCalendarEvent[] = data.items.map((item: any, index: number) => {
      // הוספת לוג לפריט כדי לבדוק את הפורמט
      console.log(`Google Calendar event ${index}:`, {
        id: item.id,
        summary: item.summary,
        start: item.start,
        end: item.end
      });
      
      return {
        id: item.id,
        summary: item.summary || 'אירוע ללא כותרת',
        description: item.description || '',
        start: item.start,
        end: item.end,
        status: item.status || 'confirmed',
        syncStatus: 'google-only'
      };
    });
    
    // לוג מסכם והחזרת האירועים
    console.log(`Processed ${events.length} Google Calendar events`);
    
    return events;
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
}

// Function to create a Google Calendar event
export async function createGoogleCalendarEvent(
  summary: string,
  startDateTime: string,
  endDateTime: string,
  description: string = '',
): Promise<string | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('אין הרשאות גישה ליומן Google');
    }
    
    const event = {
      'summary': summary,
      'description': description,
      'start': {
        'dateTime': startDateTime,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'end': {
        'dateTime': endDateTime,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create calendar event');
    }
    
    const data = await response.json();
    console.log('Event created:', data.htmlLink);
    return data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

// Calendar data comparison utilities
export function compareCalendarData(googleEvents: GoogleCalendarEvent[], supabaseSlots: any[]): {
  matchingEvents: any[];
  onlyInGoogle: GoogleCalendarEvent[];
  onlyInSupabase: any[];
} {
  const matchingEvents: any[] = [];
  const onlyInGoogle: GoogleCalendarEvent[] = [];
  
  // Process Google events
  googleEvents.forEach(googleEvent => {
    // Check if this event exists in Supabase slots
    const matchingSlot = supabaseSlots.find(slot => {
      if (!googleEvent.start?.dateTime) return false;
      
      const googleDate = new Date(googleEvent.start.dateTime);
      const googleDateStr = googleDate.toISOString().split('T')[0];
      const googleHour = googleDate.getHours().toString().padStart(2, '0') + ':00';
      
      return slot.date === googleDateStr && slot.start_time === googleHour;
    });
    
    if (matchingSlot) {
      matchingEvents.push({
        google: googleEvent,
        supabase: matchingSlot
      });
    } else {
      onlyInGoogle.push(googleEvent);
    }
  });
  
  // Find slots only in Supabase
  const onlyInSupabase = supabaseSlots.filter(slot => {
    return !googleEvents.some(googleEvent => {
      if (!googleEvent.start?.dateTime) return false;
      
      const googleDate = new Date(googleEvent.start.dateTime);
      const googleDateStr = googleDate.toISOString().split('T')[0];
      const googleHour = googleDate.getHours().toString().padStart(2, '0') + ':00';
      
      return slot.date === googleDateStr && slot.start_time === googleHour;
    });
  });
  
  return {
    matchingEvents,
    onlyInGoogle,
    onlyInSupabase
  };
}
