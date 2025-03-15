
import React, { useState } from 'react';
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

export function GoogleCalendarSync({ onSyncComplete }: GoogleCalendarSyncProps) {
  const { user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch Google Calendar events and process them
  const syncGoogleCalendar = async () => {
    if (!apiKey) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין מפתח API תקין',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Define date range for fetching (30 days ahead)
      const now = new Date();
      const thirtyDaysLater = addDays(now, 30);
      
      // Format dates for API call
      const timeMin = now.toISOString();
      const timeMax = thirtyDaysLater.toISOString();
      
      // Fetch events from Google Calendar API
      const calendarId = encodeURIComponent('ruthi1479@gmail.com');
      const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API שגיאה: ${response.status}`);
      }
      
      const data = await response.json();
      const events: GoogleCalendarEvent[] = data.items || [];
      
      // Process events and save them to the database
      await saveEventsToDatabase(events);
      
      toast({
        title: 'סנכרון הושלם בהצלחה',
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
  
  // Save Google Calendar events to the database
  const saveEventsToDatabase = async (events: GoogleCalendarEvent[]) => {
    try {
      const supabase = getSupabaseWithAuth(session?.access_token);
      
      // First, remove all existing Google Calendar events
      const { error: deleteError } = await supabase
        .from('calendar_slots')
        .delete()
        .not('source_id', 'is', null);
      
      if (deleteError) throw new Error(deleteError.message);
      
      // Process events into calendar slots
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
      
      // Insert new calendar slots from Google Calendar
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
      <Button variant="outline" className="flex items-center" onClick={() => setOpen(true)}>
        <RefreshCw className="h-4 w-4 mr-2" />
        <span>סנכרן עם Google Calendar</span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>סנכרון Google Calendar</DialogTitle>
            <DialogDescription>
              הזן את מפתח ה-API של Google Calendar כדי לסנכרן אירועים פרטיים
            </DialogDescription>
          </DialogHeader>
          
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
            
            <div className="text-sm text-gray-500">
              <p>היומן יסונכרן עם החשבון ruthi1479@gmail.com</p>
              <p>הסנכרון יכלול את כל האירועים הפרטיים לטווח של 30 ימים קדימה</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button onClick={syncGoogleCalendar} disabled={isLoading}>
              {isLoading ? 'מסנכרן...' : 'סנכרן יומן'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
