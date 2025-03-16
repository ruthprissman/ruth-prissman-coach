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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseWithAuth } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { GoogleCalendarEvent } from '@/types/calendar';

interface GoogleCalendarSyncProps {
  onSyncComplete: (success: boolean) => void;
}

const DEFAULT_CALENDAR_ID = 'ruthprissman@gmail.com';

export function GoogleCalendarSync({ onSyncComplete }: GoogleCalendarSyncProps) {
  const { user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(true);
  
  useEffect(() => {
    fetchStoredApiKey();
  }, []);
  
  const fetchStoredApiKey = async () => {
    try {
      setIsApiKeyLoading(true);
      
      if (!session?.access_token) {
        setIsApiKeyLoading(false);
        return;
      }
      
      const supabase = getSupabaseWithAuth(session.access_token);
      
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'google_calendar_api_key')
        .single();
      
      if (error) {
        if (!error.message.includes('No rows found')) {
          console.error('Error fetching API key:', error);
        }
      } else if (data?.value) {
        setStoredApiKey(data.value);
        setApiKey(data.value);
      }
    } catch (error) {
      console.error('Error fetching stored API key:', error);
    } finally {
      setIsApiKeyLoading(false);
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
      
      setStoredApiKey(key);
    } catch (error: any) {
      console.error('Error saving API key:', error);
      toast({
        title: 'שגיאה בשמירת מפתח API',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  const handleSyncClick = () => {
    if (storedApiKey) {
      syncGoogleCalendar(storedApiKey);
    } else {
      setOpen(true);
    }
  };
  
  const syncGoogleCalendar = async (keyToUse?: string) => {
    const keyForSync = keyToUse || apiKey;
    
    if (!keyForSync) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין מפתח API תקין',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (!storedApiKey && apiKey) {
        await saveApiKey(apiKey);
      }
      
      const now = new Date();
      const thirtyDaysLater = addDays(now, 30);
      
      const timeMin = now.toISOString();
      const timeMax = thirtyDaysLater.toISOString();
      
      const calendarId = encodeURIComponent(DEFAULT_CALENDAR_ID);
      const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&key=${keyForSync}`;
      
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
      
      setOpen(false);
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
    <>
      <Button 
        variant="outline" 
        className="flex items-center" 
        onClick={handleSyncClick}
        disabled={isApiKeyLoading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isApiKeyLoading ? 'animate-spin' : ''}`} />
        <span>סנכרן עם Google Calendar</span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>סנכרון Google Calendar</DialogTitle>
            <DialogDescription>
              {!storedApiKey ? 
                'הזן את מפתח ה-API של Google Calendar כדי לסנכרן אירועים פרטיים' :
                'לחץ על כפתור הסנכרון כדי להתחיל'
              }
            </DialogDescription>
          </DialogHeader>
          
          {!storedApiKey && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">מפתח API</Label>
                <Input
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="הזן את מפתח ה-API של Google..."
                />
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            <p>היומן יסונכרן עם החשבון {DEFAULT_CALENDAR_ID}</p>
            <p>הסנכרון יכלול את כל האירועים הפרטיים לטווח של 30 ימים קדימה</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button 
              onClick={() => syncGoogleCalendar()} 
              disabled={isLoading || (!storedApiKey && !apiKey)}
            >
              {isLoading ? 'מסנכרן...' : 'סנכרן יומן'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
