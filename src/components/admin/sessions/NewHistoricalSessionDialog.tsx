import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewHistoricalSessionFormData, FutureSession } from '@/types/session';
import { Patient } from '@/types/patient';
import { supabaseClient as supabase } from '@/lib/supabaseClient';
import { formatDateInIsraelTimeZone } from '@/utils/dateUtils';

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
  patient: Patient | null;
  onSessionCreated: () => void;
  fromFutureSession?: FutureSession;
  onDeleteFutureSession?: () => Promise<void>;
}

const NewHistoricalSessionDialog: React.FC<NewHistoricalSessionDialogProps> = ({
  open,
  onOpenChange,
  patientId,
  patient,
  onSessionCreated,
  fromFutureSession,
  onDeleteFutureSession,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  
  const [formData, setFormData] = useState<NewHistoricalSessionFormData>({
    session_date: new Date(),
    meeting_type: 'Zoom',
    summary: null,
    sent_exercises: false,
    exercise_list: [],
    paid_amount: patient?.session_price || null,
    payment_status: 'pending',
    payment_method: null,
    payment_date: null,
    payment_notes: null,
  });

  useEffect(() => {
    const fetchExercises = async () => {
      try {
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

  useEffect(() => {
    if (open) {
      if (fromFutureSession) {
        const sessionDate = new Date(fromFutureSession.session_date);
        
        setDate(sessionDate);
        setTime(
          sessionDate.getHours().toString().padStart(2, '0') + 
          ':' + 
          sessionDate.getMinutes().toString().padStart(2, '0')
        );
        
        setFormData({
          session_date: sessionDate,
          meeting_type: fromFutureSession.meeting_type,
          summary: null,
          sent_exercises: false,
          exercise_list: [],
          paid_amount: patient?.session_price || null,
          payment_status: 'pending',
          payment_method: null,
          payment_date: null,
          payment_notes: null,
        });
      } else {
        const now = new Date();
        setDate(now);
        setTime(
          now.getHours().toString().padStart(2, '0') + 
          ':' + 
          now.getMinutes().toString().padStart(2, '0')
        );
        setPaymentDate(now);
        
        setFormData({
          session_date: now,
          meeting_type: 'Zoom',
          summary: null,
          sent_exercises: false,
          exercise_list: [],
          paid_amount: patient?.session_price || null,
          payment_status: 'pending',
          payment_method: null,
          payment_date: null,
          payment_notes: null,
        });
      }
      
      setSelectedExercises([]);
    }
  }, [open, fromFutureSession, patient]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? null : Number(value);
    
    setFormData((prev) => ({ ...prev, [name]: numValue }));
    
    if (name === 'paid_amount') {
      if (patient?.session_price) {
        if (numValue === null || numValue === 0) {
          setFormData(prev => ({ ...prev, payment_status: 'pending' }));
        } else if (numValue < patient.session_price) {
          setFormData(prev => ({ ...prev, payment_status: 'partial' }));
        } else {
          setFormData(prev => ({ ...prev, payment_status: 'paid' }));
        }
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === 'payment_status' && value === 'pending') {
      setFormData((prev) => ({ ...prev, payment_date: null }));
      setPaymentDate(undefined);
    }
    
    if (name === 'payment_status' && (value === 'paid' || value === 'partial') && !formData.payment_date) {
      const today = new Date();
      setFormData((prev) => ({ ...prev, payment_date: today }));
      setPaymentDate(today);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, sent_exercises: checked }));
    
    if (!checked) {
      setSelectedExercises([]);
      setFormData((prev) => ({ ...prev, exercise_list: [] }));
    }
  };

  const handleExerciseSelect = (exerciseName: string) => {
    let updatedExercises: string[];
    
    if (selectedExercises.includes(exerciseName)) {
      updatedExercises = selectedExercises.filter(e => e !== exerciseName);
    } else {
      updatedExercises = [...selectedExercises, exerciseName];
    }
    
    setSelectedExercises(updatedExercises);
    setFormData((prev) => ({ ...prev, exercise_list: updatedExercises }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    
    if (date) {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      setFormData((prev) => ({ ...prev, session_date: newDate }));
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        newDate.setHours(hours, minutes);
      }
      
      setFormData((prev) => ({ ...prev, session_date: newDate }));
    }
  };

  const handlePaymentDateChange = (newDate: Date | undefined) => {
    setPaymentDate(newDate);
    setFormData((prev) => ({ ...prev, payment_date: newDate || null }));
  };

  const resetForm = () => {
    const now = new Date();
    setDate(now);
    setTime(
      now.getHours().toString().padStart(2, '0') + 
      ':' + 
      now.getMinutes().toString().padStart(2, '0')
    );
    setPaymentDate(now);
    
    setFormData({
      session_date: now,
      meeting_type: 'Zoom',
      summary: null,
      sent_exercises: false,
      exercise_list: [],
      paid_amount: patient?.session_price || null,
      payment_status: 'pending',
      payment_method: null,
      payment_date: null,
      payment_notes: null,
    });
    
    setSelectedExercises([]);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!date) {
      toast({
        title: "שגיאה",
        description: "יש לבחור תאריך",
        variant: "destructive",
      });
      return;
    }

    if (!['paid', 'partial', 'pending'].includes(formData.payment_status)) {
      setFormData(prev => ({ ...prev, payment_status: 'pending' }));
    }

    setIsSubmitting(true);
    try {
      const combinedDate = date;
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        combinedDate.setHours(hours, minutes);
      }

      const sessionData = {
        patient_id: patientId,
        session_date: combinedDate.toISOString(),
        meeting_type: formData.meeting_type,
        summary: formData.summary,
        sent_exercises: formData.sent_exercises,
        exercise_list: formData.sent_exercises ? formData.exercise_list : [],
        paid_amount: formData.paid_amount,
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
        payment_date: formData.payment_date ? formData.payment_date.toISOString() : null,
        payment_notes: formData.payment_notes,
      };

      const { error } = await supabase
        .from('sessions')
        .insert([sessionData]);

      if (error) throw error;

      toast({
        title: "פגישה היסטורית נוצרה בהצלחה",
        description: "הפגישה נוספה להיסטוריית הפגישות",
      });

      if (fromFutureSession && onDeleteFutureSession) {
        try {
          await onDeleteFutureSession();
          toast({
            title: "פגישה עתידית הועברה בהצלחה",
            description: "הפגישה הועברה מהפגישות העתידיות להיסטוריה",
          });
        } catch (error) {
          console.error('Error deleting future session:', error);
          toast({
            title: "שגיאה במחיקת פגישה עתידית",
            description: "הפגישה ההיסטורית נוצרה אך הפגישה העתידית לא נמחקה",
            variant: "destructive",
          });
        }
      }

      onSessionCreated();
      resetForm();
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
            {fromFutureSession ? 'העברת פגישה להיסטוריה' : 'יצירת פגישה היסטורית חדשה'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2" dir="rtl">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-purple-700">תאריך ושעה</Label>
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
                    onSelect={handleDateChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <Input
                id="time"
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="max-w-[120px] border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_type" className="text-purple-700">סוג פגישה</Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value) => handleSelectChange('meeting_type', value)}
            >
              <SelectTrigger className="border-purple-200 focus-visible:ring-purple-500">
                <SelectValue placeholder="בחר סוג פגישה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Zoom">זום</SelectItem>
                <SelectItem value="Phone">טלפון</SelectItem>
                <SelectItem value="In-Person">פגישה פרונטית</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary" className="text-purple-700">סיכום פגישה</Label>
            <Textarea
              id="summary"
              name="summary"
              placeholder="הזן סיכום פגישה..."
              value={formData.summary || ''}
              onChange={handleTextChange}
              className="min-h-[100px] border-purple-200 focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="sent_exercises"
                checked={formData.sent_exercises}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="sent_exercises" className="text-purple-700">
                נשלחו תרגילים
              </Label>
            </div>

            {formData.sent_exercises && (
              <div className="pl-6 space-y-2">
                <Label className="text-purple-700">בחר תרגילים</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-purple-200 rounded-md p-2">
                  {exercises.map((exercise) => (
                    <div key={exercise.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`exercise-${exercise.id}`}
                        checked={selectedExercises.includes(exercise.name)}
                        onCheckedChange={() => handleExerciseSelect(exercise.name)}
                      />
                      <Label
                        htmlFor={`exercise-${exercise.id}`}
                        className="font-normal"
                      >
                        {exercise.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <h3 className="text-lg font-semibold text-purple-700">פרטי תשלום</h3>

          <div className="space-y-2">
            <Label htmlFor="paid_amount" className="text-purple-700">סכום ששולם (₪)</Label>
            <Input
              id="paid_amount"
              name="paid_amount"
              type="number"
              value={formData.paid_amount === null ? '' : formData.paid_amount}
              onChange={handleNumberChange}
              className="border-purple-200 focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_status" className="text-purple-700">סטטוס תשלום</Label>
            <Select
              value={formData.payment_status}
              onValueChange={(value) => handleSelectChange('payment_status', value)}
            >
              <SelectTrigger className="border-purple-200 focus-visible:ring-purple-500">
                <SelectValue placeholder="בחר סטטוס תשלום" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">שולם</SelectItem>
                <SelectItem value="partial">שולם חלקית</SelectItem>
                <SelectItem value="pending">ממתין לתשלום</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.payment_status === 'paid' || formData.payment_status === 'partial') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="payment_method" className="text-purple-700">אמצעי תשלום</Label>
                <Select
                  value={formData.payment_method || ''}
                  onValueChange={(value) => handleSelectChange('payment_method', value)}
                >
                  <SelectTrigger className="border-purple-200 focus-visible:ring-purple-500">
                    <SelectValue placeholder="בחר אמצעי תשלום" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">מזומן</SelectItem>
                    <SelectItem value="bit">ביט</SelectItem>
                    <SelectItem value="transfer">העברה בנקאית</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date" className="text-purple-700">תאריך תשלום</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "border-purple-200 justify-start text-right font-normal w-full",
                        !paymentDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="ml-2 h-4 w-4 text-purple-600" />
                      {paymentDate ? format(paymentDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך תשלום"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={paymentDate}
                      onSelect={handlePaymentDateChange}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_notes" className="text-purple-700">הערות לתשלום</Label>
                <Textarea
                  id="payment_notes"
                  name="payment_notes"
                  placeholder="הזן הערות לתשלום..."
                  value={formData.payment_notes || ''}
                  onChange={handleTextChange}
                  className="border-purple-200 focus-visible:ring-purple-500"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? 'מעבד...' : fromFutureSession ? 'העבר להיסטוריה' : 'צור פגישה'}
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
