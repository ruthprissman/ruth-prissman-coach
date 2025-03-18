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
import FileUploadField from './FileUploadField';

interface AddExerciseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseAdded: () => void;
}

const formSchema = z.object({
  exercise_name: z.string().min(1, { message: 'שם התרגיל נדרש' }),
  description: z.string().optional(),
  file: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AddExerciseDialog: React.FC<AddExerciseDialogProps> = ({
  isOpen,
  onClose,
  onExerciseAdded,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exercise_name: '',
      description: '',
      file: undefined,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const validateFileName = (file?: File): boolean => {
    if (!file) return true;
    
    // Check if filename contains Hebrew characters
    const hebrewPattern = /[\u0590-\u05FF]/;
    if (hebrewPattern.test(file.name)) {
      toast({
        title: 'שם קובץ לא תקין',
        description: 'יש לשנות את שם הקובץ לאנגלית בלבד',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('exercises_files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('exercises_files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'שגיאה בהעלאת הקובץ',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // Validate filename if file exists
      if (values.file && !validateFileName(values.file)) {
        setIsLoading(false);
        return;
      }

      // If file exists, upload it
      let fileUrl = null;
      if (values.file) {
        fileUrl = await uploadFile(values.file);
        if (!fileUrl) {
          setIsLoading(false);
          return;
        }
      }

      // Insert exercise into database without patient_id
      const { error } = await supabase.from('exercises').insert({
        exercise_name: values.exercise_name,
        description: values.description || null,
        file_url: fileUrl,
      });

      if (error) throw error;

      toast({
        title: 'תרגיל נוסף בהצלחה',
        description: 'התרגיל נוסף למאגר בהצלחה'
      });
      
      onExerciseAdded();
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>הוסף תרגיל חדש</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">            
            <FormField
              control={form.control}
              name="exercise_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם התרגיל</FormLabel>
                  <FormControl>
                    <Input placeholder="הזן שם לתרגיל" {...field} />
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
                  <FormLabel>תיאור התרגיל</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="הזן תיאור לתרגיל (אופציונלי)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>קובץ תרגיל (אופציונלי)</FormLabel>
                  <FormControl>
                    <FileUploadField
                      {...field}
                      onFileSelected={(file) => onChange(file)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                ביטול
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'מוסיף...' : 'הוסף תרגיל'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExerciseDialog;
