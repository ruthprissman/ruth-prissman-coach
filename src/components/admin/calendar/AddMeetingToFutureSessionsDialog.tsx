
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarSlot } from '@/types/calendar';

export interface AddMeetingToFutureSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingSlot: CalendarSlot | null;
  onSessionCreated: () => void;
}

const AddMeetingToFutureSessionsDialog: React.FC<AddMeetingToFutureSessionsDialogProps> = ({
  open,
  onOpenChange,
  meetingSlot,
  onSessionCreated
}) => {
  // Add implementation here or use a placeholder if it's a stub
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוסף פגישה לפגישות עתידיות</DialogTitle>
        </DialogHeader>
        
        <div>
          {meetingSlot ? (
            <p>פגישה בתאריך {meetingSlot.date} שעה {meetingSlot.hour}</p>
          ) : (
            <p>אנא בחר פגישה</p>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => {
            onSessionCreated();
            onOpenChange(false);
          }}>
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMeetingToFutureSessionsDialog;
