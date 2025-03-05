
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Session } from '@/types/patient';

interface AddSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSession: (session: Omit<Session, 'id'>) => Promise<boolean>;
  patientId: number;
}

const SessionSchema = z.object({
  summary: z.string().optional().or(z.literal('')),
  exercise: z.string().optional().or(z.literal('')),
});

type SessionFormValues = z.infer<typeof SessionSchema>;

const AddSessionDialog: React.FC<AddSessionDialogProps> = ({ isOpen, onClose, onAddSession, patientId }) => {
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(SessionSchema),
    defaultValues: {
      summary: '',
      exercise: '',
    },
  });

  const onSubmit = async (data: SessionFormValues) => {
    const success = await onAddSession({
      patient_id: patientId,
      session_date: new Date().toISOString(),
      summary: data.summary || null,
      exercise: data.exercise || null,
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
          <DialogTitle className="text-center">הוספת פגישה חדשה</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סיכום הפגישה</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="תיאור הפגישה, בעיות שהועלו, התקדמות וכו'"
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="exercise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תרגילים שניתנו</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="תרגילים שניתנו למטופל להמשך עבודה בבית"
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
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
