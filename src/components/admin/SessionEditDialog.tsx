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
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Check } from 'lucide-react';
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

interface SessionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onSessionUpdated: () => void;
  sessionPrice?: number | null;
}

const SessionSchema = z.object({
  session_date: z.date(),
  meeting_type: z.enum(['Zoom', 'Phone', 'In-Person']),
  sent_exercises: z.boolean(),
  exercise_list: z.array(z.string()).nullable(),
  summary: z.string().nullable().optional(),
  paid_amount: z.number().nullable(),
  payment_method: z.enum(['cash', 'bit', 'transfer']).nullable(),
  payment_status: z.enum(['paid', 'partial', 'pending']),
  payment_date: z.date().nullable(),
  payment_notes: z.string().nullable().optional(),
});

type SessionFormValues = z.infer<typeof SessionSchema>;

const SessionEditDialog: React.FC<SessionEditDialogProps> = ({ 
  isOpen, 
  onClose, 
  session, 
  onSessionUpdated,
  sessionPrice = 0
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const [originalValues, setOriginalValues] = useState<SessionFormValues | null>(null);

  const mapPaymentStatus = (status: string): 'paid' | 'partial' | 'pending' => {
    if (status === 'paid') return 'paid';
    if (status === 'partially_paid') return 'partial';
    return 'pending';
  };

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(SessionSchema),
    defaultValues: {
      session_date: new Date(session.session_date),
      meeting_type: session.meeting_type,
      sent_exercises: session.sent_exercises,
      exercise_list: session.exercise_list,
      summary: session.summary,
      paid_amount: session.paid_amount || 0,
      payment_method: session.payment_method || null,
      payment_status: mapPaymentStatus(session.payment_status || 'pending'),
      payment_date: session.payment_date ? new Date(session.payment_date) : null,
      payment_notes: session.payment_notes || null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      const initialValues = {
        session_date: new Date(session.session_date),
        meeting_type: session.meeting_type,
        sent_exercises: session.sent_exercises,
        exercise_list: session.exercise_list,
        summary: session.summary,
        paid_amount: session.paid_amount || 0,
        payment_method: session.payment_method || null,
        payment_status: mapPaymentStatus(session.payment_status || 'pending'),
        payment_date: session.payment_date ? new Date(session.payment_date) : null,
        payment_notes: session.payment_notes || null,
      };
      setOriginalValues(initialValues);
      form.reset(initialValues);
      setHasChanges(false);
    }
  }, [isOpen, session, form]);

  useEffect(() => {
    if (originalValues) {
      const subscription = form.watch((value) => {
        const currentValues = form.getValues();
        const hasFormChanges = JSON.stringify(currentValues) !== JSON.stringify(originalValues);
        setHasChanges(hasFormChanges);
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, originalValues]);

  const exerciseList = form.watch('exercise_list');
  const paymentStatus = form.watch('payment_status');
  const paymentAmount = form.watch('paid_amount');
  
  useEffect(() => {
    if (paymentStatus === 'paid' && sessionPrice && form.getValues('paid_amount') === 0) {
      form.setValue('paid_amount', sessionPrice, { shouldDirty: true });
      if (!form.getValues('payment_date')) {
        form.setValue('payment_date', new Date(), { shouldDirty: true });
      }
    } else if (paymentStatus === 'pending' && form.getValues('paid_amount') !== 0) {
      form.setValue('paid_amount', 0, { shouldDirty: true });
      form.setValue('payment_method', null, { shouldDirty: true });
      form.setValue('payment_date', null, { shouldDirty: true });
    }
  }, [paymentStatus, sessionPrice, form]);

  useEffect(() => {
    if (form.formState.dirtyFields.paid_amount) {
      if (paymentAmount === null || paymentAmount === 0) {
        if (form.getValues('payment_status') !== 'pending') {
          form.setValue('payment_status', 'pending', { shouldDirty: true });
        }
      } else if (sessionPrice && paymentAmount < sessionPrice) {
        if (form.getValues('payment_status') !== 'partial') {
          form.setValue('payment_status', 'partial', { shouldDirty: true });
        }
      } else if (sessionPrice && paymentAmount >= sessionPrice) {
        if (form.getValues('payment_status') !== 'paid') {
          form.setValue('payment_status', 'paid', { shouldDirty: true });
        }
      }
    }
  }, [paymentAmount, form, sessionPrice]);

  useEffect(() => {
    if (exerciseList && exerciseList.length > 0 && !form.getValues('sent_exercises')) {
      form.setValue('sent_exercises', true, { shouldDirty: true });
    }
  }, [exerciseList, form]);

  useEffect(() => {
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
    setIsLoading(true);
    try {
      if (data.exercise_list && data.exercise_list.length > 0) {
        data.sent_exercises = true;
      }
      
      if (data.payment_status === 'pending') {
        data.paid_amount = 0;
        data.payment_method = null;
        data.payment_date = null;
      } else if (!data.payment_method && (data.payment_status === 'paid' || data.payment_status === 'partial')) {
        data.payment_method = 'cash';
      }
      
      const { error } = await supabase
        .from('sessions')
        .update({
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
        })
        .eq('id', session.id);
      
      if (error) throw error;
      
      await updatePatientFinancialStatus(session.patient_id);
      
      toast({
        title: "השינויים נשמרו בהצלחה!",
        description: "פרטי הפגישה עודכנו במערכת",
      });
      
      setHasChanges(false);
      onSessionUpdated();
    } catch (error: any) {
      console.error('Error updating session:', error);
      toast({
        title: "שגיאה בעדכון פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePatientFinancialStatus = async (patientId: number) => {
    try {
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .neq('payment_status', 'paid');
      
      if (error) throw error;
      
      const financialStatus = count && count > 0 ? 'Has Outstanding Payments' : 'No Debts';
      
      const { error: updateError } = await supabase
        .from('patients')
        .update({ financial_status: financialStatus })
        .eq('id', patientId);
      
      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating patient financial status:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-[800px] max-h-[90vh] overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle className="text-center">ערוך פגישה</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="overflow-auto max-h-[65vh] pr-2 -mr-2">
              <div className="space-y-4">
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
                          <SelectItem value="In-Person">פגישה פרונטית</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4 border p-4 rounded-lg">
                  <h3 className="font-medium text-center">פרטי תשלום</h3>
                  
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
                            <SelectItem value="paid">שולם</SelectItem>
                            <SelectItem value="partial">שולם חלקית</SelectItem>
                            <SelectItem value="pending">ממתין לתשלום</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                  
                  {form.watch('payment_status') !== 'pending' && (
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
                              <SelectItem value="cash">מזומן</SelectItem>
                              <SelectItem value="bit">ביט</SelectItem>
                              <SelectItem value="transfer">העברה בנקאית</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {form.watch('payment_status') !== 'pending' && (
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
                                const currentList = field.value || [];
                                if (!currentList.includes(value)) {
                                  field.onChange([...currentList, value]);
                                  form.setValue('sent_exercises', true, { shouldDirty: true });
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
                                    form.setValue('exercise_list', updatedList, { shouldDirty: true });
                                    if (updatedList.length === 0) {
                                      form.setValue('sent_exercises', false, { shouldDirty: true });
                                    }
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
              <Button 
                type="submit" 
                disabled={isLoading || !hasChanges}
                className="flex items-center"
              >
                {isLoading ? 'מעדכן...' : 'שמור שינויים'}
                {!isLoading && hasChanges && <Check className="ml-2 h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={onClose} type="button">ביטול</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SessionEditDialog;
