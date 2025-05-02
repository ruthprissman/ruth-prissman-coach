
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarSlot } from '@/types/calendar';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { formatInTimeZone } from '@/utils/dateTimeUtils';

// Component version for debugging
const COMPONENT_VERSION = "1.0.1";
console.log(`LOV_DEBUG_ADD_MEETING: Component loaded, version ${COMPONENT_VERSION}`);

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Extract patient name from meeting title
  const getPatientName = () => {
    if (!meetingSlot?.notes) return 'לקוח/ה';
    
    const match = meetingSlot.notes.match(/פגישה עם (.*)/);
    return match ? match[1] : 'לקוח/ה';
  };

  const handleAddToFutureSessions = async () => {
    if (!meetingSlot) return;
    
    setIsLoading(true);
    
    try {
      console.log(`MEETING_SAVE_DEBUG: Adding meeting to future sessions`, {
        date: meetingSlot.date,
        hour: meetingSlot.hour,
        exactStartTime: meetingSlot.exactStartTime,
        patient: getPatientName()
      });
      
      const supabase = await supabaseClient();
      const patientName = getPatientName();
      
      // Create a new patient or find existing one
      let patientId: string | undefined;
      
      const { data: existingPatients, error: patientFindError } = await supabase
        .from('patients')
        .select('id')
        .ilike('name', patientName)
        .limit(1);
        
      if (patientFindError) {
        throw new Error(`שגיאה בחיפוש לקוח: ${patientFindError.message}`);
      }
      
      if (existingPatients?.length) {
        patientId = existingPatients[0].id;
      } else {
        // Create new patient
        const { data: newPatient, error: newPatientError } = await supabase
          .from('patients')
          .insert({ name: patientName })
          .select('id');
          
        if (newPatientError) {
          throw new Error(`שגיאה ביצירת לקוח: ${newPatientError.message}`);
        }
        
        if (newPatient?.length) {
          patientId = newPatient[0].id;
        } else {
          throw new Error('לא ניתן ליצור לקוח חדש');
        }
      }
      
      // Create the session date - use exact time if available
      const sessionDate = meetingSlot.exactStartTime 
        ? new Date(`${meetingSlot.date}T${meetingSlot.exactStartTime}`)
        : new Date(`${meetingSlot.date}T${meetingSlot.hour}`);
      
      console.log(`MEETING_SAVE_DEBUG: Creating session with date: ${sessionDate.toISOString()}`);
      
      const { error: sessionError } = await supabase
        .from('future_sessions')
        .insert({
          patient_id: patientId,
          session_date: sessionDate.toISOString(),
          meeting_type: meetingSlot.notes?.includes('זום') ? 'Zoom' : 'Office',
          status: 'Scheduled',
          title: meetingSlot.description || meetingSlot.notes,
          google_calendar_event_id: meetingSlot.googleEvent?.id
        });
        
      if (sessionError) {
        throw new Error(`שגיאה ביצירת פגישה: ${sessionError.message}`);
      }
      
      toast({
        title: 'פגישה נוספה בהצלחה',
        description: `הפגישה עם ${patientName} נוספה למאגר הפגישות`
      });
      
      onSessionCreated();
    } catch (error: any) {
      console.error('MEETING_SAVE_DEBUG: Error adding to future sessions:', error);
      toast({
        title: 'שגיאה בהוספת פגישה',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוסף פגישה לפגישות עתידיות</DialogTitle>
        </DialogHeader>
        
        <div>
          {meetingSlot ? (
            <div className="space-y-2">
              <p className="font-medium">פרטי הפגישה:</p>
              <p>שם הלקוח: {getPatientName()}</p>
              <p>תאריך: {meetingSlot.date}</p>
              <p>שעה: {meetingSlot.exactStartTime || meetingSlot.hour}</p>
              {meetingSlot.description && (
                <p>תיאור: {meetingSlot.description}</p>
              )}
            </div>
          ) : (
            <p>אנא בחר פגישה</p>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleAddToFutureSessions}
            disabled={isLoading || !meetingSlot}
          >
            {isLoading ? 'מוסיף...' : 'שמור פגישה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMeetingToFutureSessionsDialog;
