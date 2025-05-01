
import React, { createContext, useContext, useEffect, useState } from 'react';
import PublicationService from '@/services/PublicationService';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PublicationContextType {
  retryPublication: (publicationId: number) => Promise<void>;
  isInitialized: boolean;
  manualCheckPublications: () => Promise<void>;
  isAdminArticlesPage: boolean;
}

// Create context with default values
const PublicationContext = createContext<PublicationContextType>({
  retryPublication: async () => {},
  isInitialized: false,
  manualCheckPublications: async () => {},
  isAdminArticlesPage: false
});

export const usePublication = () => useContext(PublicationContext);

interface PublicationProviderProps {
  children: React.ReactNode;
}

export const PublicationProvider: React.FC<PublicationProviderProps> = ({ children }) => {
  const { session } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const [isAdminArticlesPage, setIsAdminArticlesPage] = useState(false);
  
  // Check if we're on an admin articles page based on window location
  // This avoids using useLocation from react-router-dom which requires Router context
  useEffect(() => {
    const checkIfAdminArticlesPage = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isAdminArticles = path.includes('/admin/articles');
        console.log('[PublicationContext] Current path:', path, 'isAdminArticles:', isAdminArticles);
        setIsAdminArticlesPage(isAdminArticles);
      }
    };
    
    checkIfAdminArticlesPage();
    
    // Add event listener for route changes if using client-side routing
    window.addEventListener('popstate', checkIfAdminArticlesPage);
    window.addEventListener('pushstate', checkIfAdminArticlesPage);
    window.addEventListener('hashchange', checkIfAdminArticlesPage);
    
    // Add listener for navigation events
    const handleNavigation = () => {
      setTimeout(checkIfAdminArticlesPage, 100);
    };
    
    document.addEventListener('click', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', checkIfAdminArticlesPage);
      window.removeEventListener('pushstate', checkIfAdminArticlesPage);
      window.removeEventListener('hashchange', checkIfAdminArticlesPage);
      document.removeEventListener('click', handleNavigation);
    };
  }, []);
  
  // Initialize and stop the publication service based on auth state and current page
  useEffect(() => {
    const publicationService = PublicationService;
    
    // Only start the service if we're authenticated AND on the admin articles page
    if (session?.access_token && isAdminArticlesPage) {
      console.log('[PublicationContext] Starting publication service - admin articles page detected');
      publicationService.start(session.access_token);
      setIsInitialized(true);
    } else {
      console.log('[PublicationContext] Stopping publication service - not on admin articles page or not authenticated');
      publicationService.stop();
      setIsInitialized(false);
    }
    
    // Cleanup on unmount
    return () => {
      console.log('[PublicationContext] Component unmounting - stopping service');
      publicationService.stop();
    };
  }, [session, isAdminArticlesPage]);
  
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
    if (!isAdminArticlesPage) {
      console.log('[PublicationContext] Not on admin articles page, skipping manual publication check');
      return;
    }
    
    console.log('[PublicationContext] Manually checking publications');
    try {
      await PublicationService.manualCheckPublications();
    } catch (error: any) {
      console.error('[PublicationContext] Error manually checking publications:', error);
      // Don't show toast here to avoid spamming the user
    }
  };
  
  const value = {
    retryPublication,
    isInitialized,
    manualCheckPublications,
    isAdminArticlesPage
  };
  
  return (
    <PublicationContext.Provider value={value}>
      {children}
    </PublicationContext.Provider>
  );
};
