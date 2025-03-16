
import { GoogleCalendarEvent } from '@/types/calendar';

// OAuth2 configuration
const CLIENT_ID = '216734901779-csrnrl4mkilae4blbolsip8mmibsk3t.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
// Determine the correct redirect URI based on the current environment
const REDIRECT_URI = window.location.hostname.includes('preview') 
  ? 'https://preview--ruth-prissman-coach.lovable.app/auth/callback'
  : 'https://ruth-prissman-coach.lovable.app/auth/callback';

export interface GoogleOAuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
}

export async function initGoogleAuth(): Promise<boolean> {
  try {
    // Load the Google API client library if not already loaded
    if (!window.gapi) {
      console.log('Loading Google API client...');
      await loadGoogleApiScript();
    }

    // Load the auth2 module
    if (!window.gapi.auth2) {
      console.log('Loading auth2 module...');
      return new Promise((resolve) => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: CLIENT_ID,
            scope: SCOPES,
            redirect_uri: REDIRECT_URI
          }).then(() => {
            console.log('Google Auth initialized');
            resolve(true);
          }).catch((error: any) => {
            console.error('Google Auth initialization failed', error);
            resolve(false);
          });
        });
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
    return false;
  }
}

export async function checkIfSignedIn(): Promise<boolean> {
  try {
    await initGoogleAuth();
    const auth2 = window.gapi.auth2.getAuthInstance();
    return auth2.isSignedIn.get();
  } catch (error) {
    console.error('Error checking sign-in status:', error);
    return false;
  }
}

export async function signInWithGoogle(): Promise<boolean> {
  try {
    await initGoogleAuth();
    const auth2 = window.gapi.auth2.getAuthInstance();
    
    // Always show the account chooser by using these options
    const options = {
      prompt: 'select_account', // Always show account selection, even if user is already signed in
      ux_mode: 'popup',
      locale: 'he', // Hebrew locale
    };
    
    // Start the sign-in flow
    const googleUser = await auth2.signIn(options);
    const isSignedIn = auth2.isSignedIn.get();
    
    // Get a detailed authResponse to check for cancellation
    const authResponse = googleUser?.getAuthResponse(true);
    if (!authResponse || !authResponse.access_token) {
      throw new Error('ההתחברות בוטלה');
    }
    
    return isSignedIn;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
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
    const auth2 = window.gapi.auth2.getAuthInstance();
    await auth2.signOut();
  } catch (error) {
    console.error('Error signing out from Google:', error);
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const auth2 = window.gapi.auth2.getAuthInstance();
    if (auth2.isSignedIn.get()) {
      const currentUser = auth2.currentUser.get();
      const authResponse = currentUser.getAuthResponse();
      return authResponse.access_token;
    }
    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export async function fetchGoogleCalendarEvents(): Promise<GoogleCalendarEvent[]> {
  try {
    // Ensure Google API client is loaded
    if (!window.gapi || !window.gapi.client) {
      await loadGapiClient();
    }
    
    const token = await getAccessToken();
    if (!token) {
      throw new Error('אין הרשאות גישה ליומן Google');
    }
    
    // Calculate time range (next 30 days)
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(now.getDate() + 30);
    
    const timeMin = now.toISOString();
    const timeMax = thirtyDaysLater.toISOString();
    
    // Make the API request
    const response = await window.gapi.client.calendar.events.list({
      'calendarId': 'ruthprissman@gmail.com',
      'timeMin': timeMin,
      'timeMax': timeMax,
      'singleEvents': true,
      'orderBy': 'startTime'
    });
    
    console.log('Google Calendar events fetched:', response.result.items);
    
    // Transform the response to our GoogleCalendarEvent format
    const events: GoogleCalendarEvent[] = response.result.items.map((item: any) => ({
      id: item.id,
      summary: item.summary || 'אירוע ללא כותרת',
      description: item.description || '',
      start: item.start,
      end: item.end,
      status: item.status || 'confirmed',
      syncStatus: 'google-only'
    }));
    
    return events;
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
}

function loadGoogleApiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.getElementById('google-api-script')) {
      resolve();
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.id = 'google-api-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google API script loaded');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('Error loading Google API script:', error);
      reject(error);
    };
    
    document.body.appendChild(script);
  });
}

async function loadGapiClient(): Promise<void> {
  await new Promise<void>((resolve) => {
    window.gapi.load('client', () => resolve());
  });
  
  await window.gapi.client.init({
    apiKey: null, // We're using OAuth, so no API key needed
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    clientId: CLIENT_ID,
    scope: SCOPES
  });
}

// Add type declarations for window.gapi
declare global {
  interface Window {
    gapi: any;
  }
}
