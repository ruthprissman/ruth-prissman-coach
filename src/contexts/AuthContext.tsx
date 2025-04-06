
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
  isAdmin: boolean;
  checkIsAdmin: (email: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Initialize to false so it doesn't auto-check on page load
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only set up the auth state change listener, don't auto-fetch the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        setSession(newSession);
        setUser(newSession?.user || null);
        
        // Check admin status when auth state changes
        if (event === 'SIGNED_IN' && newSession?.user?.email) {
          const adminStatus = await checkIsAdmin(newSession.user.email);
          setIsAdmin(adminStatus);
          
          // If not an admin, sign out and redirect
          if (!adminStatus) {
            // Show unauthorized message
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-md shadow-md z-50';
            toast.innerHTML = 'אין לך הרשאה לגשת לאזור זה';
            document.body.appendChild(toast);
            
            // Remove the toast after 5 seconds
            setTimeout(() => {
              if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
              }
            }, 5000);
            
            // Sign out
            await supabase.auth.signOut();
            setIsAdmin(false);
            setUser(null);
            setSession(null);
            
            // Redirect to homepage
            window.location.href = '/';
          }
        }
        
        if (event === 'SIGNED_OUT') {
          clearAuthClientCache();
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkIsAdmin = async (email: string): Promise<boolean> => {
    try {
      console.log(`Checking if ${email} is an admin`);
      const { data, error } = await supabase
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
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setIsLoading(false);
      toast({
        title: "התחברות נכשלה",
        description: "❌ בדוק/י את הפרטים ונסה שוב.",
        variant: "destructive",
      });
      return { error };
    }
    
    // Check if the user is an admin
    if (data.user) {
      const isUserAdmin = await checkIsAdmin(data.user.email || '');
      setIsAdmin(isUserAdmin);
      
      if (!isUserAdmin) {
        // Sign out if not an admin
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        
        toast({
          title: "אין הרשאה",
          description: "❌ אין לך הרשאה לגשת לאזור זה.",
          variant: "destructive",
        });
        
        setIsLoading(false);
        
        // Redirect to homepage
        window.location.href = '/';
        return { error: new Error("Not an admin") };
      }
      
      // Redirect to dashboard for admins
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
      const redirectTo = `${window.location.origin}/admin/auth-callback`;
      console.log(`[Auth Debug] Google login redirect set to: ${redirectTo}`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',  // Always show account selection, even if user is signed in
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
      const { count, error } = await supabase
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
      console.log('[Auth Debug] Environment detection:');
      console.log(`[Auth Debug] import.meta.env.DEV = ${import.meta.env.DEV}`);
      console.log(`[Auth Debug] import.meta.env.PROD = ${import.meta.env.PROD}`);
      console.log(`[Auth Debug] import.meta.env.MODE = ${import.meta.env.MODE}`);
      
      const currentUrl = window.location.origin;
      console.log(`[Auth Debug] Current origin: ${currentUrl}`);
      
      const redirectTo = `${window.location.origin}/admin/login`;
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
    setIsAdmin(false);
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
      checkIsAdmin
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
