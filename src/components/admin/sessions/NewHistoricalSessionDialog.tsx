import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Calendar } from 'lucide-react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { NewHistoricalSessionFormData } from '@/types/session';
import { formatDateInIsraelTimeZone, convertLocalToUTC } from '@/utils/dateUtils';
import { useSessionTypes } from '@/hooks/useSessionTypes';
import SessionAttachmentsManager from './SessionAttachmentsManager';

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
  sessionPrice?: number | null;
  fromFutureSession?: FutureSession | null;
  onDeleteFutureSession?: () => Promise<void>;
}

const NewHistoricalSessionDialog: React.FC<NewHistoricalSessionDialogProps> = ({
  open = false,
  onOpenChange,
  patientId,
  sessionPrice,
  onSessionCreated,
  fromFutureSession,
  onDeleteFutureSession,
}) => {
  const { toast } = useToast();
  const { data: sessionTypes, isLoading: isLoadingSessionTypes } = useSessionTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  
  const [formData, setFormData] = useState<NewHistoricalSessionFormData & { attachment_urls: string[] }>({
    session_date: new Date(),
    meeting_type: 'In-Person',
    session_type_id: null,
    summary: '',
    sent_exercises: false,
    exercise_list: [],
    paid_amount: sessionPrice || 0,
    payment_status: 'pending',
    payment_method: null,
    payment_date: null,
    payment_notes: '',
    attachment_urls: [],
  });

  // Calculate session price based on session type
  const calculateSessionPrice = (sessionTypeId?: number | null): number => {
    if (!sessionPrice) return 0;
    
    if (sessionTypeId && sessionTypes) {
      const sessionType = sessionTypes.find(type => type.id === sessionTypeId);
      if (sessionType && sessionType.code === 'seft') {
        return sessionPrice * 3; // SEFT sessions cost 3x the regular price
      }
    }
    
    return sessionPrice;
  };

  // Fetch available exercises
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

  // Reset form when dialog opens or populate from future session
  useEffect(() => {
    if (open) {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      let initialData: NewHistoricalSessionFormData;
      
      if (fromFutureSession) {
        const sessionDate = new Date(fromFutureSession.session_date);
        const calculatedPrice = calculateSessionPrice(fromFutureSession.session_type_id);
        
        initialData = {
          session_date: sessionDate,
          meeting_type: fromFutureSession.meeting_type,
          session_type_id: fromFutureSession.session_type_id,
          summary: null,
          sent_exercises: false,
          exercise_list: null,
          paid_amount: calculatedPrice,
          payment_status: 'pending',
          payment_method: null,
          payment_date: null,
          payment_notes: null,
          attachment_urls: [],
        };
        
        const timeString = sessionDate.getHours().toString().padStart(2, '0') + 
                          ':' + 
                          sessionDate.getMinutes().toString().padStart(2, '0');
        setTime(timeString);
        setDate(sessionDate);
      } else {
        const calculatedPrice = calculateSessionPrice();
        
        initialData = {
          session_date: today,
          meeting_type: 'In-Person',
          session_type_id: null,
          summary: null,
          sent_exercises: false,
          exercise_list: null,
          paid_amount: calculatedPrice,
          payment_status: 'pending',
          payment_method: null,
          payment_date: null,
          payment_notes: null,
          attachment_urls: [],
        };
        
        setTime('12:00');
        setDate(today);
      }
      
      setFormData(initialData);
      setSelectedExercises([]);
      setPaymentDate(initialData.payment_date ? new Date(initialData.payment_date) : undefined);
    }
  }, [open, fromFutureSession, sessionPrice, sessionTypes]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? null : Number(value);
    
    setFormData((prev) => ({ ...prev, [name]: numValue }));
    
    // Update payment status based on paid amount
    if (name === 'paid_amount') {
      const currentSessionPrice = calculateSessionPrice(formData.session_type_id);
      if (currentSessionPrice > 0) {
        if (numValue === null || numValue === 0) {
          setFormData(prev => ({ ...prev, payment_status: 'pending' }));
        } else if (numValue < currentSessionPrice) {
          setFormData(prev => ({ ...prev, payment_status: 'partial' }));
        } else {
          setFormData(prev => ({ ...prev, payment_status: 'paid' }));
        }
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'session_type_id') {
      const sessionTypeId = value ? Number(value) : null;
      const calculatedPrice = calculateSessionPrice(sessionTypeId);
      
      setFormData((prev) => ({ 
        ...prev, 
        [name]: sessionTypeId,
        paid_amount: calculatedPrice
      }));
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

  const handleAttachmentsChange = (urls: string[]) => {
    setFormData((prev) => ({ ...prev, attachment_urls: urls }));
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
      // Delete future session if converting from future session
      if (fromFutureSession && onDeleteFutureSession) {
        await onDeleteFutureSession();
      }

      // Format the combined date and time for database
      const combinedDate = date;
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        combinedDate.setHours(hours, minutes);
      }

      const isoDate = convertLocalToUTC(combinedDate);

      const sessionData = {
        patient_id: patientId,
        meeting_type: formData.meeting_type,
        session_date: isoDate,
        session_type_id: formData.session_type_id,
        summary: formData.summary || null,
        sent_exercises: formData.sent_exercises,
        exercise_list: formData.sent_exercises ? formData.exercise_list : [],
        paid_amount: formData.paid_amount,
        payment_status: formData.payment_status,
        payment_method: formData.payment_method,
        payment_date: formData.payment_date ? convertLocalToUTC(formData.payment_date) : null,
        payment_notes: formData.payment_notes || null,
        attachment_urls: formData.attachment_urls,
      };

      console.log('Creating session data:', sessionData);

      const supabase = supabaseClient();
      const { error } = await supabase
        .from('sessions')
        .insert(sessionData);

      if (error) throw error;

      toast({
        title: "פגישה נוצרה בהצלחה",
        description: fromFutureSession ? "הפגישה הועברה לפגישות קודמות" : "הפגישה ההיסטורית נוספה למערכת",
      });

      onSessionCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast({
        title: "שגיאה ביצירת פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">
            {fromFutureSession ? 'המרת פגישה עתידית לביצוע' : 'הוספת פגישה היסטורית'}
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
            <Label htmlFor="session_type" className="text-purple-700">סוג פגישה</Label>
            <Select
              value={formData.session_type_id ? formData.session_type_id.toString() : undefined}
              onValueChange={(value) => handleSelectChange('session_type_id', value)}
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
                      {type.code === 'seft' && sessionPrice && ` - ₪${sessionPrice * 3}`}
                    </SelectItem>
                  ))
                )}
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

          {/* Attachments Section */}
          <SessionAttachmentsManager
            attachmentUrls={formData.attachment_urls}
            onAttachmentsChange={handleAttachmentsChange}
            maxFiles={5}
          />

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
            <Label htmlFor="paid_amount" className="text-purple-700">
              סכום ששולם (₪)
              {formData.session_type_id && sessionTypes && (() => {
                const sessionType = sessionTypes.find(type => type.id === formData.session_type_id);
                if (sessionType?.code === 'seft') {
                  return <span className="text-sm text-muted-foreground ml-2">(פגישת SEFT - פי 3 מהמחיר הרגיל)</span>;
                }
                return null;
              })()}
            </Label>
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
            {isSubmitting ? 'יוצר...' : fromFutureSession ? 'העבר לפגישות קודמות' : 'צור פגישה'}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
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
