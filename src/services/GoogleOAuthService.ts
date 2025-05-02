import { GoogleCalendarEvent } from '@/types/calendar';
import { supabase } from '@/lib/supabase';
import { getDashboardRedirectUrl, saveEnvironmentForAuth } from '@/utils/urlUtils';
import { startOfWeek, format, addMonths } from 'date-fns';

// OAuth2 configuration
const CLIENT_ID = '216734901779-csrnrl4nmkilae4blbolsip8mmibsk3t.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar';
// Use the utility to get the correct redirect URL
const REDIRECT_URI = getDashboardRedirectUrl();

// Version identifier for debugging
const SERVICE_VERSION = "1.0.1";
console.log(`LOV_DEBUG_GOOGLE_OAUTH: Service initialized, version ${SERVICE_VERSION}`);

export interface GoogleOAuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
}

// Get access token from Supabase session
export async function getAccessToken(): Promise<string | null> {
  try {
    console.log('LOV_DEBUG_GOOGLE_OAUTH: Getting access token from session');
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (session?.provider_token) {
      console.log('LOV_DEBUG_GOOGLE_OAUTH: Access token found in session');
      return session.provider_token;
    }
    console.log('LOV_DEBUG_GOOGLE_OAUTH: No access token found');
    return null;
  } catch (error) {
    console.error('LOV_DEBUG_GOOGLE_OAUTH: Error getting access token:', error);
    return null;
  }
}

export async function checkIfSignedIn(): Promise<boolean> {
  const token = await getAccessToken();
  console.log(`LOV_DEBUG_GOOGLE_OAUTH: checkIfSignedIn result: ${!!token}`);
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
    console.log(`LOV_DEBUG_GOOGLE_OAUTH: fetchGoogleCalendarEvents called with date: ${currentDisplayDate?.toISOString() || 'undefined'}`);
    console.log(`LOV_DEBUG_GOOGLE_OAUTH: Service version: ${SERVICE_VERSION}`);
    
    const token = await getAccessToken();
    if (!token) {
      console.error('LOV_DEBUG_GOOGLE_OAUTH: No access token available');
      throw new Error('אין הרשאות גישה ליומן Google');
    }
    
    // IMPORTANT: Always start from the beginning of the displayed week (Sunday)
    // This ensures we fetch events from the beginning of the week
    const now = currentDisplayDate || new Date();
    console.log(`LOV_DEBUG_GOOGLE_OAUTH: Using date for events fetch: ${now.toISOString()}`);
    
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Start week on Sunday
    const twoMonthsLater = addMonths(weekStart, 2);
    
    console.log(`LOV_DEBUG_GOOGLE_OAUTH: Calculated week start: ${weekStart.toISOString()}`);
    console.log(`LOV_DEBUG_GOOGLE_OAUTH: End date (2 months later): ${twoMonthsLater.toISOString()}`);
    
    const timeMin = encodeURIComponent(weekStart.toISOString());
    const timeMax = encodeURIComponent(twoMonthsLater.toISOString());
    
    console.log('LOV_DEBUG_GOOGLE_OAUTH: Fetching Google Calendar events from API, time range:', {
      from: weekStart.toISOString(),
      to: twoMonthsLater.toISOString()
    });
    
    // Make a direct fetch to Google Calendar API
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    console.log(`LOV_DEBUG_GOOGLE_OAUTH: API URL: ${apiUrl}`);
    
    const response = await fetch(
      apiUrl,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`LOV_DEBUG_GOOGLE_OAUTH: API response not OK: ${response.status}`, errorData);
      throw new Error(errorData.error?.message || 'Failed to fetch calendar events');
    }
    
    const data = await response.json();
    console.log(`LOV_DEBUG_GOOGLE_OAUTH: Google Calendar API response - events count: ${data.items.length}`);
    
    // Transform the response to our GoogleCalendarEvent format and add logging
    const events: GoogleCalendarEvent[] = data.items.map((item: any, index: number) => {
      // Log event details for debugging
      console.log(`LOV_DEBUG_GOOGLE_OAUTH: Processing event ${index}:`, {
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
    
    // Summary log
    console.log(`LOV_DEBUG_GOOGLE_OAUTH: Processed ${events.length} Google Calendar events successfully`);
    
    return events;
  } catch (error) {
    console.error('LOV_DEBUG_GOOGLE_OAUTH: Error fetching Google Calendar events:', error);
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
