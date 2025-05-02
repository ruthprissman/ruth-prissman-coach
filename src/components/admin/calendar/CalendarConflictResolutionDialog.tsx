
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Calendar, Check, Clock, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarSlot } from '@/types/calendar';
import { supabaseClient } from '@/lib/supabaseClient';

// Component version for debugging
const COMPONENT_VERSION = "1.0.0";

interface CalendarConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googleCalendarEvent: CalendarSlot | null;
  futureSessionEvent: CalendarSlot | null;
  date: string;
  onResolutionComplete: () => void;
  availableHours: string[];
  createGoogleCalendarEvent: (summary: string, startDateTime: string, endDateTime: string, description: string) => Promise<boolean>;
  deleteGoogleCalendarEvent: (eventId: string) => Promise<boolean>;
  updateGoogleCalendarEvent: (eventId: string, summary: string, startDateTime: string, endDateTime: string, description: string) => Promise<boolean>;
}

const CalendarConflictResolutionDialog: React.FC<CalendarConflictResolutionDialogProps> = ({
  open,
  onOpenChange,
  googleCalendarEvent,
  futureSessionEvent,
  date,
  onResolutionComplete,
  availableHours,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDeleteGoogleAlert, setShowDeleteGoogleAlert] = useState<boolean>(false);
  const [showDeleteFutureSessionAlert, setShowDeleteFutureSessionAlert] = useState<boolean>(false);
  
  // Setup state for time changes
  const [googleEventTime, setGoogleEventTime] = useState<string>(
    googleCalendarEvent?.exactStartTime?.split(':')[0] + ':00' || ''
  );
  
  const [futureSessionTime, setFutureSessionTime] = useState<string>(
    futureSessionEvent?.exactStartTime?.split(':')[0] + ':00' || ''
  );

  // Formatted client names
  const googleClientName = googleCalendarEvent?.notes?.replace('פגישה עם ', '') || 'לקוח/ה לא מוגדר';
  const futureSessionClientName = futureSessionEvent?.notes?.replace('פגישה עם ', '') || 'לקוח/ה לא מוגדר';

  console.log(`CONFLICT_RESOLUTION_DEBUG: Dialog opened with conflicting events:`, {
    date,
    googleEvent: {
      name: googleClientName,
      time: googleCalendarEvent?.exactStartTime,
      id: googleCalendarEvent?.googleEvent?.id
    },
    futureSession: {
      name: futureSessionClientName,
      time: futureSessionEvent?.exactStartTime,
      id: futureSessionEvent?.futureSession?.id
    }
  });
  
  const handleUpdateGoogleEvent = async () => {
    if (!googleCalendarEvent?.googleEvent?.id || !googleEventTime) return;
    
    setIsLoading(true);
    try {
      console.log(`CONFLICT_RESOLUTION_DEBUG: Updating Google Calendar event ${googleCalendarEvent.googleEvent.id} to ${googleEventTime}`);
      
      const timeParts = googleEventTime.split(':');
      const hourInt = parseInt(timeParts[0], 10);
      
      // Create date strings for the updated event
      const startDate = new Date(`${date}T${googleEventTime}`);
      const endDate = new Date(startDate);
      endDate.setMinutes(startDate.getMinutes() + 90); // 90 minutes meeting
      
      const startDateISO = startDate.toISOString();
      const endDateISO = endDate.toISOString();
      
      const success = await updateGoogleCalendarEvent(
        googleCalendarEvent.googleEvent.id,
        googleCalendarEvent.notes || 'פגישה',
        startDateISO,
        endDateISO,
        googleCalendarEvent.description || ''
      );
      
      if (success) {
        toast({
          title: 'אירוע Google Calendar עודכן',
          description: `הפגישה עם ${googleClientName} נקבעה לשעה ${googleEventTime}`,
        });
      } else {
        throw new Error('שגיאה בעדכון אירוע ביומן גוגל');
      }
    } catch (error: any) {
      console.error('Error updating Google Calendar event:', error);
      toast({
        title: 'שגיאה בעדכון אירוע',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      onResolutionComplete();
      onOpenChange(false);
    }
  };
  
  const handleUpdateFutureSession = async () => {
    if (!futureSessionEvent?.futureSession?.id || !futureSessionTime) return;
    
    setIsLoading(true);
    try {
      console.log(`CONFLICT_RESOLUTION_DEBUG: Updating future session ${futureSessionEvent.futureSession.id} to ${futureSessionTime}`);
      
      const supabase = await supabaseClient();
      const sessionId = futureSessionEvent.futureSession.id;
      
      // Create a new Date object for the updated session date and time
      const sessionDate = new Date(`${date}T${futureSessionTime}`);
      
      // Update the future session in the database
      const { error } = await supabase
        .from('future_sessions')
        .update({ session_date: sessionDate.toISOString() })
        .eq('id', sessionId);
      
      if (error) throw new Error(error.message);
      
      toast({
        title: 'פגישה עודכנה',
        description: `הפגישה עם ${futureSessionClientName} נקבעה לשעה ${futureSessionTime}`,
      });
    } catch (error: any) {
      console.error('Error updating future session:', error);
      toast({
        title: 'שגיאה בעדכון פגישה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      onResolutionComplete();
      onOpenChange(false);
    }
  };
  
  const handleDeleteGoogleEvent = async () => {
    if (!googleCalendarEvent?.googleEvent?.id) return;
    
    setIsLoading(true);
    try {
      console.log(`CONFLICT_RESOLUTION_DEBUG: Deleting Google Calendar event ${googleCalendarEvent.googleEvent.id}`);
      
      const success = await deleteGoogleCalendarEvent(googleCalendarEvent.googleEvent.id);
      
      if (success) {
        toast({
          title: 'אירוע Google Calendar נמחק',
          description: `הפגישה עם ${googleClientName} נמחקה מיומן גוגל`,
        });
      } else {
        throw new Error('שגיאה במחיקת אירוע ביומן גוגל');
      }
    } catch (error: any) {
      console.error('Error deleting Google Calendar event:', error);
      toast({
        title: 'שגיאה במחיקת אירוע',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowDeleteGoogleAlert(false);
      onResolutionComplete();
      onOpenChange(false);
    }
  };
  
  const handleDeleteFutureSession = async () => {
    if (!futureSessionEvent?.futureSession?.id) return;
    
    setIsLoading(true);
    try {
      console.log(`CONFLICT_RESOLUTION_DEBUG: Deleting future session ${futureSessionEvent.futureSession.id}`);
      
      const supabase = await supabaseClient();
      const sessionId = futureSessionEvent.futureSession.id;
      
      // Delete the future session from the database
      const { error } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw new Error(error.message);
      
      toast({
        title: 'פגישה נמחקה',
        description: `הפגישה עם ${futureSessionClientName} נמחקה`,
      });
    } catch (error: any) {
      console.error('Error deleting future session:', error);
      toast({
        title: 'שגיאה במחיקת פגישה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowDeleteFutureSessionAlert(false);
      onResolutionComplete();
      onOpenChange(false);
    }
  };
  
  const handleAddGoogleEventToDatabase = async () => {
    if (!googleCalendarEvent) return;
    
    setIsLoading(true);
    try {
      console.log(`CONFLICT_RESOLUTION_DEBUG: Adding Google event to future_sessions table: ${googleClientName}`);
      
      const supabase = await supabaseClient();
      const clientName = googleClientName;
      
      // Check if the client exists
      const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('id, name')
        .ilike('name', `%${clientName}%`)
        .limit(1);
      
      if (patientError) throw new Error(patientError.message);
      
      let patientId;
      
      if (patients && patients.length > 0) {
        patientId = patients[0].id;
      } else {
        // Create a new patient
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({ name: clientName })
          .select();
        
        if (createError) throw new Error(createError.message);
        if (newPatient && newPatient.length > 0) {
          patientId = newPatient[0].id;
        } else {
          throw new Error('שגיאה ביצירת לקוח חדש');
        }
      }
      
      // Create a new session
      const { error: sessionError } = await supabase
        .from('future_sessions')
        .insert({
          patient_id: patientId,
          session_date: new Date(`${date}T${googleCalendarEvent.exactStartTime || '00:00'}`).toISOString(),
          meeting_type: googleCalendarEvent.notes?.includes('זום') ? 'Zoom' : 
                        googleCalendarEvent.notes?.includes('טלפון') ? 'Phone' : 'In-Person',
          title: googleCalendarEvent.description || '',
          status: 'Scheduled'
        });
      
      if (sessionError) throw new Error(sessionError.message);
      
      toast({
        title: 'פגישה נוספה למאגר',
        description: `הפגישה עם ${googleClientName} נוספה לטבלת הפגישות`,
      });
    } catch (error: any) {
      console.error('Error adding Google event to database:', error);
      toast({
        title: 'שגיאה בהוספת פגישה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      onResolutionComplete();
      onOpenChange(false);
    }
  };
  
  const handleAddDatabaseEventToGoogle = async () => {
    if (!futureSessionEvent) return;
    
    setIsLoading(true);
    try {
      console.log(`CONFLICT_RESOLUTION_DEBUG: Adding future session to Google Calendar: ${futureSessionClientName}`);
      
      const sessionTime = futureSessionEvent.exactStartTime || '00:00';
      const startTime = new Date(`${date}T${sessionTime}`);
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + 90); // 90 minutes meeting
      
      const success = await createGoogleCalendarEvent(
        futureSessionEvent.notes || `פגישה עם ${futureSessionClientName}`,
        startTime.toISOString(),
        endTime.toISOString(),
        futureSessionEvent.description || ''
      );
      
      if (success) {
        toast({
          title: 'אירוע נוסף ליומן גוגל',
          description: `הפגישה עם ${futureSessionClientName} נוספה ליומן גוגל`,
        });
      } else {
        throw new Error('שגיאה ביצירת אירוע ביומן גוגל');
      }
    } catch (error: any) {
      console.error('Error adding event to Google Calendar:', error);
      toast({
        title: 'שגיאה בהוספת אירוע',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      onResolutionComplete();
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center mb-4">התנגשות בין פגישות</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-6 py-4">
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">פגישה מיומן גוגל</h3>
              </div>
              
              <p className="mb-3">
                פגישה עם <span className="font-bold">{googleClientName}</span>
              </p>
              
              <p className="mb-4 text-sm text-gray-600">
                זמן מקורי: {googleCalendarEvent?.exactStartTime || 'לא ידוע'} - {googleCalendarEvent?.exactEndTime || 'לא ידוע'}
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google-time">שינוי זמן הפגישה</Label>
                  <Select 
                    value={googleEventTime}
                    onValueChange={setGoogleEventTime}
                  >
                    <SelectTrigger id="google-time" className="w-full">
                      <SelectValue placeholder="בחר זמן חדש" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableHours.map(hour => (
                        <SelectItem key={`google-${hour}`} value={hour}>{hour}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowDeleteGoogleAlert(true)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחק מיומן גוגל
                  </Button>
                  
                  <Button 
                    className="flex-1"
                    onClick={handleUpdateGoogleEvent}
                    disabled={isLoading || !googleEventTime}
                  >
                    <Clock className="h-4 w-4 ml-2" />
                    עדכן זמן
                  </Button>
                </div>
                
                {!futureSessionEvent?.fromFutureSession && (
                  <Button 
                    variant="default" 
                    className="w-full mt-2"
                    onClick={handleAddGoogleEventToDatabase}
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4 ml-2" />
                    הוסף למאגר הפגישות
                  </Button>
                )}
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">פגישה ממאגר הפגישות</h3>
              </div>
              
              <p className="mb-3">
                פגישה עם <span className="font-bold">{futureSessionClientName}</span>
              </p>
              
              <p className="mb-4 text-sm text-gray-600">
                זמן מקורי: {futureSessionEvent?.exactStartTime || 'לא ידוע'} - {futureSessionEvent?.exactEndTime || 'לא ידוע'}
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fs-time">שינוי זמן הפגישה</Label>
                  <Select 
                    value={futureSessionTime}
                    onValueChange={setFutureSessionTime}
                  >
                    <SelectTrigger id="fs-time" className="w-full">
                      <SelectValue placeholder="בחר זמן חדש" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableHours.map(hour => (
                        <SelectItem key={`fs-${hour}`} value={hour}>{hour}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowDeleteFutureSessionAlert(true)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחק פגישה
                  </Button>
                  
                  <Button 
                    className="flex-1"
                    onClick={handleUpdateFutureSession}
                    disabled={isLoading || !futureSessionTime}
                  >
                    <Clock className="h-4 w-4 ml-2" />
                    עדכן זמן
                  </Button>
                </div>
                
                {!futureSessionEvent?.inGoogleCalendar && (
                  <Button 
                    variant="default" 
                    className="w-full mt-2"
                    onClick={handleAddDatabaseEventToGoogle}
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4 ml-2" />
                    הוסף ליומן גוגל
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-center gap-2">
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alert for deleting Google event */}
      <AlertDialog open={showDeleteGoogleAlert} onOpenChange={setShowDeleteGoogleAlert}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את האירוע מיומן גוגל?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תסיר את האירוע "{googleCalendarEvent?.notes}" מיומן גוגל שלך.
              פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoogleEvent}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              מחק אירוע
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Alert for deleting Future Session */}
      <AlertDialog open={showDeleteFutureSessionAlert} onOpenChange={setShowDeleteFutureSessionAlert}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את הפגישה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תסיר את הפגישה עם {futureSessionClientName} ממאגר הפגישות.
              פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFutureSession}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              מחק פגישה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CalendarConflictResolutionDialog;
