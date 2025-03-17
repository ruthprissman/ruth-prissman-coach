
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/patient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  patient: Patient | null;
  onPatientUpdated?: () => void;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "שם חייב להכיל לפחות 2 תווים" }),
  phone: z.string().nullable().optional(),
  email: z.string().email({ message: "אימייל לא תקין" }).nullable().optional(),
  notes: z.string().nullable().optional(),
  session_price: z.union([
    z.number().min(0, { message: "מחיר חייב להיות חיובי" }),
    z.null()
  ]),
});

type FormValues = z.infer<typeof formSchema>;

const EditClientDialog: React.FC<EditClientDialogProps> = ({
  open,
  onOpenChange,
  patient,
  onPatientUpdated,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: null,
      email: null,
      notes: null,
      session_price: null,
    },
  });

  // Update form values when patient data changes or dialog opens
  useEffect(() => {
    if (patient && open) {
      form.reset({
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        notes: patient.notes,
        session_price: patient.session_price,
      });
    }
  }, [patient, open, form]);

  const onSubmit = async (values: FormValues) => {
    if (!patient) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          name: values.name,
          phone: values.phone,
          email: values.email,
          notes: values.notes,
          session_price: values.session_price,
        })
        .eq('id', patient.id);
      
      if (error) throw error;
      
      toast({
        title: "לקוחה עודכנה בהצלחה",
        description: "פרטי הלקוחה עודכנו במערכת",
      });
      
      onOpenChange(false);
      if (onPatientUpdated) onPatientUpdated();
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "שגיאה בעדכון פרטי לקוחה",
        description: "אירעה שגיאה בעת עדכון הפרטים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-purple-700">עריכת פרטי לקוחה</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>טלפון</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)} 
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
                  <FormLabel>אימייל</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                      type="email"
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
                  <FormLabel>מחיר לפגישה (₪)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      {...field}
                      value={field.value === null ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number(e.target.value);
                        field.onChange(value);
                      }}
                      min="0"
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
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                {isLoading ? 'שומר...' : 'שמור'}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
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
