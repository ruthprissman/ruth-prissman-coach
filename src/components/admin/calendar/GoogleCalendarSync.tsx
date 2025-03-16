
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { RefreshCw } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseWithAuth } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { GoogleCalendarEvent } from '@/types/calendar';

interface GoogleCalendarSyncProps {
  onSyncComplete: (success: boolean, logs?: string[]) => void;
}

// Use the provided API key and default calendar
const DEFAULT_CALENDAR_ID = 'ruthprissman@gmail.com';
const DEFAULT_API_KEY = 'AIzaSyBgSG4erByPA_nJ_VwzdDGWk7_8IzMU59o';

export function GoogleCalendarSync({ onSyncComplete }: GoogleCalendarSyncProps) {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString()} - ${message}`]);
  };
  
  const handleSyncClick = () => {
    setLogs([]);
    syncGoogleCalendar();
  };
  
  const syncGoogleCalendar = async () => {
    try {
      setIsLoading(true);
      
      // Store the API key if not already stored
      await saveApiKey(DEFAULT_API_KEY);
      
      const now = new Date();
      const thirtyDaysLater = addDays(now, 30);
      
      const timeMin = now.toISOString();
      const timeMax = thirtyDaysLater.toISOString();
      
      const calendarId = encodeURIComponent(DEFAULT_CALENDAR_ID);
      const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&key=${DEFAULT_API_KEY}`;
      
      addLog(`בקשת API נשלחה: ${url}`);
      
      const response = await fetch(url);
      addLog(`סטטוס תגובה: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`API שגיאה: ${response.status}`);
      }
      
      const data = await response.json();
      addLog(`התקבלו ${data.items?.length || 0} אירועים מיומן Google`);
      addLog(`תגובת API מלאה: ${JSON.stringify(data, null, 2)}`);
      
      const events: GoogleCalendarEvent[] = data.items || [];
      
      await saveEventsToDatabase(events);
      
      toast({
        title: 'סינכרון יומן גוגל הושלם בהצלחה!',
        description: `סונכרנו ${events.length} אירועים מיומן Google`,
      });
      
      onSyncComplete(true, logs);
      
    } catch (error: any) {
      console.error('Error syncing with Google Calendar:', error);
      addLog(`שגיאה: ${error.message}`);
      toast({
        title: 'שגיאה בסנכרון יומן',
        description: error.message,
        variant: 'destructive',
      });
      onSyncComplete(false, logs);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveApiKey = async (key: string) => {
    try {
      if (!session?.access_token || !key) return;
      
      const supabase = getSupabaseWithAuth(session.access_token);
      
      addLog('שומר את מפתח API ב-Supabase');
      
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'google_calendar_api_key',
          value: key,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        addLog(`שגיאה בשמירת מפתח API: ${error.message}`);
        throw new Error(`שגיאה בשמירת מפתח API: ${error.message}`);
      }
      
      addLog('מפתח API נשמר בהצלחה');
    } catch (error: any) {
      console.error('Error saving API key:', error);
      addLog(`שגיאה בשמירת מפתח API: ${error.message}`);
    }
  };
  
  const saveEventsToDatabase = async (events: GoogleCalendarEvent[]) => {
    try {
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      addLog('מוחק אירועים קיימים מהיומן');
      
      const { error: deleteError } = await supabase
        .from('calendar_slots')
        .delete()
        .not('source_id', 'is', null);
      
      if (deleteError) {
        addLog(`שגיאה במחיקת אירועים קיימים: ${deleteError.message}`);
        throw new Error(deleteError.message);
      }
      
      addLog('אירועים קיימים נמחקו בהצלחה');
      
      const calendarSlots = events.map(event => {
        const startDate = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);
        
        return {
          date: format(startDate, 'yyyy-MM-dd'),
          day_of_week: startDate.getDay(),
          start_time: format(startDate, 'HH:mm'),
          end_time: format(endDate, 'HH:mm'),
          status: 'private',
          is_recurring: false,
          source_id: event.id,
          notes: event.summary
        };
      });
      
      addLog(`מוסיף ${calendarSlots.length} אירועים חדשים למסד הנתונים`);
      
      if (calendarSlots.length > 0) {
        const { error: insertError } = await supabase
          .from('calendar_slots')
          .insert(calendarSlots);
        
        if (insertError) {
          addLog(`שגיאה בהוספת אירועים: ${insertError.message}`);
          throw new Error(insertError.message);
        }
        
        addLog('אירועים נוספו בהצלחה למסד הנתונים');
      }
      
    } catch (error: any) {
      console.error('Error saving events to database:', error);
      addLog(`שגיאה בשמירת אירועים: ${error.message}`);
      throw new Error(`שגיאה בשמירת אירועים: ${error.message}`);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      className="flex items-center" 
      onClick={handleSyncClick}
      disabled={isLoading}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      <span>סנכרן עם Google Calendar</span>
    </Button>
  );
}
