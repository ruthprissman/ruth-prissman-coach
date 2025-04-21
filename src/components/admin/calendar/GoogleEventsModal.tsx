
import React from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GoogleCalendarEvent } from '@/types/calendar';

interface GoogleEventsModalProps {
  events: GoogleCalendarEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GoogleEventsModal: React.FC<GoogleEventsModalProps> = ({
  events,
  open,
  onOpenChange,
}) => {
  const formatEventTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    return format(new Date(dateTimeStr), 'HH:mm');
  };

  const formatEventDate = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    return format(new Date(dateTimeStr), 'dd/MM/yyyy');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[80vw] max-w-[90vw]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            אירועים שנטענו מיומן Google
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          {events.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              לא נמצאו אירועים ביומן שלך
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border p-4 hover:bg-gray-50"
                >
                  <h3 className="font-semibold">
                    <span className="text-gray-500">כותרת: </span>
                    {event.summary || 'אירוע ללא כותרת'}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">תאריך: </span>
                      {formatEventDate(event.start?.dateTime)}
                    </p>
                    <p>
                      <span className="text-gray-500">שעת התחלה: </span>
                      {formatEventTime(event.start?.dateTime)}
                    </p>
                    <p>
                      <span className="text-gray-500">שעת סיום: </span>
                      {formatEventTime(event.end?.dateTime)}
                    </p>
                    {event.description && (
                      <p>
                        <span className="text-gray-500">תיאור: </span>
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
