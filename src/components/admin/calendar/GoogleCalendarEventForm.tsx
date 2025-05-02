
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';

// Define schema for form validation
const eventFormSchema = z.object({
  summary: z.string().min(2, {
    message: 'כותרת הפגישה חייבת להיות לפחות 2 תווים',
  }),
  startDateTime: z.string().min(1, {
    message: 'חובה לבחור תאריך ושעת התחלה',
  }),
  endDateTime: z.string().min(1, {
    message: 'חובה לבחור תאריך ושעת סיום',
  }),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export function GoogleCalendarEventForm() {
  // Use useGoogleAuth from context instead of the removed useGoogleOAuth hook
  const { isAuthenticated, createEvent } = useGoogleAuth();
  
  // Initialize form with validation schema
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      summary: '',
      startDateTime: '',
      endDateTime: '',
      description: '',
    },
  });

  // Set default times when the component loads
  React.useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = Math.ceil(now.getMinutes() / 15) * 15; // Round to nearest 15 min
    
    const startDate = new Date();
    startDate.setHours(hour, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1); // Default to 1 hour duration
    
    form.setValue('startDateTime', format(startDate, "yyyy-MM-dd'T'HH:mm"));
    form.setValue('endDateTime', format(endDate, "yyyy-MM-dd'T'HH:mm"));
  }, [form]);

  // Handle form submission
  async function onSubmit(data: EventFormValues) {
    if (!isAuthenticated) {
      return;
    }
    
    await createEvent(
      data.summary,
      data.startDateTime,
      data.endDateTime,
      data.description || ''
    );
    
    form.reset();
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>הוספת פגישה ליומן Google</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <p className="text-red-500">לא התקבלה גישה ליומן הגוגל שלך</p>
            <p className="text-sm mt-2">יש להתחבר דרך גוגל עם הרשאות יומן כדי להוסיף פגישות</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>הוספת פגישה ליומן Google</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כותרת הפגישה</FormLabel>
                  <FormControl>
                    <Input placeholder="הוסף כותרת לפגישה" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך ושעת התחלה</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="datetime-local" 
                          className="pr-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תאריך ושעת סיום</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="datetime-local" 
                          className="pr-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="הוסף תיאור או פרטים נוספים" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  מוסיף פגישה...
                </span>
              ) : (
                "הוסף פגישה ליומן"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
