
import React from 'react';
import { format } from 'date-fns';
import { GoogleCalendarEvent } from '@/types/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface GoogleEventsModalProps {
  events: GoogleCalendarEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleEventsModal({ events, open, onOpenChange }: GoogleEventsModalProps) {
  // Only log when the modal is actually opened and has events
  if (open && events.length > 0) {
    console.log('🟣 Modal opened with', events.length, 'events');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>אירועים שנטענו מיומן Google</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4" dir="rtl">
          {events.length === 0 ? (
            <p className="text-muted-foreground">לא נטענו אירועים מהיומן.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div 
                  key={event.id || index} 
                  className="p-4 border rounded-lg"
                >
                  <h3 className="font-semibold mb-2">{event.summary || 'ללא כותרת'}</h3>
                  {event.start?.dateTime && event.end?.dateTime && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>שעת התחלה: {format(new Date(event.start.dateTime), 'dd/MM/yyyy HH:mm')}</p>
                      <p>שעת סיום: {format(new Date(event.end.dateTime), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  )}
                  {event.description && (
                    <p className="mt-2 text-sm">תיאור: {event.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <DialogClose asChild>
            <Button>סגור</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
