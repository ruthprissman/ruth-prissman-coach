
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
  
  // Improved path detection - specifically checks for admin/articles path segments
  useEffect(() => {
    const checkIfAdminArticlesPage = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        // Specific check for ONLY /admin/articles path (not subpaths)
        const isAdminArticles = path.includes('/admin/articles');
        console.log('[PublicationContext] Path check:', path, 'isAdminArticles:', isAdminArticles);
        setIsAdminArticlesPage(isAdminArticles);
      }
    };
    
    // Initial check
    checkIfAdminArticlesPage();
    
    // Add event listeners for route changes
    const handleRouteChange = () => {
      console.log('[PublicationContext] Route change detected');
      setTimeout(checkIfAdminArticlesPage, 100);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('pushstate', handleRouteChange);
    
    // Custom event for React Router navigation
    document.addEventListener('click', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('pushstate', handleRouteChange);
      document.removeEventListener('click', handleRouteChange);
    };
  }, []);
  
  // Improved service management - ensure service is always properly stopped when conditions change
  useEffect(() => {
    if (!session?.access_token || !isAdminArticlesPage) {
      console.log('[PublicationContext] Stopping service - conditions not met:', {
        hasSession: !!session?.access_token,
        isAdminArticlesPage
      });
      PublicationService.stop();
      setIsInitialized(false);
      return;
    }
    
    // Only start if we have both session and are on admin/articles page
    if (session?.access_token && isAdminArticlesPage) {
      console.log('[PublicationContext] Starting service - admin articles page with auth');
      PublicationService.start(session.access_token);
      setIsInitialized(true);
      
      // One-time manual check on service start
      setTimeout(() => {
        if (isAdminArticlesPage) {
          console.log('[PublicationContext] Initial publications check');
          PublicationService.manualCheckPublications();
        }
      }, 2000);
    }
    
    // Always ensure service is stopped when component unmounts or conditions change
    return () => {
      console.log('[PublicationContext] Cleaning up service');
      PublicationService.stop();
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
    
    if (!isInitialized) {
      console.log('[PublicationContext] Service not initialized, skipping manual check');
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
