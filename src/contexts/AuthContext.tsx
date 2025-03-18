import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabaseClient as supabase, clearSupabaseClientCache } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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
    // Check for active session on mount
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

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.id);
        
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (event === 'SIGNED_OUT') {
          // Clear cached auth clients on logout
          clearSupabaseClientCache();
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

  // בדיקה האם קיים כבר מנהל במערכת
  const checkAdminExists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      
      if (error) throw error;
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking if admin exists:', error);
      return false;
    }
  };

  const createAdminUser = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // בדיקה האם כבר קיים מנהל במערכת
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
      
      // יצירת משתמש חדש
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
      
      // יצירת רשומה בטבלת הפרופילים
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: data.user.id, 
            email,
            role: 'admin'
          }]);
          
        if (profileError) throw profileError;
      }
      
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

  // פונקציה לאיפוס סיסמה
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      
      if (error) throw error;
      
      setIsLoading(false);
      toast({
        title: "בקשת איפוס סיסמה נשלחה",
        description: "✅ נא לבדוק את תיבת האימייל שלך לקבלת הוראות נוספות.",
      });
      
      return { error: null, message: "נא לבדוק את תיבת האימייל שלך" };
    } catch (error: any) {
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
      clearSupabaseClientCache(session.access_token);
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
