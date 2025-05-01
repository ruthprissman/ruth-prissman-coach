
import React, { createContext, useContext, useEffect, useState } from 'react';
import PublicationService from '@/services/PublicationService';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PublicationContextType {
  retryPublication: (publicationId: number) => Promise<void>;
  isInitialized: boolean;
  manualCheckPublications: () => Promise<void>;
}

// Create context with default values
const PublicationContext = createContext<PublicationContextType>({
  retryPublication: async () => {},
  isInitialized: false,
  manualCheckPublications: async () => {}
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
    const publicationService = PublicationService;
    
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
      // Use the instance method which will call the static method internally
      await PublicationService.retryPublication(publicationId);
      
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

  const manualCheckPublications = async () => {
    try {
      await PublicationService.manualCheckPublications();
    } catch (error: any) {
      console.error('Error manually checking publications:', error);
      // Don't show toast here to avoid spamming the user
    }
  };
  
  const value = {
    retryPublication,
    isInitialized,
    manualCheckPublications
  };
  
  return (
    <PublicationContext.Provider value={value}>
      {children}
    </PublicationContext.Provider>
  );
};
