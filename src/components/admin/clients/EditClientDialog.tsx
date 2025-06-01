import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/types/patient';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onPatientUpdated?: () => void;
}

const phoneRegex = /^0\d{8,9}$/; // Simple Israeli phone validation

const patientSchema = z.object({
  name: z.string().min(1, { message: 'שם הלקוח נדרש' }),
  phone: z.string().regex(phoneRegex, { message: 'מספר טלפון לא תקין' }).nullable().or(z.literal('')),
  email: z.string().email({ message: 'כתובת אימייל לא תקינה' }).nullable().or(z.literal('')),
  notes: z.string().nullable().or(z.literal('')),
  session_price: z.coerce.number().nonnegative().nullable().or(z.literal('')),
});

type FormValues = z.infer<typeof patientSchema>;

const EditClientDialog: React.FC<EditClientDialogProps> = ({
  open,
  onOpenChange,
  patient,
  onPatientUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient.name,
      phone: patient.phone || '',
      email: patient.email || '',
      notes: patient.notes || '',
      session_price: patient.session_price || '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: patient.name,
        phone: patient.phone || '',
        email: patient.email || '',
        notes: patient.notes || '',
        session_price: patient.session_price || '',
      });
    }
  }, [open, patient, form]);

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // Convert empty strings to null for database
      const patientData = {
        name: values.name,
        phone: values.phone === '' ? null : values.phone,
        email: values.email === '' ? null : values.email,
        notes: values.notes === '' ? null : values.notes,
        session_price: values.session_price === '' ? null : values.session_price,
      };

      const supabase = supabaseClient();
      const { error } = await supabase
        .from('patients')
        .update(patientData)
        .eq('id', patient.id);

      if (error) throw error;

      toast({
        title: 'פרטי לקוח עודכנו בהצלחה',
        description: 'השינויים נשמרו במערכת',
      });
      
      if (onPatientUpdated) {
        onPatientUpdated();
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast({
        title: 'שגיאה בעדכון פרטי לקוח',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">עריכת פרטי לקוחה</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700">שם</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="הזן את שם הלקוח" 
                      {...field} 
                      className="border-purple-200 focus-visible:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700">טלפון</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="הזן מספר טלפון" 
                      {...field} 
                      value={field.value || ''}
                      className="border-purple-200 focus-visible:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700">אימייל</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="הזן כתובת אימייל" 
                      {...field} 
                      value={field.value || ''}
                      className="border-purple-200 focus-visible:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="session_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700">מחיר לפגישה (₪)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="הזן מחיר לפגישה" 
                      {...field} 
                      value={field.value === null ? '' : field.value}
                      className="border-purple-200 focus-visible:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700">הערות</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="הערות נוספות על הלקוח" 
                      {...field} 
                      value={field.value || ''}
                      className="min-h-[100px] border-purple-200 focus-visible:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'שומר...' : 'שמור שינויים'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                ביטול
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;
