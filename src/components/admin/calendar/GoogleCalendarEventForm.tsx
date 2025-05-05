
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Clock, User, Video, Phone } from 'lucide-react';
import { format, addMinutes, parse, set } from 'date-fns';
import { useGoogleOAuth } from '@/hooks/useGoogleOAuth';
import { addFutureSessionToGoogleCalendar } from '@/utils/googleCalendarUtils';
import { CalendarSlot } from '@/types/calendar';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { supabaseClient } from '@/lib/supabaseClient';
import { Patient } from '@/types/patient';

// Define schema for form validation
const eventFormSchema = z.object({
  patientId: z.union([
    z.number(),
    z.string().transform((val) => parseInt(val, 10)),
    z.null(),
  ]),
  meetingType: z.enum(['Zoom', 'Phone', 'In-Person', 'Private']),
  date: z.date({
    required_error: 'חובה לבחור תאריך',
  }),
  startTime: z.string().min(1, {
    message: 'חובה לבחור שעת התחלה',
  }),
  endTime: z.string().min(1, {
    message: 'חובה לבחור שעת סיום',
  }),
  notes: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

type SelectOption = {
  value: string;
  label: string;
};

export function GoogleCalendarEventForm() {
  const { createEvent, isAuthenticated } = useGoogleOAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPrivateTime, setIsPrivateTime] = useState<boolean>(false);

  // Generate time options in 15-minute intervals
  const generateTimeOptions = (): SelectOption[] => {
    const options: SelectOption[] = [];
    for (let hour = 8; hour < 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push({
          value: timeString,
          label: timeString,
        });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();
  
  // Initialize form with validation schema
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      patientId: null,
      meetingType: 'Phone',
      startTime: '',
      endTime: '',
      notes: '',
    },
  });

  // Watch for meeting type changes to toggle private time mode
  const meetingType = form.watch('meetingType');
  useEffect(() => {
    setIsPrivateTime(meetingType === 'Private');
  }, [meetingType]);

  // Set default times when the component loads
  useEffect(() => {
    const now = new Date();
    // Round to nearest 15 minutes
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    
    const startDate = new Date();
    startDate.setHours(now.getHours(), minutes === 60 ? 0 : minutes, 0, 0);
    
    const endDate = new Date(startDate);
    // Default session length is 90 minutes
    endDate.setMinutes(endDate.getMinutes() + 90);
    
    form.setValue('date', now);
    form.setValue('startTime', format(startDate, 'HH:mm'));
    form.setValue('endTime', format(endDate, 'HH:mm'));
  }, [form]);

  // Fetch patients when component mounts
  useEffect(() => {
    async function fetchPatients() {
      try {
        const supabase = await supabaseClient();
        const { data, error } = await supabase
          .from('patients')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    }

    fetchPatients();
  }, []);

  // Handle form submission
  async function onSubmit(data: EventFormValues) {
    if (!isAuthenticated) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר לגוגל תחילה",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format date and times for Google Calendar
      const startDateTime = combineDateTime(data.date, data.startTime);
      const endDateTime = combineDateTime(data.date, data.endTime);
      
      // Create a summary based on meeting type
      let summary = '';
      let description = data.notes || '';
      
      if (data.meetingType === 'Private') {
        // For private time
        summary = 'זמן פרטי';
        if (data.notes) {
          description = data.notes;
        }
      } else {
        // For patient meetings
        const selectedPatient = patients.find(p => p.id === data.patientId);
        if (selectedPatient) {
          summary = `פגישה עם ${selectedPatient.name}`;
          description = `סוג פגישה: ${getMeetingTypeInHebrew(data.meetingType)}\n${data.notes || ''}`;
        } else {
          summary = 'פגישה חדשה';
          description = `סוג פגישה: ${getMeetingTypeInHebrew(data.meetingType)}\n${data.notes || ''}`;
        }
      }
      
      // Create event in Google Calendar
      const eventId = await createEvent(
        summary,
        startDateTime,
        endDateTime,
        description
      );
      
      // If not private time and has patient, also save to future_sessions table
      if (data.meetingType !== 'Private' && data.patientId) {
        await saveFutureSession(data, startDateTime);
      }
      
      if (eventId) {
        toast({
          title: "האירוע נוצר בהצלחה",
          description: "האירוע נוסף ליומן Google שלך",
        });
        form.reset({
          patientId: null,
          meetingType: 'Phone',
          date: new Date(),
          startTime: format(new Date(), 'HH:mm'),
          endTime: format(addMinutes(new Date(), 90), 'HH:mm'),
          notes: '',
        });
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "שגיאה ביצירת האירוע",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Helper function to combine date and time into ISO string
  function combineDateTime(date: Date, timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime.toISOString();
  }
  
  // Convert meeting type to Hebrew
  function getMeetingTypeInHebrew(type: string): string {
    const types: Record<string, string> = {
      'Zoom': 'זום',
      'Phone': 'טלפון',
      'In-Person': 'פגישה פרונטלית',
      'Private': 'זמן פרטי'
    };
    return types[type] || type;
  }
  
  // Save to future_sessions table
  async function saveFutureSession(data: EventFormValues, startDateTime: string) {
    try {
      const supabase = await supabaseClient();
      
      const newSession = {
        patient_id: data.patientId,
        session_date: startDateTime,
        meeting_type: data.meetingType,
        status: 'Scheduled',
        zoom_link: data.meetingType === 'Zoom' ? 'https://zoom.us' : null
      };
      
      const { error } = await supabase
        .from('future_sessions')
        .insert(newSession);
        
      if (error) throw error;
      
      toast({
        title: "הפגישה נשמרה",
        description: "הפגישה נשמרה בהצלחה בטבלת הפגישות העתידיות",
      });
    } catch (error: any) {
      console.error("Error saving future session:", error);
      toast({
        title: "שגיאה בשמירת הפגישה",
        description: error.message,
        variant: "destructive"
      });
    }
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
              name="meetingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג פגישה</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset patient if switching to private
                      if (value === 'Private') {
                        form.setValue('patientId', null);
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סוג פגישה" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Phone">טלפון</SelectItem>
                      <SelectItem value="Zoom">זום</SelectItem>
                      <SelectItem value="In-Person">פגישה פרונטלית</SelectItem>
                      <SelectItem value="Private">זמן פרטי</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!isPrivateTime && (
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>פגישה עם</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      value={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר לקוח/ה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>תאריך</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-right font-normal flex justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעת התחלה</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר שעת התחלה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעת סיום</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר שעת סיום" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={isPrivateTime ? "הערות לגבי הזמן הפרטי" : "הערות נוספות לגבי הפגישה"} 
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
              disabled={form.formState.isSubmitting || isLoading}
            >
              {form.formState.isSubmitting || isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  מוסיף פגישה...
                </span>
              ) : (
                isPrivateTime ? "הוסף זמן פרטי ליומן" : "הוסף פגישה ללקוח"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
