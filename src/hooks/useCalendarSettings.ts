
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

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.access_token || isInitialLoadComplete) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching calendar settings from Edge Function...');
        
        const response = await fetch(
          'https://uwqwlltrfvokjlaufguz.supabase.co/functions/v1/get_calendar_settings',
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`שגיאה בהבאת הגדרות יומן: ${response.status}`);
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
        setError(err.message);
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
  }, [session?.access_token, isInitialLoadComplete]);
  
  return { settings, isLoading, error, isInitialLoadComplete };
}
