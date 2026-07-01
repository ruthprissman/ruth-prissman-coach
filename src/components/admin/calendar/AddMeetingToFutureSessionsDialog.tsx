import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { Patient } from '@/types/patient';
import { GoogleCalendarEvent } from '@/types/calendar';
import { usePatients } from '@/hooks/usePatients';
import { useSessionTypes, getSessionTypeDuration } from '@/hooks/useSessionTypes';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
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
import { Checkbox } from '@/components/ui/checkbox';

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
  clientId: initialClientId,
  onAdded,
}) => {
  const { toast } = useToast();
  const { data: sessionTypes, isLoading: isLoadingSessionTypes } = useSessionTypes();
  const { data: patients = [], isLoading: isLoadingPatients } = usePatients();
  const { createEvent, deleteEvent, isAuthenticated } = useGoogleOAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ניהול בחירת לקוח
  const [selectedClientId, setSelectedClientId] = useState<number | null>(initialClientId || null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedSessionTypeId, setSelectedSessionTypeId] = useState<number | null>(null);
  const [shouldUpdateGoogleCalendar, setShouldUpdateGoogleCalendar] = useState(false);

  // פונקציה שמנסה לשלוף את שם הלקוח מתוך summary
  function guessClientFromGoogleEvent(summary: string | undefined, patientsList: Patient[]): number | null {
    if (!summary || !Array.isArray(patientsList)) return null;
    // מחפש "פגישה עם"
    const prefix = "פגישה עם";
    if (summary.startsWith(prefix)) {
      const nameGuess = summary.replace(prefix, '').trim();
      if (!nameGuess) return null;
      // השוואת שם מדוייקת/חלקית מימין-לשמאל
      const found = patientsList.find(
        p => p.name.trim() === nameGuess ||
        p.name.trim().includes(nameGuess) ||
        nameGuess.includes(p.name.trim())
      );
      return found ? found.id : null;
    }
    return null;
  }

  useEffect(() => {
    if (open) {
      let newClientId: number | null = initialClientId || null;
      // ננסה לנחש מתוך השם של האירוע, רק אם עוד לא נבחר לקוח התחלתי
      if (!initialClientId && googleEvent?.summary && patients.length > 0) {
        const guessed = guessClientFromGoogleEvent(googleEvent.summary, patients);
        if (guessed) {
          newClientId = guessed;
        }
      }
      setSelectedClientId(newClientId);
      // נאתחל את סוג הפגישה
      if (sessionTypes && sessionTypes.length > 0) {
        const defaultType = sessionTypes.find(type => type.is_default) || sessionTypes[0];
        setSelectedSessionTypeId(defaultType.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialClientId, sessionTypes, googleEvent, patients]);

  useEffect(() => {
    if (selectedClientId) {
      const found = patients.find(p => p.id === selectedClientId) ?? null;
      setPatient(found);
    } else {
      setPatient(null);
    }
  }, [selectedClientId, patients]);

  // בדיקה אם נדרש עדכון של יומן Google
  useEffect(() => {
    if (googleEvent && selectedSessionTypeId && sessionTypes) {
      const requiredDuration = getSessionTypeDuration(selectedSessionTypeId, sessionTypes);
      const currentDuration = getCurrentEventDuration();
      
      // אם הפגישה הנוכחית קצרה יותר מהנדרש, נציע עדכון
      if (currentDuration && currentDuration < requiredDuration) {
        setShouldUpdateGoogleCalendar(true);
      } else {
        setShouldUpdateGoogleCalendar(false);
      }
    }
  }, [googleEvent, selectedSessionTypeId, sessionTypes]);

  const formatEventDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: he });
    } catch (e) {
      return dateTime;
    }
  };

  // נוסיף פונקציה בראש הקובץ להמרת זמן ל-Asia/Jerusalem בפורמט ISO מלא כולל אופסט
  function googleDateTimeToIsraelISOString(dateTimeStr: string): string {
    try {
      // נשתמש ב-date-fns-tz כדי להמיר תמיד ל-Asia/Jerusalem
      // dateTimeStr אמור להיות בפורמט ISO
      
      // נבנה Date מה-string (יכול להיות עם Z או עם אופסט)
      const dateObj = new Date(dateTimeStr);
      // נוציא פורמט ISO עם אופסט +03:00 כמו שהיינו רוצים ב-DB (שקול לזמן ישראל)
      // דוגמה: 2025-06-14T13:30:00+03:00
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getSeconds()).padStart(2, "0");
      // Israel time is always +03:00 in summer
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000+03:00`;
    } catch (e) {
      // fallback: מחזיר כמו שהגיע
      console.error("FAILED to convert to Israel ISO", dateTimeStr, e);
      return dateTimeStr;
    }
  }

  // מחשב שעת סיום צפויה (אבל לא שולח למסד הנתונים – טריגר יתפוס)
  const computeEndTimePreview = (start: string | undefined, durationMin: number) => {
    if (!start) return null;
    try {
      const startDt = new Date(start);
      const endDt = new Date(startDt.getTime() + durationMin * 60000);
      // פורמט יפה להצגה
      return format(endDt, 'dd/MM/yyyy HH:mm', { locale: he });
    } catch {
      return null;
    }
  };

  // פונקציה לחישוב משך הפגישה הנוכחית ביומן Google
  const getCurrentEventDuration = (): number | null => {
    if (!googleEvent?.start?.dateTime || !googleEvent?.end?.dateTime) {
      return null;
    }
    
    const startTime = new Date(googleEvent.start.dateTime).getTime();
    const endTime = new Date(googleEvent.end.dateTime).getTime();
    const durationMs = endTime - startTime;
    
    return Math.round(durationMs / (1000 * 60)); // החזרה בדקות
  };

  // פונקציה לעדכון פגישה ביומן Google
  const updateGoogleCalendarEvent = async (requiredDuration: number): Promise<boolean> => {
    try {
      if (!googleEvent?.start?.dateTime || !googleEvent.id) {
        throw new Error('חסרים נתוני פגישה');
      }

      console.log('🔄 עדכון פגישה ביומן Google...');
      
      // חישוב שעת סיום חדשה
      const startTime = new Date(googleEvent.start.dateTime);
      const newEndTime = new Date(startTime.getTime() + requiredDuration * 60000);
      
      // מחיקת האירוע הישן
      await deleteEvent(googleEvent.id);
      console.log('🗑️ האירוע הישן נמחק');
      
      // יצירת אירוע חדש עם משך מעודכן
      const newEventId = await createEvent(
        googleEvent.summary || 'פגישה',
        startTime.toISOString(),
        newEndTime.toISOString(),
        googleEvent.description || ''
      );
      
      if (newEventId) {
        console.log('✅ אירוע חדש נוצר עם משך מעודכן');
        return true;
      } else {
        throw new Error('יצירת האירוע החדש נכשלה');
      }
    } catch (error: any) {
      console.error('❌ שגיאה בעדכון יומן Google:', error);
      toast({
        title: "שגיאה בעדכון יומן Google",
        description: error.message || "לא הצלחנו לעדכן את יומן Google",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!googleEvent) {
      toast({ title: "שגיאה", description: "אין נתוני אירוע מהיומן", variant: "destructive" });
      return;
    }
    if (!googleEvent.start?.dateTime) {
      toast({ title: "שגיאה", description: "אין תאריך התחלה לאירוע", variant: "destructive" });
      return;
    }
    if (!selectedSessionTypeId) {
      toast({ title: "שגיאה", description: "יש לבחור סוג פגישה", variant: "destructive" });
      return;
    }
    // דרישת חובה לבחירת לקוח אם זה לא מזהה אוטומטי
    if (!selectedClientId) {
      toast({ title: "שגיאה", description: "יש לבחור לקוח מהמערכת", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // עדכון יומן Google אם נדרש
      if (shouldUpdateGoogleCalendar && isAuthenticated) {
        const requiredDuration = getSessionTypeDuration(selectedSessionTypeId, sessionTypes);
        const success = await updateGoogleCalendarEvent(requiredDuration);
        
        if (!success) {
          // אם העדכון נכשל, נמשיך בכל זאת עם הוספה לטבלה
          toast({
            title: "אזהרה",
            description: "הפגישה נוספה אך לא הצלחנו לעדכן את יומן Google",
            variant: "destructive",
          });
        }
      }

      // נשתמש בזמן המדויק של האירוע מגוגל, עם אופסט זמן ישראל
      const israelDateStr = googleDateTimeToIsraelISOString(googleEvent.start.dateTime);
      
      const sessionData = {
        patient_id: selectedClientId,
        session_date: israelDateStr,
        meeting_type: 'Zoom',
        session_type_id: selectedSessionTypeId,
        status: 'Scheduled',
      };

      console.log('🟢 DEBUG: Going to insert', sessionData);

      const supabase = supabaseClient();
      const { error } = await supabase
        .from('future_sessions')
        .insert(sessionData)
        .select();

      if (error) throw error;

      const duration = getSessionTypeDuration(selectedSessionTypeId, sessionTypes);
      
      toast({
        title: "פגישה נוספה בהצלחה",
        description: `הפגישה נוספה לפגישות עתידיות עם משך זמן של ${duration} דקות${
          shouldUpdateGoogleCalendar && isAuthenticated ? ' ויומן Google עודכן' : ''
        }`,
      });

      if (onAdded) onAdded();
      onOpenChange(false);
    } catch (error: any) {
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
  const currentDuration = getCurrentEventDuration();

  // לחשב את שעת הסיום הנראית עבור התצוגה
  const previewEndTime = googleEvent?.start?.dateTime && duration
    ? computeEndTimePreview(googleDateTimeToIsraelISOString(googleEvent.start.dateTime), duration)
    : null;

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
                {previewEndTime && (
                  <>
                    <span className="mx-2">—</span>
                    <span>שעת סיום צפויה: {previewEndTime}</span>
                  </>
                )}
              </div>
              {currentDuration && (
                <div className="text-sm text-gray-500 mt-1">
                  משך נוכחי ביומן Google: {currentDuration} דקות
                </div>
              )}
              {selectedClientId && patient && (
                <div className="text-sm text-purple-700 mt-1">
                  לקוח: {patient.name}
                </div>
              )}
              {!selectedClientId && (
                <div className="text-sm text-gray-500 mt-1">
                  ללא לקוח מוגדר
                </div>
              )}
            </div>
          </div>

          {/* בחר לקוח רק אם לא מזוהה! */}
          {!selectedClientId && (
            <div className="space-y-2">
              <Label htmlFor="client_id" className="text-purple-700">בחר לקוח מהמערכת *</Label>
              <Select
                value={selectedClientId ? selectedClientId.toString() : undefined}
                onValueChange={(value) => setSelectedClientId(Number(value))}
                disabled={isLoadingPatients}
              >
                <SelectTrigger className="border-purple-200 focus-visible:ring-purple-500">
                  <SelectValue placeholder={isLoadingPatients ? "טוען רשימה..." : "בחר לקוח"} />
                </SelectTrigger>
                <SelectContent>
                  {patients.length === 0 && (
                    <div className="py-2 px-4 text-sm text-muted-foreground">אין לקוחות להצגה</div>
                  )}
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="session_type" className="text-purple-700">סוג פגישה</Label>
            <Select
              value={selectedSessionTypeId ? selectedSessionTypeId.toString() : undefined}
              onValueChange={(value) => setSelectedSessionTypeId(Number(value))}
              disabled={isLoadingSessionTypes}
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

          {/* אופציה לעדכון יומן Google */}
          {shouldUpdateGoogleCalendar && isAuthenticated && currentDuration && (
            <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateGoogleCalendar"
                  checked={shouldUpdateGoogleCalendar}
                  onCheckedChange={(checked) => setShouldUpdateGoogleCalendar(!!checked)}
                />
                <Label 
                  htmlFor="updateGoogleCalendar" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  עדכון יומן Google
                </Label>
              </div>
              <div className="text-sm text-yellow-700">
                הפגישה ביומן Google היא {currentDuration} דקות, אבל סוג הפגישה דורש {duration} דקות.
                סמן כדי לעדכן את יומן Google למשך הנדרש.
              </div>
            </div>
          )}

          {/* Debug info */}
          <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
            Debug: GoogleEvent={!!googleEvent}, ClientId={selectedClientId}, SessionType={selectedSessionTypeId}, UpdateGoogle={shouldUpdateGoogleCalendar}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSessionTypeId || !googleEvent || (!selectedClientId)}
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
