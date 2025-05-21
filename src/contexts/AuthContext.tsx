
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabaseClient, clearSupabaseClientCache } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { getDashboardRedirectUrl } from '@/utils/urlUtils';
import { persistAuthState } from '@/utils/cookieUtils';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createAdminUser: (email: string, password: string) => Promise<{ error: Error | null, message?: string }>;
  resetPassword: (email: string) => Promise<{ error: Error | null, message?: string }>;
  checkAdminExists: () => Promise<boolean>;
  isAdmin: boolean;
  checkIsAdmin: (email: string) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Setup session refresh interval (15 minutes)
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000; 

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Function to refresh the session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[Auth] Refreshing session...');
      const { data, error } = await supabaseClient().auth.refreshSession();
      
      if (error) {
        console.error('[Auth] Failed to refresh session:', error);
        return false;
      }
      
      if (data && data.session) {
        console.log('[Auth] Session refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Auth] Error refreshing session:', error);
      return false;
    }
  }, []);

  // Setup periodic session refresh
  const setupSessionRefresh = useCallback(() => {
    // Clear any existing timer
    if (refreshTimerRef.current !== null) {
      window.clearInterval(refreshTimerRef.current);
    }
    
    // Only setup timer if we have a session
    if (session) {
      console.log('[Auth] Setting up session refresh timer');
      
      refreshTimerRef.current = window.setInterval(() => {
        refreshSession().then(success => {
          if (!success) console.warn('[Auth] Failed to refresh session automatically');
        });
      }, SESSION_REFRESH_INTERVAL);
    }
  }, [session, refreshSession]);

  useEffect(() => {
    // Setup the session refresh timer when session changes
    setupSessionRefresh();
    
    // Cleanup function
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearInterval(refreshTimerRef.current);
      }
    };
  }, [session, setupSessionRefresh]);

  useEffect(() => {
    const { data: { subscription } } = supabaseClient().auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Auth] Auth state changed:', event, newSession?.user?.id);
        
        setSession(newSession);
        setUser(newSession?.user || null);
        
        // Persist auth state to local storage when session changes
        if (newSession) {
          persistAuthState(true, {
            access_token: newSession.access_token,
            refresh_token: newSession.refresh_token,
            expires_at: newSession.expires_at
          });
        } else if (event === 'SIGNED_OUT') {
          persistAuthState(false);
        }
        
        if (event === 'SIGNED_IN' && newSession?.user?.email) {
          const adminStatus = await checkIsAdmin(newSession.user.email);
          setIsAdmin(adminStatus);
          
          if (!adminStatus) {
            toast({
              title: "אין הרשאה",
              description: "אין לך הרשאה לגשת לאזור זה",
              variant: "destructive",
            });
            
            await supabaseClient().auth.signOut();
            setIsAdmin(false);
            setUser(null);
            setSession(null);
            persistAuthState(false);
            
            window.location.href = '/';
          }
        }
        
        if (event === 'SIGNED_OUT') {
          clearSupabaseClientCache();
          setIsAdmin(false);
          persistAuthState(false);
        }
        
        setIsLoading(false);
      }
    );

    const initializeAuth = async () => {
      try {
        const { data } = await supabaseClient().auth.getSession();
        if (data && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Store session data in localStorage for persistence
          persistAuthState(true, {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          });
          
          // Check admin status
          if (data.session.user.email) {
            const adminStatus = await checkIsAdmin(data.session.user.email);
            setIsAdmin(adminStatus);
          }
        }
      } catch (error) {
        console.error("[Auth] Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const checkIsAdmin = async (email: string): Promise<boolean> => {
    try {
      console.log(`Checking if ${email} is an admin`);
      const { data, error } = await supabaseClient()
        .from('admins')
        .select('email')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      const isUserAdmin = !!data;
      console.log(`Admin check result for ${email}:`, isUserAdmin);
      return isUserAdmin;
    } catch (error) {
      console.error('Unexpected error checking admin status:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error, data } = await supabaseClient().auth.signInWithPassword({ email, password });
    
    if (error) {
      setIsLoading(false);
      toast({
        title: "התחברות נכשלה",
        description: "❌ בדוק/י את הפרטים ונסה שוב.",
        variant: "destructive",
      });
      return { error };
    }
    
    if (data.user) {
      const isUserAdmin = await checkIsAdmin(data.user.email || '');
      setIsAdmin(isUserAdmin);
      
      if (!isUserAdmin) {
        await supabaseClient().auth.signOut();
        setUser(null);
        setSession(null);
        
        toast({
          title: "אין הרשאה",
          description: "❌ אין לך הרשאה לגשת לאזור זה.",
          variant: "destructive",
        });
        
        setIsLoading(false);
        
        window.location.href = '/';
        return { error: new Error("Not an admin") };
      }
      
      toast({
        title: "התחברת בהצלחה!",
        description: "✅ מועבר/ת ללוח הניהול",
      });
      
      window.location.href = '/admin/dashboard';
    }
    
    setIsLoading(false);
    return { error: null };
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const redirectTo = getDashboardRedirectUrl();
      console.log(`[Auth Debug] Google login redirect set to: ${redirectTo}`);
      
      const { error } = await supabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "התחברות עם גוגל נכשלה",
        description: `❌ ${error.message}`,
        variant: "destructive",
      });
      return { error };
    }
  };

  const checkAdminExists = async () => {
    try {
      const { count, error } = await supabaseClient()
        .from('admins')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error checking if admin exists:', error);
        return true;
      }
      
      return count ? count > 0 : false;
    } catch (error) {
      console.error('Error checking if admin exists:', error);
      return true;
    }
  };

  const createAdminUser = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const adminExists = await checkAdminExists();
      
      if (adminExists) {
        setIsLoading(false);
        toast({
          title: "פעולה נדחתה",
          description: "❌ קיים כבר מנהל במערכת. אם שכחת את הסיסמה, ניתן לאפס אותה דרך 'שחזור סיסמה'.",
          variant: "destructive",
        });
        return { 
          error: new Error("Admin already exists"), 
          message: "קיים כבר מנהל במערכת. אם שכחת את הסיסמה, ניתן לאפס אותה דרך 'שחזור סיסמה'."
        };
      }
      
      const { error: signUpError, data } = await supabaseClient().auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role: 'admin'
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      setIsLoading(false);
      toast({
        title: "משתמש מנהל נוצר בהצלחה!",
        description: "✅ כעת תוכל/י להתחבר עם פרטים אלו",
      });
      
      return { error: null };
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "יצירת משתמש נכשלה",
        description: `❌ ${error.message}`,
        variant: "destructive",
      });
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      console.log('[Auth Debug] Environment detection:');
      console.log(`[Auth Debug] import.meta.env.DEV = ${import.meta.env.DEV}`);
      console.log(`[Auth Debug] import.meta.env.PROD = ${import.meta.env.PROD}`);
      console.log(`[Auth Debug] import.meta.env.MODE = ${import.meta.env.MODE}`);
      
      const currentUrl = window.location.origin;
      console.log(`[Auth Debug] Current origin: ${currentUrl}`);
      
      const redirectTo = `${window.location.origin}/admin/login`;
      console.log(`[Auth Debug] Final password reset redirect URL: ${redirectTo}`);
      
      const { error } = await supabaseClient().auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });
      
      if (error) throw error;
      
      setIsLoading(false);
      toast({
        title: "בקשת איפוס סיסמה נשלחה",
        description: "✅ נא לבדוק את תיבת האימייל שלך לקבלת הוראות נוספות.",
      });
      
      return { error: null, message: "נא לבדוק את תיבת האימייל שלך" };
    } catch (error: any) {
      console.error('[Auth Debug] Reset password error:', error);
      setIsLoading(false);
      toast({
        title: "בקשת איפוס סיסמה נכשלה",
        description: `❌ ${error.message}`,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    clearSupabaseClientCache();
    
    // Clear the refresh timer
    if (refreshTimerRef.current !== null) {
      window.clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    await supabaseClient().auth.signOut();
    setIsAdmin(false);
    persistAuthState(false);
    
    toast({
      title: "התנתקת בהצלחה",
      description: "להתראות בפעם הבאה",
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      signIn,
      signInWithGoogle,
      signOut, 
      createAdminUser, 
      resetPassword,
      checkAdminExists,
      isAdmin,
      checkIsAdmin,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
