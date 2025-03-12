
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Patient } from '@/types/patient';

interface AddPatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: Omit<Patient, 'id'>) => Promise<boolean>;
}

const PatientSchema = z.object({
  name: z.string().min(2, { message: 'השם חייב להכיל לפחות 2 תווים' }),
  phone: z.string().optional(),
  email: z.string().email({ message: 'אימייל לא תקין' }).optional().or(z.literal('')),
  notes: z.string().optional(),
  session_price: z.string().transform(val => val === '' ? null : Number(val)).optional(),
});

type PatientFormValues = z.infer<typeof PatientSchema>;

const AddPatientDialog: React.FC<AddPatientDialogProps> = ({ isOpen, onClose, onAddPatient }) => {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(PatientSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      notes: '',
      session_price: '',
    },
  });

  const onSubmit = async (data: PatientFormValues) => {
    const success = await onAddPatient({
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
      session_price: data.session_price === '' ? null : data.session_price,
    });
    
    if (success) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">הוספת מטופל חדש</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם מלא</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ישראל ישראלי" />
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
                    <Input {...field} placeholder="052-1234567" />
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
                    <Input {...field} placeholder="example@example.com" type="email" />
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
                    <Input {...field} placeholder="300" type="number" />
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
                    <Textarea {...field} placeholder="הערות נוספות אודות המטופל" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'מוסיף...' : 'הוסף מטופל'}
              </Button>
              <Button variant="outline" onClick={onClose} type="button">ביטול</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPatientDialog;
