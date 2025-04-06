import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getSupabaseWithAuth, clearAuthClientCache } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
        }

        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Unexpected error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (event === 'SIGNED_OUT') {
          clearAuthClientCache();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "התחברות נכשלה",
        description: "❌ בדוק/י את הפרטים ונסה שוב.",
        variant: "destructive",
      });
      return { error };
    }

    toast({
      title: "התחברת בהצלחה!",
      description: "✅ מועבר/ת ללוח הניהול",
    });
    
    return { error: null };
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Determine the correct redirect URL based on environment
      let baseUrl = '';
      
      if (import.meta.env.DEV) {
        baseUrl = 'https://preview--ruth-prissman-coach-dev-20032025.lovable.app';
      } else {
        baseUrl = 'https://ruth-prissman-coach.lovable.app';
      }
      
      const redirectTo = `${baseUrl}/admin/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
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
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('Error checking if users exist:', error);
        return true;
      }
      
      return data && data.users && data.users.length > 0;
    } catch (error) {
      console.error('Error checking if users exist:', error);
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
      
      const { error: signUpError, data } = await supabase.auth.signUp({ 
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
      // Debug environment detection
      console.log('[Auth Debug] Environment detection:');
      console.log(`[Auth Debug] import.meta.env.DEV = ${import.meta.env.DEV}`);
      console.log(`[Auth Debug] import.meta.env.PROD = ${import.meta.env.PROD}`);
      console.log(`[Auth Debug] import.meta.env.MODE = ${import.meta.env.MODE}`);
      
      // Get current URL to help with debugging
      const currentUrl = window.location.origin;
      console.log(`[Auth Debug] Current origin: ${currentUrl}`);
      
      // Determine the correct redirect URL based on environment
      let baseUrl = '';
      
      if (import.meta.env.DEV) {
        baseUrl = 'https://preview--ruth-prissman-coach-dev-20032025.lovable.app';
        console.log(`[Auth Debug] Using DEV baseUrl: ${baseUrl}`);
      } else {
        baseUrl = 'https://ruth-prissman-coach.lovable.app';
        console.log(`[Auth Debug] Using PROD baseUrl: ${baseUrl}`);
      }
      
      const redirectTo = `${baseUrl}/admin/login`;
      
      console.log(`[Auth Debug] Final password reset redirect URL: ${redirectTo}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
    if (session?.access_token) {
      clearAuthClientCache(session.access_token);
    }
    
    await supabase.auth.signOut();
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
      checkAdminExists
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
