
import React, { createContext, useContext, useEffect, useState } from 'react';
import PublicationService from '@/services/PublicationService';
import { useAuth } from './AuthContext';

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
    const publicationService = PublicationService.getInstance();
    await publicationService.retryPublication(publicationId);
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
