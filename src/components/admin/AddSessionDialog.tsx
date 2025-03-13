import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Session, Exercise } from '@/types/patient';
import { supabase } from '@/lib/supabase';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface AddSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSession: (session: Omit<Session, 'id'>) => Promise<boolean>;
  patientId: number;
  sessionPrice?: number | null;
}

const SessionSchema = z.object({
  session_date: z.date(),
  meeting_type: z.enum(['Zoom', 'Phone', 'In-Person']),
  sent_exercises: z.boolean(),
  exercise_list: z.array(z.string()).nullable(),
  summary: z.string().nullable().optional(),
  paid_amount: z.number().nullable(),
  payment_method: z.enum(['Cash', 'Bit', 'Bank Transfer']).nullable(),
  payment_status: z.enum(['Paid', 'Partially Paid', 'Unpaid']),
  payment_date: z.date().nullable(),
  payment_notes: z.string().nullable().optional(),
});

type SessionFormValues = z.infer<typeof SessionSchema>;

const AddSessionDialog: React.FC<AddSessionDialogProps> = ({ 
  isOpen, 
  onClose, 
  onAddSession, 
  patientId,
  sessionPrice = 0
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const defaultValues = {
    session_date: new Date(),
    meeting_type: 'In-Person' as const,
    sent_exercises: false,
    exercise_list: [],
    summary: '',
    paid_amount: sessionPrice,
    payment_method: null,
    payment_status: 'Unpaid' as const,
    payment_date: null,
    payment_notes: '',
  };

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(SessionSchema),
    defaultValues,
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset form with correct initial values when dialog opens
      form.reset({
        ...defaultValues,
        paid_amount: sessionPrice || 0,
      });
      setIsFormInitialized(true);
    }
  }, [isOpen, sessionPrice, form]);

  // Watch fields for dependencies
  const exerciseList = form.watch('exercise_list');
  const paymentStatus = form.watch('payment_status');
  const paymentAmount = form.watch('paid_amount');
  
  // Only run these effects when the form is fully initialized
  useEffect(() => {
    if (!isFormInitialized) return;

    // If payment status changes, update related fields
    if (paymentStatus === 'Paid' && sessionPrice) {
      form.setValue('paid_amount', sessionPrice);
      form.setValue('payment_date', new Date());
    } else if (paymentStatus === 'Unpaid') {
      form.setValue('paid_amount', 0);
      form.setValue('payment_method', null);
      form.setValue('payment_date', null);
    }
  }, [paymentStatus, sessionPrice, form, isFormInitialized]);

  // Effect for payment amount changes
  useEffect(() => {
    if (!isFormInitialized) return;

    // Auto-determine payment status based on amount paid, but avoid circular updates
    if (form.formState.dirtyFields.paid_amount) {
      if (paymentAmount === null || paymentAmount === 0) {
        if (form.getValues('payment_status') !== 'Unpaid') {
          form.setValue('payment_status', 'Unpaid');
        }
      } else if (sessionPrice && paymentAmount < sessionPrice) {
        if (form.getValues('payment_status') !== 'Partially Paid') {
          form.setValue('payment_status', 'Partially Paid');
        }
      } else if (sessionPrice && paymentAmount >= sessionPrice) {
        if (form.getValues('payment_status') !== 'Paid') {
          form.setValue('payment_status', 'Paid');
        }
      }
    }
  }, [paymentAmount, form, sessionPrice, isFormInitialized]);

  // Effect for exercise list changes
  useEffect(() => {
    if (!isFormInitialized) return;

    // If exercises were added and sent_exercises is false, update it
    if (exerciseList && exerciseList.length > 0 && !form.getValues('sent_exercises')) {
      form.setValue('sent_exercises', true);
    }
  }, [exerciseList, form, isFormInitialized]);

  useEffect(() => {
    // Fetch exercises for dropdown
    const fetchExercises = async () => {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .order('exercise_name');
        
        if (error) throw error;
        
        setExercises(data || []);
      } catch (error: any) {
        console.error('Error fetching exercises:', error);
      }
    };

    fetchExercises();
  }, []);

  const onSubmit = async (data: SessionFormValues) => {
    // If there are exercises in the list but sent_exercises is false, update it
    if (data.exercise_list && data.exercise_list.length > 0) {
      data.sent_exercises = true;
    }
    
    // Ensure payment data is consistent
    if (data.payment_status === 'Unpaid') {
      data.paid_amount = 0;
      data.payment_method = null;
      data.payment_date = null;
    }
    
    const success = await onAddSession({
      patient_id: patientId,
      session_date: data.session_date.toISOString(),
      meeting_type: data.meeting_type,
      sent_exercises: data.sent_exercises,
      exercise_list: data.exercise_list,
      summary: data.summary,
      paid_amount: data.paid_amount,
      payment_method: data.payment_method,
      payment_status: data.payment_status,
      payment_date: data.payment_date ? data.payment_date.toISOString() : null,
      payment_notes: data.payment_notes
    });
    
    if (success) {
      form.reset(defaultValues);
      setIsFormInitialized(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-[800px] max-h-[90vh] overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle className="text-center">הוספת פגישה חדשה</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="overflow-auto max-h-[65vh] pr-2 -mr-2">
              <div className="space-y-4">
                {/* Session Date */}
                <FormField
                  control={form.control}
                  name="session_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>תאריך פגישה</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-right font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy HH:mm", { locale: he })
                              ) : (
                                <span>בחר תאריך ושעה</span>
                              )}
                              <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                // Preserve the time part from the existing date
                                const newDate = new Date(date);
                                newDate.setHours(field.value.getHours());
                                newDate.setMinutes(field.value.getMinutes());
                                field.onChange(newDate);
                              }
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                          <div className="p-3 border-t border-border">
                            <label className="text-sm font-medium">שעה:</label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <select
                                className="p-2 border rounded"
                                value={field.value.getHours()}
                                onChange={(e) => {
                                  const newDate = new Date(field.value);
                                  newDate.setHours(parseInt(e.target.value));
                                  field.onChange(newDate);
                                }}
                              >
                                {Array.from({ length: 24 }, (_, i) => (
                                  <option key={i} value={i}>
                                    {i.toString().padStart(2, '0')}
                                  </option>
                                ))}
                              </select>
                              <select
                                className="p-2 border rounded"
                                value={field.value.getMinutes()}
                                onChange={(e) => {
                                  const newDate = new Date(field.value);
                                  newDate.setMinutes(parseInt(e.target.value));
                                  field.onChange(newDate);
                                }}
                              >
                                {Array.from({ length: 60 }, (_, i) => (
                                  <option key={i} value={i}>
                                    {i.toString().padStart(2, '0')}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Meeting Type */}
                <FormField
                  control={form.control}
                  name="meeting_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>סוג פגישה</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר סוג פגישה" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Zoom">זום</SelectItem>
                          <SelectItem value="Phone">טלפון</SelectItem>
                          <SelectItem value="In-Person">פגישה פרונטלית</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Payment Section */}
                <div className="space-y-4 border p-4 rounded-lg">
                  <h3 className="font-medium text-center">פרטי תשלום</h3>
                  
                  {/* Payment Status */}
                  <FormField
                    control={form.control}
                    name="payment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סטטוס תשלום</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר סטטוס תשלום" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Paid">שולם</SelectItem>
                            <SelectItem value="Partially Paid">שולם חלקית</SelectItem>
                            <SelectItem value="Unpaid">לא שולם</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Amount Paid */}
                  <FormField
                    control={form.control}
                    name="paid_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סכום ששולם (₪)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Payment Method */}
                  {form.watch('payment_status') !== 'Unpaid' && (
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>אמצעי תשלום</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר אמצעי תשלום" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cash">מזומן</SelectItem>
                              <SelectItem value="Bit">ביט</SelectItem>
                              <SelectItem value="Bank Transfer">העברה בנקאית</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Payment Date */}
                  {form.watch('payment_status') !== 'Unpaid' && (
                    <FormField
                      control={form.control}
                      name="payment_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>תאריך תשלום</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-right font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", { locale: he })
                                  ) : (
                                    <span>בחר תאריך תשלום</span>
                                  )}
                                  <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Payment Notes */}
                  <FormField
                    control={form.control}
                    name="payment_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>הערות לתשלום</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''}
                            placeholder="הערות נוספות לגבי התשלום"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Sent Exercises Switch */}
                <FormField
                  control={form.control}
                  name="sent_exercises"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">נשלחו תרגילים?</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Exercise List */}
                <FormField
                  control={form.control}
                  name="exercise_list"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>רשימת תרגילים</FormLabel>
                      <div className="space-y-2">
                        <Controller
                          control={form.control}
                          name="exercise_list"
                          render={({ field }) => (
                            <Select
                              onValueChange={(value) => {
                                // Add the selected value to the array if it's not already there
                                const currentList = field.value || [];
                                if (!currentList.includes(value)) {
                                  field.onChange([...currentList, value]);
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="הוסף תרגיל" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {exercises.map((exercise) => (
                                  <SelectItem 
                                    key={exercise.id} 
                                    value={exercise.exercise_name}
                                  >
                                    {exercise.exercise_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.watch('exercise_list') && form.watch('exercise_list')!.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {form.watch('exercise_list')!.map((exercise, index) => (
                              <div 
                                key={index}
                                className="flex items-center justify-between p-2 bg-muted rounded"
                              >
                                <span>{exercise}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updatedList = [...form.watch('exercise_list')!];
                                    updatedList.splice(index, 1);
                                    form.setValue('exercise_list', updatedList);
                                  }}
                                >
                                  הסר
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Session Summary */}
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>סיכום הפגישה</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ''}
                          placeholder="תיאור הפגישה, בעיות שהועלו, התקדמות וכו'"
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter className="sticky bottom-0 bg-background pt-4 mt-4 border-t flex flex-row-reverse gap-2 sm:gap-0">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'מוסיף...' : 'הוסף פגישה'}
              </Button>
              <Button variant="outline" onClick={onClose} type="button">ביטול</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSessionDialog;
