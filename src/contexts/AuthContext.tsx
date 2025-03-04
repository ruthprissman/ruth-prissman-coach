
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createAdminUser: (email: string, password: string) => Promise<{ error: Error | null }>;
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
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
      }

      setSession(data.session);
      setUser(data.session?.user || null);
      setIsLoading(false);
    };

    fetchSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsLoading(false);
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

  const createAdminUser = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          role: 'admin'
        }
      }
    });
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "יצירת משתמש נכשלה",
        description: `❌ ${error.message}`,
        variant: "destructive",
      });
      return { error };
    }

    toast({
      title: "משתמש מנהל נוצר בהצלחה!",
      description: "✅ כעת תוכל/י להתחבר עם פרטים אלו",
    });
    
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "התנתקת בהצלחה",
      description: "להתראות בפעם הבאה",
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut, createAdminUser }}>
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
