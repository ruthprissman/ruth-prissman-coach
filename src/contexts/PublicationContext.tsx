
import React, { createContext, useContext, useEffect, useState } from 'react';
import PublicationService from '@/services/PublicationService';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PublicationContextType {
  retryPublication: (publicationId: number) => Promise<void>;
  isInitialized: boolean;
}

// Create context with default values
const PublicationContext = createContext<PublicationContextType>({
  retryPublication: async () => {},
  isInitialized: false
});

export const usePublication = () => useContext(PublicationContext);

interface PublicationProviderProps {
  children: React.ReactNode;
}

export const PublicationProvider: React.FC<PublicationProviderProps> = ({ children }) => {
  const { session } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  
  // Initialize and stop the publication service based on auth state
  useEffect(() => {
    const publicationService = PublicationService.getInstance();
    
    if (session?.access_token) {
      publicationService.start(session.access_token);
      setIsInitialized(true);
    } else {
      publicationService.stop();
      setIsInitialized(false);
    }
    
    // Cleanup on unmount
    return () => {
      publicationService.stop();
    };
  }, [session]);
  
  const retryPublication = async (publicationId: number) => {
    try {
      const publicationService = PublicationService.getInstance();
      await publicationService.retryPublication(publicationId);
      
      toast({
        title: "פרסום הושלם בהצלחה",
        description: "המאמר פורסם בהצלחה",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה בפרסום",
        description: error.message || "אירעה שגיאה בעת ניסיון לפרסם מחדש",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const value = {
    retryPublication,
    isInitialized
  };
  
  return (
    <PublicationContext.Provider value={value}>
      {children}
    </PublicationContext.Provider>
  );
};
