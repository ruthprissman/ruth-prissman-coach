
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Exercise } from '@/types/patient';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface ExerciseManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExerciseSchema = z.object({
  exercise_name: z.string().min(1, { message: "שם התרגיל נדרש" }),
  description: z.string().optional(),
});

type ExerciseFormValues = z.infer<typeof ExerciseSchema>;

const ExerciseManagerDialog: React.FC<ExerciseManagerDialogProps> = ({ isOpen, onClose }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExerciseId, setCurrentExerciseId] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(ExerciseSchema),
    defaultValues: {
      exercise_name: "",
      description: "",
    },
  });

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('exercise_name');
      
      if (error) throw error;
      
      setExercises(data || []);
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
      toast({
        title: "שגיאה בטעינת התרגילים",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen]);

  const handleAddExercise = async (data: ExerciseFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('exercises')
        .insert([{
          exercise_name: data.exercise_name,
          description: data.description || null,
        }]);
      
      if (error) throw error;
      
      toast({
        title: "תרגיל נוסף בהצלחה",
        description: `התרגיל "${data.exercise_name}" נוסף למאגר`,
      });
      
      form.reset();
      fetchExercises();
    } catch (error: any) {
      console.error('Error adding exercise:', error);
      toast({
        title: "שגיאה בהוספת תרגיל",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExercise = async (data: ExerciseFormValues) => {
    if (!currentExerciseId) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('exercises')
        .update({
          exercise_name: data.exercise_name,
          description: data.description || null,
        })
        .eq('id', currentExerciseId);
      
      if (error) throw error;
      
      toast({
        title: "תרגיל עודכן בהצלחה",
        description: `התרגיל "${data.exercise_name}" עודכן במאגר`,
      });
      
      form.reset();
      setIsEditing(false);
      setCurrentExerciseId(null);
      fetchExercises();
    } catch (error: any) {
      console.error('Error updating exercise:', error);
      toast({
        title: "שגיאה בעדכון תרגיל",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExercise = async (id: number) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק תרגיל זה?")) return;
    
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "תרגיל נמחק בהצלחה",
        description: "התרגיל הוסר מהמאגר",
      });
      
      fetchExercises();
    } catch (error: any) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "שגיאה במחיקת תרגיל",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    form.reset({
      exercise_name: exercise.exercise_name,
      description: exercise.description || '',
    });
    setIsEditing(true);
    setCurrentExerciseId(exercise.id);
  };

  const handleCancelEdit = () => {
    form.reset();
    setIsEditing(false);
    setCurrentExerciseId(null);
  };

  const onSubmit = (data: ExerciseFormValues) => {
    if (isEditing) {
      handleUpdateExercise(data);
    } else {
      handleAddExercise(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">ניהול מאגר תרגילים</DialogTitle>
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
                    <Input {...field} placeholder="הזן שם תרגיל" />
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
                      {...field} 
                      placeholder="הזן תיאור לתרגיל (אופציונלי)"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-2 justify-end">
              {isEditing && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                >
                  ביטול עריכה
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'שומר...' : isEditing ? 'עדכן תרגיל' : 'הוסף תרגיל חדש'}
                {!isEditing && <Plus className="mr-1 h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Form>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">רשימת התרגילים</h3>
          
          {isLoading ? (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-center text-gray-500">אין תרגילים במאגר</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {exercises.map((exercise) => (
                <div 
                  key={exercise.id}
                  className="flex items-center justify-between p-3 bg-muted rounded"
                >
                  <div>
                    <p className="font-medium">{exercise.exercise_name}</p>
                    {exercise.description && (
                      <p className="text-sm text-gray-500 mt-1">{exercise.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditExercise(exercise)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteExercise(exercise.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseManagerDialog;
