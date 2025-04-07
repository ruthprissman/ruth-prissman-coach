
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CalendarSettings {
  apiKey: string;
  calendarId: string;
}

export function useCalendarSettings() {
  const { session } = useAuth();
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // First check if we have a valid session
    if (session === undefined) {
      // Session is still loading, wait
      return;
    }
    
    setIsSessionChecked(true);
    
    if (!session) {
      console.log('No valid session found for calendar settings fetch:', { sessionExists: !!session });
      setIsLoading(false);
      setError('התחברות לא הושלמה, יש להתחבר מחדש');
      toast({
        title: 'שגיאת התחברות',
        description: 'התחברות לא הושלמה, טען את הדף מחדש ונסה שוב',
        variant: 'destructive',
      });
      return;
    }
  }, [session, toast]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!isSessionChecked || !session || isInitialLoadComplete) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Debug log before making the request
        console.log('Fetching calendar settings, session is valid');
        
        // Making request without Authorization header
        console.log('Making request to get_calendar_settings without Authorization header');
        
        const response = await fetch(
          'https://uwqwlltrfvokjlaufguz.functions.supabase.co/get_calendar_settings',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          }
        );
        
        // Detailed logging of response status
        console.log('Calendar settings response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (!response.ok) {
          console.error('Error response from calendar settings endpoint:', { 
            status: response.status, 
            statusText: response.statusText 
          });
          throw new Error(`שגיאה בהבאת הגדרות יומן: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Calendar settings received:', { 
          apiKeyReceived: !!data.apiKey, 
          calendarIdReceived: !!data.calendarId 
        });
        
        if (!data.apiKey || !data.calendarId) {
          throw new Error('הגדרות יומן חסרות או שגויות');
        }
        
        setSettings({
          apiKey: data.apiKey,
          calendarId: data.calendarId
        });
        
        toast({
          title: 'הגדרות נטענו בהצלחה',
          description: 'הגדרות יומן גוגל נטענו בהצלחה',
          variant: 'default',
        });
        
        console.log('Calendar settings loaded successfully');
      } catch (err: any) {
        console.error('Error fetching calendar settings:', err);
        
        // Improved error handling with more detailed logs
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
          console.error('Network error when fetching calendar settings. Check network connection or CORS settings.');
          setError('שגיאת רשת בהבאת הגדרות יומן. בדוק את חיבור הרשת או הגדרות CORS.');
        } else {
          setError(err.message);
        }
        
        toast({
          title: 'שגיאה בהבאת הגדרות יומן',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setIsInitialLoadComplete(true);
      }
    };
    
    fetchSettings();
  }, [session, isInitialLoadComplete, isSessionChecked, toast]);
  
  return { settings, isLoading, error, isInitialLoadComplete };
}
