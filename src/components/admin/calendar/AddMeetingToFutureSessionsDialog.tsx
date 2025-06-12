
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { Patient } from '@/types/patient';
import { GoogleCalendarEvent } from '@/types/calendar';
import { useSessionTypes, getSessionTypeDuration } from '@/hooks/useSessionTypes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddMeetingToFutureSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googleEvent: GoogleCalendarEvent | null;
  clientId: number | null;
  onAdded?: () => void;
}

const AddMeetingToFutureSessionsDialog: React.FC<AddMeetingToFutureSessionsDialogProps> = ({
  open,
  onOpenChange,
  googleEvent,
  clientId,
  onAdded,
}) => {
  const { toast } = useToast();
  const { data: sessionTypes, isLoading: isLoadingSessionTypes } = useSessionTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionTypeId, setSelectedSessionTypeId] = useState<number | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      if (clientId) {
        try {
          const supabase = supabaseClient();
          const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', clientId)
            .single();
            
          if (error) throw error;
          setPatient(data as Patient);
        } catch (error) {
          console.error('Error fetching patient:', error);
        }
      }
    };
    
    if (open) {
      fetchPatient();
      // Set default session type to the first one (usually regular)
      if (sessionTypes && sessionTypes.length > 0) {
        const defaultType = sessionTypes.find(type => type.is_default) || sessionTypes[0];
        setSelectedSessionTypeId(defaultType.id);
      }
    }
  }, [clientId, open, sessionTypes]);

  const formatEventDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
    } catch (e) {
      return dateTime;
    }
  };

  const handleSubmit = async () => {
    if (!googleEvent || !clientId || !selectedSessionTypeId) {
      toast({
        title: "שגיאה",
        description: "חסרים נתונים נדרשים",
        variant: "destructive",
      });
      return;
    }

    if (!googleEvent.start?.dateTime) {
      toast({
        title: "שגיאה",
        description: "אין תאריך התחלה לאירוע",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const startDate = new Date(googleEvent.start.dateTime);
      
      // Calculate end time based on session type duration
      const duration = getSessionTypeDuration(selectedSessionTypeId, sessionTypes);
      const endDate = new Date(startDate.getTime() + duration * 60000); // duration is in minutes
      
      console.log('Adding future session with session type:', {
        sessionTypeId: selectedSessionTypeId,
        duration: duration,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const supabase = supabaseClient();
      const { error } = await supabase
        .from('future_sessions')
        .insert({
          patient_id: clientId,
          session_date: startDate.toISOString(),
          meeting_type: 'Zoom', // Default to Zoom, can be made configurable later
          session_type_id: selectedSessionTypeId,
          status: 'Scheduled',
        });

      if (error) throw error;

      toast({
        title: "פגישה נוספה בהצלחה",
        description: `הפגישה נוספה לפגישות עתידיות עם משך זמן של ${duration} דקות`,
      });

      if (onAdded) onAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding future session:', error);
      toast({
        title: "שגיאה בהוספת פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSessionType = sessionTypes?.find(type => type.id === selectedSessionTypeId);
  const duration = selectedSessionType ? selectedSessionType.duration_minutes : 90;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">
            הוספת פגישה לפגישות עתידיות
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2" dir="rtl">
          <div className="space-y-2">
            <Label className="text-purple-700">פרטי הפגישה</Label>
            <div className="bg-purple-50 p-3 rounded-md">
              <div className="font-medium">{googleEvent?.summary}</div>
              <div className="text-sm text-gray-600 mt-1">
                {googleEvent?.start?.dateTime && formatEventDateTime(googleEvent.start.dateTime)}
              </div>
              {patient && (
                <div className="text-sm text-purple-700 mt-1">
                  לקוח: {patient.name}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_type" className="text-purple-700">סוג פגישה</Label>
            <Select
              value={selectedSessionTypeId ? selectedSessionTypeId.toString() : undefined}
              onValueChange={(value) => setSelectedSessionTypeId(Number(value))}
            >
              <SelectTrigger className="border-purple-200 focus-visible:ring-purple-500">
                <SelectValue placeholder="בחר סוג פגישה" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingSessionTypes ? (
                  <div className="py-2 px-4 text-sm text-muted-foreground">טוען...</div>
                ) : (
                  sessionTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} ({type.duration_minutes} דקות)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedSessionType && (
              <div className="text-sm text-gray-600">
                משך הפגישה: {duration} דקות
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSessionTypeId}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? 'מוסיף פגישה...' : 'הוסף פגישה'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMeetingToFutureSessionsDialog;
