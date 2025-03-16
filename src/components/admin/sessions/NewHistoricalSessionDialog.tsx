
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Calendar, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewHistoricalSessionFormData, FutureSession } from '@/types/session';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/patient';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  fromFutureSession?: FutureSession | null;
  onDeleteFutureSession?: () => Promise<void>;
}

const NewHistoricalSessionDialog: React.FC<NewHistoricalSessionDialogProps> = ({
  open,
  onOpenChange,
  patientId,
  patient,
  onSessionCreated,
  fromFutureSession = null,
  onDeleteFutureSession,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  const [exercises, setExercises] = useState<string[]>([]);
  const [exerciseInput, setExerciseInput] = useState<string>('');
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);

  const [formData, setFormData] = useState<NewHistoricalSessionFormData>({
    session_date: new Date(),
    meeting_type: 'Zoom',
    summary: null,
    sent_exercises: false,
    exercise_list: [],
    paid_amount: patient?.session_price || null,
    payment_status: 'unpaid',
    payment_method: null,
    payment_date: null,
    payment_notes: null,
  });

  // Fetch available exercises from the database
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('exercise_name')
          .order('exercise_name', { ascending: true });

        if (error) throw error;

        if (data) {
          setAvailableExercises(data.map(ex => ex.exercise_name));
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };

    fetchExercises();
  }, []);

  // Initialize form with future session data if provided
  useEffect(() => {
    if (fromFutureSession) {
      const fsDate = new Date(fromFutureSession.session_date);
      setDate(fsDate);
      setTime(format(fsDate, 'HH:mm'));

      setFormData(prev => ({
        ...prev,
        session_date: fsDate,
        meeting_type: fromFutureSession.meeting_type,
        summary: fromFutureSession.notes || null,
      }));
    }
  }, [fromFutureSession]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'paid_amount') {
      // Handle numeric input
      const numValue = value === '' ? null : Number(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
      
      // Update payment status based on paid amount
      if (patient?.session_price) {
        if (numValue === null || numValue === 0) {
          setFormData(prev => ({ ...prev, payment_status: 'unpaid' }));
        } else if (numValue < patient.session_price) {
          setFormData(prev => ({ ...prev, payment_status: 'partially_paid' }));
        } else {
          setFormData(prev => ({ ...prev, payment_status: 'paid' }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    
    // Update session_date with new time
    if (date) {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      setFormData(prev => ({ ...prev, session_date: newDate }));
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
      
      setFormData(prev => ({ ...prev, session_date: newDate }));
    }
  };

  const handlePaymentDateChange = (newDate: Date | undefined) => {
    setPaymentDate(newDate);
    setFormData(prev => ({ ...prev, payment_date: newDate }));
  };

  const toggleSentExercises = (checked: boolean) => {
    setFormData(prev => ({ ...prev, sent_exercises: checked }));
  };

  const addExercise = () => {
    if (exerciseInput.trim()) {
      setExercises(prev => [...prev, exerciseInput.trim()]);
      setFormData(prev => ({ 
        ...prev, 
        exercise_list: [...(prev.exercise_list || []), exerciseInput.trim()]
      }));
      setExerciseInput('');
    }
  };

  const removeExercise = (index: number) => {
    const newExercises = [...exercises];
    newExercises.splice(index, 1);
    setExercises(newExercises);
    setFormData(prev => ({
      ...prev,
      exercise_list: newExercises.length ? newExercises : null
    }));
  };

  const handleExerciseSelect = (value: string) => {
    setExerciseInput(value);
  };

  const resetForm = () => {
    setFormData({
      session_date: new Date(),
      meeting_type: 'Zoom',
      summary: null,
      sent_exercises: false,
      exercise_list: [],
      paid_amount: patient?.session_price || null,
      payment_status: 'unpaid',
      payment_method: null,
      payment_date: null,
      payment_notes: null,
    });
    setDate(new Date());
    setTime('12:00');
    setPaymentDate(undefined);
    setExercises([]);
    setExerciseInput('');
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

    setIsSubmitting(true);
    try {
      // Format the combined date and time for database
      const combinedDate = date;
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        combinedDate.setHours(hours, minutes);
      }

      const { error } = await supabase
        .from('sessions')
        .insert({
          patient_id: patientId,
          session_date: combinedDate.toISOString(),
          meeting_type: formData.meeting_type,
          summary: formData.summary,
          sent_exercises: formData.sent_exercises,
          exercise_list: formData.exercise_list && formData.exercise_list.length > 0 
            ? formData.exercise_list 
            : null,
          paid_amount: formData.paid_amount,
          payment_status: formData.payment_status,
          payment_method: formData.payment_method,
          payment_date: formData.payment_date ? formData.payment_date.toISOString() : null,
          payment_notes: formData.payment_notes,
        });

      if (error) throw error;

      toast({
        title: "פגישה היסטורית נוצרה בהצלחה",
        description: "הפגישה נוספה לרשימת הפגישות ההיסטוריות",
      });

      onSessionCreated();
      
      // If this was converted from a future session, ask if the user wants to delete it
      if (fromFutureSession && onDeleteFutureSession) {
        setShowDeletePrompt(true);
      } else {
        resetForm();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error creating historical session:', error);
      toast({
        title: "שגיאה ביצירת פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleDeleteFutureSession = async () => {
    if (onDeleteFutureSession) {
      try {
        await onDeleteFutureSession();
        toast({
          title: "הפגישה העתידית נמחקה",
          description: "הפגישה העתידית נמחקה בהצלחה",
        });
      } catch (error: any) {
        toast({
          title: "שגיאה במחיקת הפגישה",
          description: error.message || "אנא נסה שוב מאוחר יותר",
          variant: "destructive",
        });
      }
    }
    resetForm();
    setShowDeletePrompt(false);
    onOpenChange(false);
  };

  const handleKeepFutureSession = () => {
    resetForm();
    setShowDeletePrompt(false);
    onOpenChange(false);
  };

  // If showing delete prompt, render that instead of the form
  if (showDeletePrompt) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-purple-800">מחיקת פגישה עתידית</DialogTitle>
          </DialogHeader>

          <div className="py-4 text-center" dir="rtl">
            <p className="mb-4">האם למחוק את הפגישה העתידית המקורית?</p>
            <p className="text-sm text-gray-500 mb-6">
              הפגישה ההיסטורית נוצרה בהצלחה. האם ברצונך למחוק את הפגישה העתידית המקורית?
            </p>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleDeleteFutureSession}
                className="bg-red-600 hover:bg-red-700"
              >
                כן, מחק את הפגישה העתידית
              </Button>
              <Button
                variant="outline"
                onClick={handleKeepFutureSession}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                לא, השאר אותה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">
            {fromFutureSession 
              ? "העברת פגישה עתידית להיסטוריה" 
              : "יצירת פגישה היסטורית חדשה"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto" dir="rtl">
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
              value={formData.summary || ''}
              onChange={handleInputChange}
              className="border-purple-200 focus-visible:ring-purple-500 min-h-[100px]"
              placeholder="הזן סיכום פגישה"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sent_exercises" className="text-purple-700">נשלחו תרגילים?</Label>
              <Switch
                id="sent_exercises"
                checked={formData.sent_exercises}
                onCheckedChange={toggleSentExercises}
              />
            </div>
            
            {formData.sent_exercises && (
              <div className="space-y-2 bg-purple-50 p-3 rounded-md">
                <Label htmlFor="exercise_input" className="text-purple-700">רשימת תרגילים</Label>
                <div className="flex gap-2">
                  <Select onValueChange={handleExerciseSelect}>
                    <SelectTrigger className="border-purple-200 focus-visible:ring-purple-500">
                      <SelectValue placeholder="בחר תרגיל" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableExercises.map((exercise, index) => (
                        <SelectItem key={index} value={exercise}>
                          {exercise}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="exercise_input"
                    value={exerciseInput}
                    onChange={(e) => setExerciseInput(e.target.value)}
                    className="border-purple-200 focus-visible:ring-purple-500"
                    placeholder="שם התרגיל"
                  />
                  <Button 
                    type="button" 
                    onClick={addExercise}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    הוסף
                  </Button>
                </div>
                
                {exercises.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-purple-700 mb-2 block">תרגילים שנבחרו:</Label>
                    <ul className="space-y-1">
                      {exercises.map((exercise, index) => (
                        <li key={index} className="flex justify-between items-center bg-white p-2 rounded border border-purple-100">
                          <span>{exercise}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeExercise(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="font-medium text-lg text-purple-800 mb-3">פרטי תשלום</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paid_amount" className="text-purple-700">סכום ששולם (₪)</Label>
                <Input
                  id="paid_amount"
                  name="paid_amount"
                  type="number"
                  value={formData.paid_amount === null ? '' : formData.paid_amount}
                  onChange={handleInputChange}
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
                    <SelectItem value="partially_paid">שולם חלקית</SelectItem>
                    <SelectItem value="unpaid">לא שולם</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                        "w-full border-purple-200 justify-start text-right font-normal",
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
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="payment_notes" className="text-purple-700">הערות תשלום</Label>
              <Textarea
                id="payment_notes"
                name="payment_notes"
                value={formData.payment_notes || ''}
                onChange={handleInputChange}
                className="border-purple-200 focus-visible:ring-purple-500"
                placeholder="הערות נוספות לגבי התשלום"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? 'יוצר פגישה...' : 'צור פגישה'}
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
