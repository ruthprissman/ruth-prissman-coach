
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FutureSession } from '@/types/session';
import { Patient } from '@/types/patient';
import { supabaseClient } from '@/lib/supabaseClient';
import { convertLocalToUTC, formatDateTimeInIsrael } from '@/utils/dateUtils';

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

interface EditFutureSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FutureSession | null;
  patientId: number;
  onUpdated?: () => void;
}

const EditFutureSessionDialog: React.FC<EditFutureSessionDialogProps> = ({
  open,
  onOpenChange,
  session,
  patientId,
  onUpdated,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  
  const [formData, setFormData] = useState<Omit<FutureSession, 'id' | 'patient_id' | 'created_at'> & {
    summary: string;
    sent_exercises: boolean;
    exercise_list: string[];
    paid_amount: number | null;
    payment_status: 'paid' | 'partial' | 'pending';
    payment_method: 'cash' | 'bit' | 'transfer' | null;
    payment_date: Date | null;
    payment_notes: string;
  }>({
    session_date: '',
    meeting_type: 'Zoom',
    status: 'Scheduled',
    zoom_link: '',
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
      } catch (error) {
        console.error('Error fetching patient:', error);
      }
    };
    
    if (open) {
      fetchExercises();
      fetchPatient();
    }
  }, [open, patientId]);

  // Initialize form with session data when it's loaded
  useEffect(() => {
    if (session && open) {
      try {
        // Convert session date to local date for editing
        const sessionDate = new Date(session.session_date);
        
        // Set the date and time values for display
        setDate(sessionDate);
        
        // Format time in 24-hour format
        const hours = sessionDate.getHours().toString().padStart(2, '0');
        const minutes = sessionDate.getMinutes().toString().padStart(2, '0');
        setTime(`${hours}:${minutes}`);
        
        // Update form data with session info and default values for new fields
        setFormData({
          session_date: session.session_date,
          meeting_type: session.meeting_type,
          status: session.status,
          zoom_link: session.zoom_link || '',
          summary: '',
          sent_exercises: false,
          exercise_list: [],
          paid_amount: patient?.session_price || 0,
          payment_status: 'pending',
          payment_method: 'cash',
          payment_date: null,
          payment_notes: '',
        });
        
        setSelectedExercises([]);
        setPaymentDate(undefined);
        
        console.log('Editing session with date:', {
          original: session.session_date,
          parsed: sessionDate.toString(),
          time: `${hours}:${minutes}`
        });
      } catch (error) {
        console.error("Error initializing session edit form:", error);
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת נתוני הפגישה",
          variant: "destructive",
        });
      }
    }
  }, [session, open, toast, patient]);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
    
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
      setFormData((prev) => ({ ...prev, session_date: newDate.toISOString() }));
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      
      // Preserve the selected time
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        const dateWithTime = new Date(newDate);
        dateWithTime.setHours(hours, minutes);
        setFormData((prev) => ({ ...prev, session_date: dateWithTime.toISOString() }));
      } else {
        setFormData((prev) => ({ ...prev, session_date: newDate.toISOString() }));
      }
    }
  };

  const handlePaymentDateChange = (newDate: Date | undefined) => {
    setPaymentDate(newDate);
    setFormData((prev) => ({ ...prev, payment_date: newDate || null }));
  };

  const handleSubmit = async () => {
    if (!session || !date) {
      toast({
        title: "שגיאה",
        description: "חסרים נתונים נדרשים",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the combined date and time
      const combinedDate = new Date(date);
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        combinedDate.setHours(hours, minutes);
      }

      // Convert local date to UTC before saving to database
      const isoDate = convertLocalToUTC(combinedDate);
      
      console.log('Edit Session - Details:', {
        original: date.toString(),
        withTime: combinedDate.toString(),
        isoToSave: isoDate
      });

      // Only include fields that exist in the database table
      const supabase = supabaseClient();
      const { error } = await supabase
        .from('future_sessions')
        .update({
          session_date: isoDate,
          meeting_type: formData.meeting_type,
          status: formData.status,
          zoom_link: formData.meeting_type === 'Zoom' ? formData.zoom_link : null,
        })
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "פגישה עודכנה בהצלחה",
        description: "נתוני הפגישה עודכנו בהצלחה",
      });

      if (onUpdated) onUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating future session:', error);
      toast({
        title: "שגיאה בעדכון פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">
            עריכת פגישה עתידית
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
              value={formData.meeting_type}
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
            <Label className="text-purple-700">סטטוס</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger className="border-purple-200">
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scheduled">מתוכנן</SelectItem>
                <SelectItem value="Completed">הושלם</SelectItem>
                <SelectItem value="Cancelled">בוטל</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.meeting_type === 'Zoom' && (
            <div className="space-y-2">
              <Label className="text-purple-700">קישור לזום</Label>
              <Input
                name="zoom_link"
                value={formData.zoom_link || ''}
                onChange={handleTextChange}
                className="border-purple-200"
                placeholder="הזן קישור לפגישת זום"
              />
            </div>
          )}

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
              value={formData.payment_status}
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
                מעדכן פגישה...
              </div>
            ) : 'שמור שינויים'}
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

export default EditFutureSessionDialog;
