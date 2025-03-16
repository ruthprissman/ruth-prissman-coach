
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

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

  useEffect(() => {
    // First check if we have a valid session
    if (session === undefined) {
      // Session is still loading, wait
      return;
    }
    
    setIsSessionChecked(true);
    
    if (!session || !session.access_token) {
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
  }, [session]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!isSessionChecked || !session?.access_token || isInitialLoadComplete) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Debug log with session information and token format
        const authHeader = 'Bearer ' + session.access_token;
        console.log('Fetching calendar settings with authorization:', { 
          sessionId: session.user.id,
          hasAccessToken: !!session.access_token,
          tokenLength: session.access_token.length,
          authHeaderPrefix: authHeader.substring(0, 20) + '...'
        });
        
        // Making request with explicit Authorization header format
        console.log('Making request to get_calendar_settings with formatted Authorization header');
        
        const response = await fetch(
          'https://uwqwlltrfvokjlaufguz.functions.supabase.co/get_calendar_settings',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
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
        } else if (err.message && err.message.includes('401')) {
          console.error('Authorization error (401) when fetching calendar settings. Token might be invalid.');
          setError('שגיאת הרשאות בהבאת הגדרות יומן. יש להתחבר מחדש למערכת.');
        } else if (err.message && err.message.includes('Unauthorized')) {
          console.error('Authorization error (Unauthorized) when fetching calendar settings. Check if token is valid.');
          setError('שגיאת הרשאות בהבאת הגדרות יומן. יש להתחבר מחדש למערכת.');
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
  }, [session?.access_token, isInitialLoadComplete, isSessionChecked]);
  
  return { settings, isLoading, error, isInitialLoadComplete };
}
