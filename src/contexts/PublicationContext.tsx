
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
      console.log("PublicationProvider: Starting publication service with access token");
      publicationService.start(session.access_token);
      setIsInitialized(true);
    } else {
      console.log("PublicationProvider: No session, stopping publication service");
      publicationService.stop();
      setIsInitialized(false);
    }
    
    // Cleanup on unmount
    return () => {
      console.log("PublicationProvider: Cleaning up, stopping publication service");
      publicationService.stop();
    };
  }, [session]);
  
  const retryPublication = async (publicationId: number) => {
    try {
      console.log(`Attempting to retry publication ${publicationId}`);
      console.log(`Session status: ${session ? 'Active session' : 'No session'}`);
      
      const publicationService = PublicationService.getInstance();
      await publicationService.retryPublication(publicationId);
      
      toast({
        title: "פרסום הושלם בהצלחה",
        description: "המאמר פורסם בהצלחה",
      });
    } catch (error: any) {
      console.error("Error in retryPublication:", error);
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
