
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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const supabase = supabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: false, 
          isLoading: false,
          accessToken: null,
          refreshToken: null
        }));
        return;
      }

      // Check if we have Google tokens stored
      const { data: tokens, error } = await supabase
        .from('google_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', session.user.id)
        .single();

      if (error || !tokens) {
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: false, 
          isLoading: false,
          accessToken: null,
          refreshToken: null
        }));
        return;
      }

      // Check if token is still valid
      const now = new Date();
      const expiresAt = new Date(tokens.expires_at);
      
      if (now >= expiresAt) {
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: false, 
          isLoading: false,
          accessToken: null,
          refreshToken: null
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: true, 
          isLoading: false,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token
        }));
      }
    } catch (error: any) {
      console.error('Error checking auth status:', error);
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
      
      // Basic implementation - in real app this would redirect to Google OAuth
      console.log('Google OAuth sign in initiated');
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Google OAuth not fully implemented'
      }));
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Failed to authenticate with Google'
      }));
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const supabase = supabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Remove Google tokens
        await supabase
          .from('google_tokens')
          .delete()
          .eq('user_id', session.user.id);
      }
      
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

  // Create event function with proper signature and implementation
  const createEvent = async (
    summary: string,
    startDateTime: string,
    endDateTime: string,
    description?: string
  ): Promise<string> => {
    try {
      console.log('Creating Google Calendar event:', { summary, startDateTime, endDateTime, description });
      
      if (!state.isAuthenticated || !state.accessToken) {
        throw new Error('לא מחובר ליומן Google');
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

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create calendar event');
      }

      const data = await response.json();
      console.log('Event created successfully:', data.id);
      return data.id;
    } catch (error: any) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  };

  return {
    ...state,
    signInWithGoogle,
    signOut,
    refreshAuth,
    createEvent,
    // Add aliases for compatibility
    isAuthenticating: state.isLoading,
    signIn: signInWithGoogle,
    events: [],
    isLoadingEvents: false,
    fetchEvents: async () => console.log('Fetch events not implemented')
  };
};
