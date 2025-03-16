
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

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.access_token) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
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
        
        if (!data.apiKey || !data.calendarId) {
          throw new Error('הגדרות יומן חסרות או שגויות');
        }
        
        setSettings({
          apiKey: data.apiKey,
          calendarId: data.calendarId
        });
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
      }
    };
    
    fetchSettings();
  }, [session?.access_token]);
  
  return { settings, isLoading, error };
}
