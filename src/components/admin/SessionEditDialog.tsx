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

interface SessionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onSessionUpdated: () => void;
}

const SessionSchema = z.object({
  session_date: z.date(),
  meeting_type: z.enum(['Zoom', 'Phone', 'In-Person']),
  sent_exercises: z.boolean(),
  exercise_list: z.array(z.string()).nullable(),
  summary: z.string().nullable().optional(),
});

type SessionFormValues = z.infer<typeof SessionSchema>;

const SessionEditDialog: React.FC<SessionEditDialogProps> = ({ 
  isOpen, 
  onClose, 
  session, 
  onSessionUpdated 
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(SessionSchema),
    defaultValues: {
      session_date: new Date(session.session_date),
      meeting_type: session.meeting_type,
      sent_exercises: session.sent_exercises,
      exercise_list: session.exercise_list,
      summary: session.summary,
    },
  });

  const exerciseList = form.watch('exercise_list');
  
  useEffect(() => {
    if (exerciseList && exerciseList.length > 0 && !form.getValues('sent_exercises')) {
      form.setValue('sent_exercises', true);
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
      
      const { error } = await supabase
        .from('sessions')
        .update({
          session_date: data.session_date.toISOString(),
          meeting_type: data.meeting_type,
          sent_exercises: data.sent_exercises,
          exercise_list: data.exercise_list,
          summary: data.summary,
        })
        .eq('id', session.id);
      
      if (error) throw error;
      
      toast({
        title: "פגישה עודכנה בהצלחה",
        description: "פרטי הפגישה עודכנו במערכת",
      });
      
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">ערוך פגישה</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <SelectItem value="In-Person">פגישה פרונטלית</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                              form.setValue('sent_exercises', true);
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
                                if (updatedList.length === 0) {
                                  form.setValue('sent_exercises', false);
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
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'מעדכן...' : 'עדכון פגישה'}
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
