import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export interface GoogleOAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export const useGoogleOAuth = () => {
  const [state, setState] = useState<GoogleOAuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    accessToken: null,
    refreshToken: null
  });

  // Get current access token from session
  const getCurrentAccessToken = async (): Promise<string | null> => {
    try {
      console.log('🔑 useGoogleOAuth: Getting current access token...');
      const supabase = supabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔑 useGoogleOAuth: Error getting session:', error);
        return null;
      }
      
      if (!session) {
        console.log('🔑 useGoogleOAuth: No session found');
        return null;
      }
      
      console.log('🔑 useGoogleOAuth: Session found:', {
        hasUser: !!session.user,
        hasProviderToken: !!session.provider_token,
        tokenLength: session.provider_token?.length || 0,
        provider: session.user?.app_metadata?.provider
      });
      
      if (session.provider_token) {
        console.log('🔑 useGoogleOAuth: Found provider token');
        return session.provider_token;
      }
      
      console.log('🔑 useGoogleOAuth: No provider token found');
      return null;
    } catch (error: any) {
      console.error('🔑 useGoogleOAuth: Error getting access token:', error);
      return null;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const token = await getCurrentAccessToken();
      
      if (token) {
        console.log('✅ useGoogleOAuth: Authentication successful');
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: true, 
          isLoading: false,
          accessToken: token,
          refreshToken: null // We don't store refresh token separately
        }));
      } else {
        console.log('❌ useGoogleOAuth: No authentication found');
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: false, 
          isLoading: false,
          accessToken: null,
          refreshToken: null
        }));
      }
    } catch (error: any) {
      console.error('❌ useGoogleOAuth: Error in authentication check:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null
      }));
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔐 useGoogleOAuth: Starting Google sign-in...');
      const supabase = supabaseClient();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
          redirectTo: window.location.origin + '/admin/dashboard',
          queryParams: {
            prompt: 'consent',
            access_type: 'offline'
          }
        }
      });
      
      if (error) {
        console.error('🔐 useGoogleOAuth: Sign-in error:', error);
        throw error;
      }
      
      console.log('🔐 useGoogleOAuth: Sign-in initiated successfully');
    } catch (error: any) {
      console.error('❌ useGoogleOAuth: Error signing in:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'שגיאה בהתחברות ליומן Google'
      }));
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const supabase = supabaseClient();
      await supabase.auth.signOut();
      
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: false, 
        isLoading: false,
        accessToken: null,
        refreshToken: null
      }));
    } catch (error: any) {
      console.error('Error signing out:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message
      }));
    }
  };

  const refreshAuth = async (): Promise<void> => {
    await checkAuthStatus();
  };

  // Create event function with proper token validation
  const createEvent = async (
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description?: string
  ): Promise<string> => {
    try {
      console.log('🚀 useGoogleOAuth: Creating Google Calendar event...', {
        summary,
        startDateTime,
        endDateTime,
        description
      });
      
      // Get fresh token each time
      const token = await getCurrentAccessToken();
      console.log('🚀 useGoogleOAuth: Token check result:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        stateAuthenticated: state.isAuthenticated
      });
      
      if (!token) {
        console.error('🚀 useGoogleOAuth: No access token available');
        throw new Error('לא מחובר ליומן Google - נדרשת התחברות מחדש');
      }

      const event = {
        summary,
        description: description || '',
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      console.log('🚀 useGoogleOAuth: Event object created:', event);
      console.log('🚀 useGoogleOAuth: Making API request...');

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      
      console.log('🚀 useGoogleOAuth: API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🚀 useGoogleOAuth: API error response:', errorData);
        
        if (response.status === 401) {
          // Token expired, update authentication state
          setState(prev => ({ 
            ...prev, 
            isAuthenticated: false,
            accessToken: null
          }));
          throw new Error('אסימון Google פג תוקף - נדרשת התחברות מחדש');
        } else if (response.status === 403) {
          throw new Error('אין הרשאות לכתוב ליומן Google - נדרשת התחברות מחדש עם הרשאות מלאות');
        }
        
        throw new Error(errorData.error?.message || `שגיאה ביצירת אירוע: ${response.status}`);
      }

      const data = await response.json();
      console.log('🚀 useGoogleOAuth: Event created successfully:', {
        eventId: data.id,
        htmlLink: data.htmlLink
      });
      
      return data.id;
    } catch (error: any) {
      console.error('❌ useGoogleOAuth: Event creation failed:', error);
      throw error;
    }
  };

  // Add function to delete a Google Calendar event by ID
  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      const token = await getCurrentAccessToken();
      if (!token) {
        throw new Error('לא מחובר ליומן Google - נדרשת התחברות מחדש');
      }
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            accessToken: null
          }));
          throw new Error('האימות מול Google פג תוקף - התחבר/י מחדש');
        } else if (response.status === 403) {
          throw new Error('אין הרשאות למחוק אירועים ביומן Google');
        }
        throw new Error(`שגיאה במחיקת אירוע: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ useGoogleOAuth: Event delete failed:', error);
      throw error;
    }
  };

  return {
    ...state,
    signInWithGoogle,
    signOut,
    refreshAuth,
    createEvent,
    deleteEvent,
    // Add aliases for compatibility
    isAuthenticating: state.isLoading,
    signIn: signInWithGoogle,
    events: [],
    isLoadingEvents: false,
    fetchEvents: async () => console.log('Fetch events not implemented')
  };
};
