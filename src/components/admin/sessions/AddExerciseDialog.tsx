
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabaseClient as supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

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

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExerciseAdded: () => void;
}

const formSchema = z.object({
  exercise_name: z.string().min(1, { message: 'שם התרגיל נדרש' }),
  description: z.string().optional().nullable(),
  file_url: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const AddExerciseDialog: React.FC<AddExerciseDialogProps> = ({
  open,
  onOpenChange,
  onExerciseAdded,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exercise_name: '',
      description: '',
      file_url: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.from('exercises').insert({
        exercise_name: values.exercise_name,
        description: values.description || null,
        file_url: values.file_url || null,
      });

      if (error) throw error;

      toast({
        title: 'תרגיל נוסף בהצלחה',
        description: 'התרגיל נוסף למאגר בהצלחה'
      });
      
      onExerciseAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding exercise:', error);
      toast({
        title: 'שגיאה בהוספת תרגיל',
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
          <DialogTitle className="text-center text-purple-800">הוסף תרגיל חדש</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">            
            <FormField
              control={form.control}
              name="exercise_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700">שם התרגיל</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="הזן שם לתרגיל" 
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700">תיאור התרגיל</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="הזן תיאור לתרגיל (אופציונלי)" 
                      {...field} 
                      value={field.value || ''}
                      className="min-h-[100px] border-purple-200 focus-visible:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="file_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-700">קישור לקובץ</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="הזן קישור לקובץ (אופציונלי)" 
                      {...field} 
                      value={field.value || ''}
                      className="border-purple-200 focus-visible:ring-purple-500"
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
                {isLoading ? 'מוסיף...' : 'הוסף תרגיל'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
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

export default AddExerciseDialog;
