
import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { GoogleOAuthService } from '@/services/GoogleOAuthService';

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

  const googleOAuthService = new GoogleOAuthService();

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
        // Token expired, try to refresh
        try {
          const refreshed = await googleOAuthService.refreshAccessToken(tokens.refresh_token);
          
          if (refreshed) {
            setState(prev => ({ 
              ...prev, 
              isAuthenticated: true, 
              isLoading: false,
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token || tokens.refresh_token
            }));
          } else {
            setState(prev => ({ 
              ...prev, 
              isAuthenticated: false, 
              isLoading: false,
              accessToken: null,
              refreshToken: null
            }));
          }
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          setState(prev => ({ 
            ...prev, 
            isAuthenticated: false, 
            isLoading: false,
            error: 'Failed to refresh authentication',
            accessToken: null,
            refreshToken: null
          }));
        }
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

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await googleOAuthService.initiateOAuth();
      
      if (result.success) {
        await checkAuthStatus();
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error || 'Failed to authenticate with Google'
        }));
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || 'Failed to authenticate with Google'
      }));
    }
  };

  const signOut = async () => {
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

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  return {
    ...state,
    signInWithGoogle,
    signOut,
    refreshAuth
  };
};
