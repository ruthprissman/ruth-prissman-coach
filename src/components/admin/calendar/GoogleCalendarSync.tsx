
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
  onSyncComplete: (success: boolean) => void;
}

// Use the provided API key and default calendar
const DEFAULT_CALENDAR_ID = 'ruthprissman@gmail.com';
const DEFAULT_API_KEY = 'AIzaSyBgSG4erByPA_nJ_VwzdDGWk7_8IzMU59o';

export function GoogleCalendarSync({ onSyncComplete }: GoogleCalendarSyncProps) {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSyncClick = () => {
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
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API שגיאה: ${response.status}`);
      }
      
      const data = await response.json();
      const events: GoogleCalendarEvent[] = data.items || [];
      
      await saveEventsToDatabase(events);
      
      toast({
        title: 'סינכרון יומן גוגל הושלם בהצלחה!',
        description: `סונכרנו ${events.length} אירועים מיומן Google`,
      });
      
      onSyncComplete(true);
      
    } catch (error: any) {
      console.error('Error syncing with Google Calendar:', error);
      toast({
        title: 'שגיאה בסנכרון יומן',
        description: error.message,
        variant: 'destructive',
      });
      onSyncComplete(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveApiKey = async (key: string) => {
    try {
      if (!session?.access_token || !key) return;
      
      const supabase = getSupabaseWithAuth(session.access_token);
      
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'google_calendar_api_key',
          value: key,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        throw new Error(`שגיאה בשמירת מפתח API: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error saving API key:', error);
    }
  };
  
  const saveEventsToDatabase = async (events: GoogleCalendarEvent[]) => {
    try {
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      const { error: deleteError } = await supabase
        .from('calendar_slots')
        .delete()
        .not('source_id', 'is', null);
      
      if (deleteError) throw new Error(deleteError.message);
      
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
      
      if (calendarSlots.length > 0) {
        const { error: insertError } = await supabase
          .from('calendar_slots')
          .insert(calendarSlots);
        
        if (insertError) throw new Error(insertError.message);
      }
      
    } catch (error: any) {
      console.error('Error saving events to database:', error);
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
