
// src/services/GoogleOAuthService.ts
let gapi: any = null;
let googleAuth: any = null;
let tokenClient: any = null;

const CLIENT_ID = '827567424410-p0emdtbapj4i519snnind2j0k2e2r36v.apps.googleusercontent.com';
const API_KEY = 'AIzaSyC5FeinQIjGXRzRtK7JnjgxsU33E4-cji4';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

// Debug prefix
const DEBUG_PREFIX = "GOOGLE_OAUTH_SERVICE";

export interface GoogleOAuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
}

export const initializeGoogleAPI = async (): Promise<void> => {
  try {
    console.log(`${DEBUG_PREFIX}: Initializing Google API`);
    
    // Load the Google API client library if not already loaded
    if (!window.gapi) {
      console.log(`${DEBUG_PREFIX}: Loading gapi script`);
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log(`${DEBUG_PREFIX}: gapi script loaded`);
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load gapi script'));
        document.head.appendChild(script);
      });
    }
    
    // Load the gapi.client library if not already loaded
    if (!gapi) {
      gapi = window.gapi;
      console.log(`${DEBUG_PREFIX}: Loading gapi client`);
      await new Promise<void>((resolve, reject) => {
        gapi.load('client', {
          callback: () => {
            console.log(`${DEBUG_PREFIX}: gapi client loaded`);
            resolve();
          },
          onerror: () => reject(new Error('Failed to load gapi client')),
        });
      });
    }
    
    // Initialize the gapi.client with API key
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    });
    console.log(`${DEBUG_PREFIX}: gapi client initialized`);
    
    // Load the Google Identity Services script if not already loaded
    if (!window.google) {
      console.log(`${DEBUG_PREFIX}: Loading Google Identity Services script`);
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log(`${DEBUG_PREFIX}: Google Identity Services script loaded`);
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
        document.head.appendChild(script);
      });
    }
    
    // Initialize token client
    console.log(`${DEBUG_PREFIX}: Initializing token client`);
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {
        console.log(`${DEBUG_PREFIX}: Token client callback triggered`);
      },
    });
    
    console.log(`${DEBUG_PREFIX}: Google API initialized successfully`);
  } catch (error) {
    console.error(`${DEBUG_PREFIX}: Error initializing Google API:`, error);
    throw error;
  }
};

export const checkIfSignedIn = async (): Promise<boolean> => {
  try {
    await initializeGoogleAPI();
    
    const tokenResponse = gapi.client.getToken();
    const isSignedIn = !!tokenResponse && !!tokenResponse.access_token;
    console.log(`${DEBUG_PREFIX}: Check if signed in result: ${isSignedIn}`);
    
    return isSignedIn;
  } catch (error) {
    console.error(`${DEBUG_PREFIX}: Error checking if signed in:`, error);
    return false;
  }
};

export const signInWithGoogle = async (): Promise<boolean> => {
  try {
    await initializeGoogleAPI();
    
    return new Promise<boolean>((resolve) => {
      tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error(`${DEBUG_PREFIX}: Error during OAuth flow:`, response);
          resolve(false);
          return;
        }
        
        console.log(`${DEBUG_PREFIX}: Successfully signed in`);
        resolve(true);
      };
      
      if (gapi.client.getToken() === null) {
        console.log(`${DEBUG_PREFIX}: Requesting access token`);
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        console.log(`${DEBUG_PREFIX}: Reusing existing token`);
        tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  } catch (error) {
    console.error(`${DEBUG_PREFIX}: Error signing in:`, error);
    return false;
  }
};

export const signOutFromGoogle = async (): Promise<void> => {
  try {
    console.log(`${DEBUG_PREFIX}: Signing out`);
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken(null);
    }
  } catch (error) {
    console.error(`${DEBUG_PREFIX}: Error signing out:`, error);
    throw error;
  }
};

export const fetchGoogleCalendarEvents = async (startDate?: Date) => {
  try {
    await initializeGoogleAPI();
    
    // If there's no token, we're not signed in
    if (gapi.client.getToken() === null) {
      console.log(`${DEBUG_PREFIX}: Not signed in, can't fetch events`);
      return [];
    }
    
    const now = startDate || new Date();
    const timeMin = new Date(now);
    timeMin.setDate(timeMin.getDate() - (timeMin.getDay() || 7) + 1); // Start from the beginning of the week
    timeMin.setHours(0, 0, 0, 0);
    
    const timeMax = new Date(timeMin);
    timeMax.setDate(timeMax.getDate() + 30); // Get events for the next month
    
    console.log(`${DEBUG_PREFIX}: Fetching events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`);
    
    const response = await gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': timeMin.toISOString(),
      'timeMax': timeMax.toISOString(),
      'maxResults': 100,
      'singleEvents': true,
      'orderBy': 'startTime'
    });
    
    console.log(`${DEBUG_PREFIX}: Received ${response.result.items.length} events`);
    return response.result.items;
  } catch (error: any) {
    console.error(`${DEBUG_PREFIX}: Error fetching calendar events:`, error);
    
    // If the error is due to an expired token, try to refresh it
    if (error.status === 401) {
      console.log(`${DEBUG_PREFIX}: Token expired, attempting to refresh`);
      try {
        await signInWithGoogle();
        return fetchGoogleCalendarEvents(startDate);
      } catch (refreshError) {
        console.error(`${DEBUG_PREFIX}: Failed to refresh token:`, refreshError);
        throw refreshError;
      }
    }
    
    throw error;
  }
};

