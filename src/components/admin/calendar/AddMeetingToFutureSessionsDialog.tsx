
import React, { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { supabaseClient } from '@/lib/supabaseClient';
import { CalendarSlot } from '@/types/calendar';
import { FutureSession } from '@/types/session';
import { Patient } from '@/types/patient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage, 
  FormDescription 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DatabaseService } from '@/services/DatabaseService';

interface AddMeetingToFutureSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingData: CalendarSlot | null;
  onCreated?: () => void;
}

// Form validation schema
const formSchema = z.object({
  patient_id: z.number({
    required_error: "יש לבחור מטופל",
  }),
  patient_name: z.string().optional(),
  session_date: z.string({
    required_error: "יש להזין תאריך ושעה לפגישה",
  }),
  meeting_type: z.enum(['Phone', 'Zoom', 'In-Person'], {
    required_error: "יש לבחור סוג פגישה",
  }),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled'], {
    required_error: "יש לבחור סטטוס",
  }),
  zoom_link: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Component version for debugging
const COMPONENT_VERSION = "1.1.0";

const AddMeetingToFutureSessionsDialog: React.FC<AddMeetingToFutureSessionsDialogProps> = ({
  open,
  onOpenChange,
  meetingData,
  onCreated,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const dbService = new DatabaseService();
  
  console.log(`MEETING_SAVE_DEBUG: Component loaded, version ${COMPONENT_VERSION}`);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      meeting_type: 'Phone',
      status: 'Scheduled',
      zoom_link: '',
      notes: '',
    },
  });

  // Extract client name from meeting notes
  const extractClientName = (notes: string | undefined): string => {
    if (!notes || !notes.startsWith('פגישה עם')) return '';
    return notes.replace('פגישה עם', '').trim();
  };

  // Search for patient by name
  const searchPatientByName = async (name: string) => {
    if (!name) return [];
    
    console.log(`MEETING_SAVE_DEBUG: Searching for patient with name: "${name}"`);
    setIsSearching(true);
    setError(null);
    
    try {
      const supabase = await supabaseClient();
      
      console.log(`MEETING_SAVE_DEBUG: Supabase client initialized for patient search`);
      
      const { data, error, status } = await supabase
        .from('patients')
        .select('id, name, phone, email, notes, session_price') // Explicitly select required fields
        .ilike('name', `%${name}%`)
        .order('name', { ascending: true })
        .limit(5);
        
      console.log(`MEETING_SAVE_DEBUG: Patient search completed, status: ${status}`);
      
      if (error) {
        console.error(`MEETING_SAVE_DEBUG: Error in patient search:`, error);
        throw error;
      }
      
      console.log(`MEETING_SAVE_DEBUG: Found ${data?.length || 0} patient(s):`, data);
      
      // Ensure the data matches the Patient interface
      return data as Patient[];
    } catch (err: any) {
      console.error('MEETING_SAVE_DEBUG: Error searching for patient:', err.message);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  // Reset form when meeting data changes
  useEffect(() => {
    if (meetingData && open) {
      console.log(`MEETING_SAVE_DEBUG: Setting form data from meetingData:`, meetingData);
      
      // Extract meeting date and time
      const meetingDate = meetingData.date;
      const meetingTime = meetingData.exactStartTime || meetingData.hour;
      
      // Format the session date
      const formattedSessionDate = `${meetingDate}T${meetingTime}:00`;
      console.log(`MEETING_SAVE_DEBUG: Formatted session date: ${formattedSessionDate}`);
      
      // Extract client name from notes
      const clientName = extractClientName(meetingData.notes);
      console.log(`MEETING_SAVE_DEBUG: Extracted client name: "${clientName}"`);
      
      // Reset form with new values
      form.reset({
        patient_id: undefined,
        patient_name: clientName,
        session_date: formattedSessionDate,
        meeting_type: 'Phone',
        status: 'Scheduled',
        zoom_link: '',
        notes: meetingData.description || '',
      });
      
      // Search for patient if name is available
      if (clientName) {
        searchPatientByName(clientName).then(results => {
          setSearchResults(results);
          
          // If we have exactly one result, select it automatically
          if (results.length === 1) {
            setSelectedPatient(results[0]);
            form.setValue('patient_id', results[0].id);
            console.log(`MEETING_SAVE_DEBUG: Automatically selected patient:`, results[0]);
          } else if (results.length === 0) {
            setError(`לא נמצא מטופל עם השם "${clientName}"`);
          }
        });
      }
    }
  }, [meetingData, open, form]);

  // Check authentication status
  const checkAuthentication = async () => {
    console.log(`MEETING_SAVE_DEBUG: Checking authentication status`);
    try {
      const supabase = await supabaseClient();
      const { data: session, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error(`MEETING_SAVE_DEBUG: Auth error:`, error);
        return false;
      }
      
      const hasSession = !!session && !!session.session;
      console.log(`MEETING_SAVE_DEBUG: User has active session: ${hasSession ? 'Yes' : 'No'}`);
      
      if (hasSession) {
        const { data: user } = await supabase.auth.getUser();
        console.log(`MEETING_SAVE_DEBUG: Current user:`, user?.user?.email);
      }
      
      return hasSession;
    } catch (err) {
      console.error(`MEETING_SAVE_DEBUG: Error checking auth:`, err);
      return false;
    }
  };

  const onSubmit = async (values: FormValues) => {
    console.log(`MEETING_SAVE_DEBUG: Form submitted with values:`, values);
    setIsLoading(true);
    setError(null);
    
    try {
      if (!values.patient_id) {
        console.error(`MEETING_SAVE_DEBUG: Missing patient_id in form submission`);
        throw new Error("יש לבחור מטופל תחילה");
      }
      
      // Check authentication before proceeding
      const isAuthenticated = await checkAuthentication();
      console.log(`MEETING_SAVE_DEBUG: Authentication check result: ${isAuthenticated}`);
      
      if (!isAuthenticated) {
        console.error(`MEETING_SAVE_DEBUG: User not authenticated`);
        throw new Error("אינך מחובר למערכת. יש להתחבר מחדש.");
      }
      
      // Create the data object to insert
      const sessionData: Partial<FutureSession> = {
        patient_id: values.patient_id,
        session_date: values.session_date,
        meeting_type: values.meeting_type,
        status: values.status,
        zoom_link: values.zoom_link || undefined,
      };
      
      console.log(`MEETING_SAVE_DEBUG: Attempting to create future session with data:`, sessionData);
      
      // Direct insertion using Supabase client for comparison
      const supabase = await supabaseClient();
      console.log(`MEETING_SAVE_DEBUG: Initialized direct Supabase client for insertion test`);
      
      const { data: directData, error: directError } = await supabase
        .from('future_sessions')
        .insert({
          ...sessionData,
          created_at: new Date().toISOString()
        })
        .select();
      
      console.log(`MEETING_SAVE_DEBUG: Direct insertion result:`, { data: directData, error: directError });
      
      if (directError) {
        console.error(`MEETING_SAVE_DEBUG: Direct insertion failed:`, directError);
        throw directError;
      }
      
      console.log(`MEETING_SAVE_DEBUG: Direct insertion succeeded:`, directData);
      
      toast({
        title: "נוספה פגישה חדשה",
        description: `פגישה עבור ${selectedPatient?.name || 'מטופל'} נוספה בהצלחה ליומן`,
      });
      
      // Close dialog and refresh data
      onOpenChange(false);
      
      // Only call onCreated if the insert was successful
      if (onCreated) {
        console.log(`MEETING_SAVE_DEBUG: Calling onCreated callback`);
        onCreated();
      }
      
    } catch (err: any) {
      console.error('MEETING_SAVE_DEBUG: Error creating future session:', err);
      
      let errorMessage = err.message;
      if (err.code === 'PGRST301' || err.code === '42501') {
        errorMessage = 'אין לך הרשאות מתאימות לביצוע פעולה זו';
      } else if (err.code === 'PGRST401') {
        errorMessage = 'יש צורך בהתחברות מחדש למערכת';
      }
      
      setError(`שגיאה ביצירת הפגישה: ${errorMessage}`);
      
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: `לא ניתן היה להוסיף את הפגישה: ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient: Patient) => {
    console.log(`MEETING_SAVE_DEBUG: Patient selected:`, patient);
    setSelectedPatient(patient);
    form.setValue('patient_id', patient.id);
    form.setValue('patient_name', patient.name);
  };

  // Handle manual patient search
  const handleSearchPatient = async () => {
    const patientName = form.getValues('patient_name');
    if (!patientName) return;
    
    console.log(`MEETING_SAVE_DEBUG: Manually searching for patient: "${patientName}"`);
    
    const results = await searchPatientByName(patientName);
    setSearchResults(results);
    
    if (results.length === 0) {
      setError(`לא נמצא מטופל עם השם "${patientName}"`);
    } else {
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת פגישה לטבלת פגישות עתידיות</DialogTitle>
          <DialogDescription>
            יצירת רשומה חדשה בטבלת פגישות עתידיות עבור פגישה מיומן גוגל
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>שגיאה</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Patient Search */}
            <FormField
              control={form.control}
              name="patient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם מטופל</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="חיפוש מטופל לפי שם" 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSearchPatient}
                      disabled={isLoading || isSearching}
                    >
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'חפש'}
                    </Button>
                  </div>
                  <FormMessage />
                  
                  {/* Search results */}
                  {searchResults.length > 0 && !selectedPatient && (
                    <div className="mt-2 border rounded-md p-2 bg-gray-50">
                      <p className="text-xs mb-1">תוצאות חיפוש:</p>
                      <div className="flex flex-col gap-1">
                        {searchResults.map((patient) => (
                          <Button
                            key={patient.id}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={() => handlePatientSelect(patient)}
                          >
                            {patient.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected patient */}
                  {selectedPatient && (
                    <div className="mt-2 border rounded-md p-2 bg-gray-50 flex justify-between items-center">
                      <span className="text-sm font-medium">{selectedPatient.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(null);
                          form.setValue('patient_id', undefined as any);
                        }}
                      >
                        שנה
                      </Button>
                    </div>
                  )}
                </FormItem>
              )}
            />
            
            {/* Hidden field for patient ID */}
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input type="hidden" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Session Date */}
            <FormField
              control={form.control}
              name="session_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תאריך ושעה</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    תאריך ושעת הפגישה
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Meeting Type */}
            <FormField
              control={form.control}
              name="meeting_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג פגישה</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סוג פגישה" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Phone">טלפון</SelectItem>
                      <SelectItem value="Zoom">זום</SelectItem>
                      <SelectItem value="In-Person">פרונטלי</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סטטוס</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סטטוס" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Scheduled">מתוכנן</SelectItem>
                      <SelectItem value="Completed">הושלם</SelectItem>
                      <SelectItem value="Cancelled">בוטל</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Zoom Link - only show if meeting type is Zoom */}
            {form.watch('meeting_type') === 'Zoom' && (
              <FormField
                control={form.control}
                name="zoom_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>קישור לזום</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="הזן קישור לפגישת Zoom" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="הערות נוספות לגבי הפגישה" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex flex-row-reverse gap-2 mt-4">
              <Button type="submit" disabled={isLoading || !selectedPatient}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    שומר...
                  </>
                ) : 'שמור פגישה'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                ביטול
              </Button>
              <div className="text-xs text-gray-400 ml-auto">v{COMPONENT_VERSION}</div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMeetingToFutureSessionsDialog;
