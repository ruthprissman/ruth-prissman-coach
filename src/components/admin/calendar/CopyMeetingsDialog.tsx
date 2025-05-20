
import React, { useState, useEffect } from 'react';
import { GoogleCalendarEvent } from '@/types/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

interface CopyMeetingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googleEvents: GoogleCalendarEvent[];
  onCopySelected: (selectedEventIds: string[]) => Promise<void>;
  isLoading: boolean;
}

export function CopyMeetingsDialog({
  open,
  onOpenChange,
  googleEvents,
  onCopySelected,
  isLoading
}: CopyMeetingsDialogProps) {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [professionalMeetings, setProfessionalMeetings] = useState<GoogleCalendarEvent[]>([]);
  
  // Filter professional meetings when events change
  useEffect(() => {
    const now = new Date();
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    // Filter Google events that are professional meetings (contain "פגישה עם" in the title)
    // and are within the next two weeks
    const filteredMeetings = googleEvents.filter(event => {
      // Check if it's a professional meeting
      const isProfessionalMeeting = event.summary && 
        event.summary.includes("פגישה עם");
      
      // Check if it's within the next two weeks
      const eventDate = event.start?.dateTime ? new Date(event.start.dateTime) : null;
      const isWithinTwoWeeks = eventDate && 
        eventDate >= now && 
        eventDate <= twoWeeksLater;
      
      return isProfessionalMeeting && isWithinTwoWeeks;
    });
    
    setProfessionalMeetings(filteredMeetings);
    
    // By default, select all meetings
    setSelectedEventIds(filteredMeetings.map(meeting => meeting.id));
  }, [googleEvents]);

  const handleToggleEvent = (eventId: string) => {
    setSelectedEventIds(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  const handleToggleAll = () => {
    if (selectedEventIds.length === professionalMeetings.length) {
      // Deselect all
      setSelectedEventIds([]);
    } else {
      // Select all
      setSelectedEventIds(professionalMeetings.map(meeting => meeting.id));
    }
  };

  const handleCopySelected = async () => {
    if (selectedEventIds.length === 0) {
      toast({
        title: "לא נבחרו פגישות",
        description: "יש לבחור לפחות פגישה אחת להעתקה",
        variant: "destructive"
      });
      return;
    }
    
    await onCopySelected(selectedEventIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">העתקת פגישות מקצועיות מיומן Google</DialogTitle>
          <DialogDescription>
            פגישות שכוללות "פגישה עם" בכותרת בטווח של השבועיים הקרובים. סמן את הפגישות שתרצה להעתיק לטבלת פגישות עתידיות.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-500">נמצאו {professionalMeetings.length} פגישות</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToggleAll}
            >
              {selectedEventIds.length === professionalMeetings.length ? 'בטל בחירה של הכל' : 'בחר הכל'}
            </Button>
          </div>
          
          <Separator className="my-2" />
          
          {professionalMeetings.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              לא נמצאו פגישות מקצועיות בטווח התאריכים
            </div>
          ) : (
            <div className="space-y-3">
              {professionalMeetings.map(meeting => {
                const meetingDate = meeting.start?.dateTime ? new Date(meeting.start.dateTime) : null;
                const formattedDate = meetingDate ? format(meetingDate, 'dd/MM/yyyy') : 'תאריך לא ידוע';
                const formattedTime = meetingDate ? format(meetingDate, 'HH:mm') : '';
                
                return (
                  <div key={meeting.id} className="flex items-center space-x-4 p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center h-5 ml-4">
                      <Checkbox 
                        id={`meeting-${meeting.id}`} 
                        checked={selectedEventIds.includes(meeting.id)}
                        onCheckedChange={() => handleToggleEvent(meeting.id)}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{meeting.summary}</div>
                      <div className="text-sm text-gray-500">
                        {formattedDate} | {formattedTime}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button 
            onClick={handleCopySelected} 
            disabled={selectedEventIds.length === 0 || isLoading}
          >
            העתק {selectedEventIds.length} פגישות
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