export const createGoogleCalendarEvent = async (
  summary: string,
  startDateTime: string,
  endDateTime: string,
  description: string = ''
): Promise<string> => {
  try {
    await initializeGoogleAPI();
    
    // If there's no token, we're not signed in
    if (gapi.client.getToken() === null) {
      console.log(`${DEBUG_PREFIX}: Not signed in, can't create event`);
      throw new Error('Not signed in to Google. Please sign in first.');
    }
    
    console.log(`${DEBUG_PREFIX}: Creating event "${summary}" from ${startDateTime} to ${endDateTime}`);
    
    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Jerusalem'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Jerusalem'
      }
    };
    
    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    
    console.log(`${DEBUG_PREFIX}: Event created with ID: ${response.result.id}`);
    return response.result.id;
  } catch (error: any) {
    console.error(`${DEBUG_PREFIX}: Error creating calendar event:`, error);
    
    // If the error is due to an expired token, try to refresh it
    if (error.status === 401) {
      console.log(`${DEBUG_PREFIX}: Token expired, attempting to refresh`);
      try {
        await signInWithGoogle();
        return createGoogleCalendarEvent(summary, startDateTime, endDateTime, description);
      } catch (refreshError) {
        console.error(`${DEBUG_PREFIX}: Failed to refresh token:`, refreshError);
        throw refreshError;
      }
    }
    
    throw error;
  }
};

export const deleteGoogleCalendarEvent = async (eventId: string): Promise<boolean> => {
  try {
    await initializeGoogleAPI();
    
    // If there's no token, we're not signed in
    if (gapi.client.getToken() === null) {
      console.log(`${DEBUG_PREFIX}: Not signed in, can't delete event`);
      throw new Error('Not signed in to Google. Please sign in first.');
    }
    
    console.log(`${DEBUG_PREFIX}: Deleting event with ID: ${eventId}`);
    
    await gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });
    
    console.log(`${DEBUG_PREFIX}: Event deleted successfully`);
    return true;
  } catch (error: any) {
    console.error(`${DEBUG_PREFIX}: Error deleting calendar event:`, error);
    
    // If the error is due to an expired token, try to refresh it
    if (error.status === 401) {
      console.log(`${DEBUG_PREFIX}: Token expired, attempting to refresh`);
      try {
        await signInWithGoogle();
        return deleteGoogleCalendarEvent(eventId);
      } catch (refreshError) {
        console.error(`${DEBUG_PREFIX}: Failed to refresh token:`, refreshError);
        throw refreshError;
      }
    }
    
    throw error;
  }
};

export const updateGoogleCalendarEvent = async (
  eventId: string,
  summary: string,
  startDateTime: string,
  endDateTime: string,
  description: string = ''
): Promise<boolean> => {
  try {
    await initializeGoogleAPI();
    
    // If there's no token, we're not signed in
    if (gapi.client.getToken() === null) {
      console.log(`${DEBUG_PREFIX}: Not signed in, can't update event`);
      throw new Error('Not signed in to Google. Please sign in first.');
    }
    
    console.log(`${DEBUG_PREFIX}: Updating event ${eventId} with "${summary}" from ${startDateTime} to ${endDateTime}`);
    
    // First, get the current event to preserve any fields we're not updating
    const getResponse = await gapi.client.calendar.events.get({
      calendarId: 'primary',
      eventId: eventId
    });
    
    const existingEvent = getResponse.result;
    
    // Update only the fields we want to change
    const updatedEvent = {
      ...existingEvent,
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Jerusalem'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Jerusalem'
      }
    };
    
    // Update the event
    await gapi.client.calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent
    });
    
    console.log(`${DEBUG_PREFIX}: Event updated successfully`);
    return true;
  } catch (error: any) {
    console.error(`${DEBUG_PREFIX}: Error updating calendar event:`, error);
    
    // If the error is due to an expired token, try to refresh it
    if (error.status === 401) {
      console.log(`${DEBUG_PREFIX}: Token expired, attempting to refresh`);
      try {
        await signInWithGoogle();
        return updateGoogleCalendarEvent(eventId, summary, startDateTime, endDateTime, description);
      } catch (refreshError) {
        console.error(`${DEBUG_PREFIX}: Failed to refresh token:`, refreshError);
        throw refreshError;
      }
    }
    
    throw error;
  }
};
