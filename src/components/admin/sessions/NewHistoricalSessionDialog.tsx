
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
import { useSessionTypes } from '@/hooks/useSessionTypes';

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
  const { data: sessionTypes, isLoading: isLoadingSessionTypes } = useSessionTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  
  const [date, setDate] = useState<Date | undefined>(
    fromFutureSession ? new Date(fromFutureSession.session_date) : new Date()
  );
  const [time, setTime] = useState<string>('12:00');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  
  const [formData, setFormData] = useState<NewHistoricalSessionFormData>({
    session_date: fromFutureSession ? new Date(fromFutureSession.session_date) : new Date(),
    meeting_type: fromFutureSession?.meeting_type || 'Zoom',
    session_type_id: fromFutureSession?.session_type_id || null,
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
    
    const fetchPatient = async () => {
      try {
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
          
        if (error) throw error;
        setPatient(data as Patient);
        
        // Set default paid amount to patient's session price
        if (data.session_price) {
          setFormData(prev => ({ ...prev, paid_amount: data.session_price }));
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
      }
    };
    
    if (open) {
      fetchExercises();
      fetchPatient();
    }
  }, [open, patientId]);

  // Initialize form when dialog opens
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
        setFormData(prev => ({
          ...prev,
          session_date: sessionDate,
          meeting_type: fromFutureSession.meeting_type,
          session_type_id: fromFutureSession.session_type_id || null,
        }));
      } else {
        // Reset form for new session
        const now = new Date();
        setDate(now);
        setTime('12:00');
        setPaymentDate(undefined);
        setSelectedExercises([]);
        setFormData({
          session_date: now,
          meeting_type: 'Zoom',
          session_type_id: null,
          summary: '',
          sent_exercises: false,
          exercise_list: [],
          paid_amount: patient?.session_price || 0,
          payment_status: 'pending',
          payment_method: 'cash',
          payment_date: null,
          payment_notes: '',
        });
      }
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
    
    // Update payment status based on paid amount
    if (name === 'paid_amount' && patient?.session_price) {
      if (numValue === null || numValue === 0) {
        setFormData(prev => ({ ...prev, payment_status: 'pending' }));
      } else if (numValue < patient.session_price) {
        setFormData(prev => ({ ...prev, payment_status: 'partial' }));
      } else {
        setFormData(prev => ({ ...prev, payment_status: 'paid' }));
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'session_type_id') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Reset payment_date if payment_status is "pending"
    if (name === 'payment_status' && value === 'pending') {
      setFormData((prev) => ({ ...prev, payment_date: null }));
      setPaymentDate(undefined);
    }
    
    // Set payment_date to today if payment_status changed to "paid" or "partial" and there's no date
    if (name === 'payment_status' && (value === 'paid' || value === 'partial') && !formData.payment_date) {
      const today = new Date();
      setFormData((prev) => ({ ...prev, payment_date: today }));
      setPaymentDate(today);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, sent_exercises: checked }));
    
    // If unchecked, clear selected exercises
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
    
    // Update session_date with new time
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
      
      // Preserve the selected time
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
      
      // Convert to historical session format - using correct database values
      const sessionData = {
        patient_id: patientId,
        session_date: isoDate,
        meeting_type: formData.meeting_type,
        session_type_id: formData.session_type_id,
        summary: formData.summary,
        sent_exercises: formData.sent_exercises,
        exercise_list: formData.sent_exercises ? formData.exercise_list : [],
        paid_amount: formData.paid_amount,
        payment_status: formData.payment_status, // Keep the original values: 'paid', 'partial', 'pending'
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
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Input
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="max-w-[120px] border-purple-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">סוג פגישה</Label>
            <Select
              value={formData.meeting_type || ''}
              onValueChange={(value) => handleSelectChange('meeting_type', value)}
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
            <Label className="text-purple-700">סוג פגישה</Label>
            <Select
              value={formData.session_type_id?.toString() || ''}
              onValueChange={(value) => handleSelectChange('session_type_id', value)}
            >
              <SelectTrigger className="border-purple-200">
                <SelectValue placeholder="בחר סוג פגישה" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingSessionTypes ? (
                  <SelectItem value="" disabled>טוען...</SelectItem>
                ) : (
                  sessionTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} ({type.duration_minutes} דקות)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">סיכום פגישה</Label>
            <Textarea
              name="summary"
              placeholder="הזן סיכום פגישה..."
              value={formData.summary || ''}
              onChange={handleTextChange}
              className="border-purple-200 min-h-[100px]"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="sent_exercises"
                checked={formData.sent_exercises}
                onCheckedChange={(checked) => {
                  handleCheckboxChange(!!checked);
                }}
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
            <Label className="text-purple-700">סכום ששולם (₪)</Label>
            <Input
              name="paid_amount"
              type="number"
              value={formData.paid_amount === null ? '' : formData.paid_amount}
              onChange={handleNumberChange}
              className="border-purple-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">סטטוס תשלום</Label>
            <Select
              value={formData.payment_status || ''}
              onValueChange={(value) => handleSelectChange('payment_status', value)}
            >
              <SelectTrigger className="border-purple-200">
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
                <Label className="text-purple-700">אמצעי תשלום</Label>
                <Select
                  value={formData.payment_method || ''}
                  onValueChange={(value) => handleSelectChange('payment_method', value)}
                >
                  <SelectTrigger className="border-purple-200">
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
                <Label className="text-purple-700">תאריך תשלום</Label>
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
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-purple-700">הערות לתשלום</Label>
                <Textarea
                  name="payment_notes"
                  placeholder="הזן הערות לתשלום..."
                  value={formData.payment_notes || ''}
                  onChange={handleTextChange}
                  className="border-purple-200"
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
