import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FutureSession } from '@/types/session';
import { Patient } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { getSupabaseWithAuth } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { formatDateInIsraelTimeZone, calculateSessionEndTime } from '@/utils/dateUtils';

interface ConvertSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FutureSession;
  patient: Patient;
  onSessionConverted: () => void;
}

// Validation schema for the form
const sessionSchema = z.object({
  summaryNotes: z.string().optional(),
  paid: z.enum(['paid', 'unpaid', 'partial']),
  paidAmount: z.string().optional(),
  paymentMethod: z.enum(['cash', 'bit', 'transfer']).optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

const ConvertSessionDialog: React.FC<ConvertSessionDialogProps> = ({
  open,
  onOpenChange,
  session,
  patient,
  onSessionConverted
}) => {
  const { session: authSession } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get formatted session date and time using Israel timezone
  const formattedDate = formatDateInIsraelTimeZone(session.session_date, 'PPP');
  const formattedTime = formatDateInIsraelTimeZone(session.session_date, 'HH:mm');
  const endTime = calculateSessionEndTime(session.session_date);

  // Initialize form with default values
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      summaryNotes: '',
      paid: 'unpaid',
      paidAmount: patient.session_price ? patient.session_price.toString() : '',
      paymentMethod: 'cash',
    },
  });

  // Watch the paid field to conditionally render fields
  const paidField = form.watch('paid');

  // Handle form submission
  const onSubmit = async (values: SessionFormValues) => {
    try {
      setIsSubmitting(true);
      const supabase = getSupabaseWithAuth(authSession?.access_token);
      
      // Calculate payment information
      const isPaid = values.paid === 'paid';
      const isPartiallyPaid = values.paid === 'partial';
      const paidAmount = (isPaid || isPartiallyPaid) && values.paidAmount ? parseInt(values.paidAmount) : 0;
      const paymentStatus = isPaid ? 'paid' : isPartiallyPaid ? 'partially_paid' : 'unpaid';
      
      // Create new session record
      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          patient_id: patient.id,
          session_date: session.session_date, // Using the original session_date
          meeting_type: session.meeting_type,
          summary: values.summaryNotes,
          sent_exercises: false,
          paid_amount: paidAmount,
          payment_method: isPaid || isPartiallyPaid ? values.paymentMethod : null,
          payment_status: paymentStatus,
          payment_date: isPaid || isPartiallyPaid ? new Date().toISOString() : null,
        })
        .select()
        .single();
      
      if (sessionError) throw new Error(sessionError.message);
      
      // Delete the future session
      const { error: deleteError } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', session.id);
      
      if (deleteError) throw new Error(deleteError.message);
      
      // Update patient financial status if needed
      if (paymentStatus !== 'paid') {
        await updatePatientFinancialStatus(patient.id, supabase);
      }
      
      toast({
        title: 'פגישה הומרה בהצלחה',
        description: `פגישה חדשה נוצרה עבור ${patient.name}`,
      });
      
      onSessionConverted();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error converting session:', error);
      toast({
        title: 'שגיאה בהמרת פגישה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update patient financial status
  const updatePatientFinancialStatus = async (patientId: number, supabase: any) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>המרת פגישה עתידית לפגישה שהושלמה</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">מטופל/ת:</span>
              <span>{patient.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">תאריך:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">שעה:</span>
              <span>{formattedTime} - {endTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">סוג פגישה:</span>
              <span>{session.meeting_type}</span>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <FormField
                control={form.control}
                name="summaryNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סיכום פגישה</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="הוסף סיכום פגישה..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paid"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>סטטוס תשלום</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="paid" id="paid" />
                          <Label htmlFor="paid">שולם</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="partial" id="partial" />
                          <Label htmlFor="partial">שולם חלקית</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="unpaid" id="unpaid" />
                          <Label htmlFor="unpaid">לא שולם</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {(paidField === 'paid' || paidField === 'partial') && (
                <>
                  <FormField
                    control={form.control}
                    name="paidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סכום ששולם (₪)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>אמצעי תשלום</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="cash" id="cash" />
                              <Label htmlFor="cash">מזומן</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="bit" id="bit" />
                              <Label htmlFor="bit">ביט</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RadioGroupItem value="transfer" id="transfer" />
                              <Label htmlFor="transfer">העברה בנקאית</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <DialogFooter className="mt-6 gap-2 sm:gap-0">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'מעבד...' : 'המר פגישה'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  ביטול
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertSessionDialog;
