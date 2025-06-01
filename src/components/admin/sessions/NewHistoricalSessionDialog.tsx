
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewHistoricalSessionFormData } from '@/types/session';
import { Patient } from '@/types/patient';
import { FutureSession } from '@/types/session';
import { supabaseClient } from '@/lib/supabaseClient';
import { convertLocalToUTC } from '@/utils/dateUtils';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface NewHistoricalSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  onSessionCreated: () => void;
  fromFutureSession?: FutureSession | null;
  onDeleteFutureSession?: () => Promise<void>;
}

const NewHistoricalSessionDialog: React.FC<NewHistoricalSessionDialogProps> = ({
  open,
  onOpenChange,
  patientId,
  onSessionCreated,
  fromFutureSession,
  onDeleteFutureSession,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  
  const [date, setDate] = useState<Date | undefined>(
    fromFutureSession ? new Date(fromFutureSession.session_date) : new Date()
  );
  const [time, setTime] = useState<string>('12:00');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  
  const [formData, setFormData] = useState<NewHistoricalSessionFormData>({
    session_date: fromFutureSession ? new Date(fromFutureSession.session_date) : new Date(),
    meeting_type: fromFutureSession?.meeting_type || 'Zoom',
    summary: '',
    sent_exercises: false,
    exercise_list: [],
    paid_amount: 0,
    payment_status: 'pending',
    payment_method: 'cash',
    payment_date: null,
    payment_notes: '',
  });

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from('exercises')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setExercises(data || []);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };
    
    fetchExercises();
  }, []);

  const handleSubmit = async () => {
    if (!date) {
      toast({
        title: "שגיאה",
        description: "יש לבחור תאריך",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedDate = date;
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        combinedDate.setHours(hours, minutes);
      }

      const isoDate = convertLocalToUTC(combinedDate);

      const supabase = supabaseClient();
      
      // Convert to historical session format
      const sessionData = {
        patient_id: patientId,
        session_date: isoDate,
        meeting_type: formData.meeting_type,
        summary: formData.summary,
        sent_exercises: formData.sent_exercises,
        exercise_list: formData.sent_exercises ? formData.exercise_list : [],
        paid_amount: formData.paid_amount,
        payment_status: formData.payment_status === 'paid' ? 'paid' : 
                       formData.payment_status === 'partial' ? 'partially_paid' : 'unpaid',
        payment_method: formData.payment_method,
        payment_date: formData.payment_date ? convertLocalToUTC(formData.payment_date) : null,
        payment_notes: formData.payment_notes,
      };

      const { error } = await supabase
        .from('sessions')
        .insert(sessionData);

      if (error) throw error;

      // If converting from future session, delete the future session
      if (fromFutureSession && onDeleteFutureSession) {
        await onDeleteFutureSession();
      }

      toast({
        title: "פגישה היסטורית נוצרה בהצלחה",
        description: "הפגישה נוספה להיסטוריה",
      });

      onSessionCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating historical session:', error);
      toast({
        title: "שגיאה ביצירת פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">
            {fromFutureSession ? 'המרת פגישה עתידית לפגישה היסטורית' : 'יצירת פגישה היסטורית חדשה'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2" dir="rtl">
          <div className="space-y-2">
            <Label className="text-purple-700">תאריך ושעה</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "border-purple-200 justify-start text-right font-normal flex-1",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="ml-2 h-4 w-4 text-purple-600" />
                    {date ? format(date, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="max-w-[120px] border-purple-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">סוג פגישה</Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_type: value as any }))}
            >
              <SelectTrigger className="border-purple-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Zoom">זום</SelectItem>
                <SelectItem value="Phone">טלפון</SelectItem>
                <SelectItem value="In-Person">פגישה פרונטית</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">סיכום פגישה</Label>
            <Textarea
              placeholder="הזן סיכום פגישה..."
              value={formData.summary || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              className="border-purple-200"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                יוצר פגישה...
              </div>
            ) : fromFutureSession ? 'המר לפגישה היסטורית' : 'צור פגישה'}
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

export default NewHistoricalSessionDialog;
