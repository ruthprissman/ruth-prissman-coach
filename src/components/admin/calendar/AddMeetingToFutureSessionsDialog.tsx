
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
import { AlertCircle, Loader2, Plus, Search, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DatabaseService } from '@/services/DatabaseService';
import AddPatientDialog from '@/components/admin/AddPatientDialog';
import { useNavigate } from 'react-router-dom';

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
const COMPONENT_VERSION = "1.2.0";

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
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState<boolean>(false);
  const [noResultsFound, setNoResultsFound] = useState<boolean>(false);
  const dbService = new DatabaseService();
  const navigate = useNavigate();

  // התחלת לוגים ייחודית לדיאלוג זה
  const logPrefix = 'PATIENT_SEARCH_DEBUG';
  console.log(`${logPrefix}: Component loaded, version ${COMPONENT_VERSION}`);
  
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
    
    const extractedName = notes.replace('פגישה עם', '').trim();
    console.log(`${logPrefix}: Extracted client name: "${extractedName}" from notes: "${notes}"`);
    return extractedName;
  };

  // Search for patient by name
  const searchPatientByName = async (name: string) => {
    if (!name || name.trim().length === 0) {
      console.log(`${logPrefix}: Empty search name, skipping search`);
      return [];
    }
    
    console.log(`${logPrefix}: Searching for patient with name: "${name}"`);
    setIsSearching(true);
    setError(null);
    setNoResultsFound(false);
    
    try {
      const supabase = await supabaseClient();
      
      console.log(`${logPrefix}: Supabase client initialized for patient search`);
      
      // שיפור החיפוש - חיפוש בצורה גמישה יותר עבור שמות בעברית
      const { data, error, status } = await supabase
        .from('patients')
        .select('id, name, phone, email, notes, session_price')
        .ilike('name', `%${name}%`)
        .order('name', { ascending: true })
        .limit(10);
        
      console.log(`${logPrefix}: Patient search completed, status: ${status}, found ${data?.length || 0} results`);
      
      if (error) {
        console.error(`${logPrefix}: Error in patient search:`, error);
        throw error;
      }
      
      // יותר מידע על התוצאות שנמצאו
      if (data && data.length > 0) {
        console.log(`${logPrefix}: Search results for "${name}":`);
        data.forEach((patient, index) => {
          console.log(`${logPrefix}: Result ${index + 1}: id=${patient.id}, name="${patient.name}"`);
        });
      } else {
        console.log(`${logPrefix}: No results found for "${name}"`);
        setNoResultsFound(true);
      }
      
      // Ensure the data matches the Patient interface
      return data as Patient[];
    } catch (err: any) {
      console.error(`${logPrefix}: Error searching for patient:`, err.message);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  // Reset form when meeting data changes
  useEffect(() => {
    if (meetingData && open) {
      console.log(`${logPrefix}: Setting form data from meetingData:`, meetingData);
      
      // Extract meeting date and time
      const meetingDate = meetingData.date;
      const meetingTime = meetingData.exactStartTime || meetingData.hour;
      
      // Format the session date
      const formattedSessionDate = `${meetingDate}T${meetingTime}:00`;
      console.log(`${logPrefix}: Formatted session date: ${formattedSessionDate}`);
      
      // Extract client name from notes
      const clientName = extractClientName(meetingData.notes);
      console.log(`${logPrefix}: Extracted client name: "${clientName}"`);
      
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
      
      // ניקוי מצב קודם
      setSearchResults([]);
      setSelectedPatient(null);
      setError(null);
      setNoResultsFound(false);
      
      // Search for patient if name is available
      if (clientName && clientName.trim().length > 0) {
        console.log(`${logPrefix}: Initiating search for client: "${clientName}"`);
        searchPatientByName(clientName).then(results => {
          setSearchResults(results);
          
          // If we have exactly one result, select it automatically
          if (results.length === 1) {
            setSelectedPatient(results[0]);
            form.setValue('patient_id', results[0].id);
            console.log(`${logPrefix}: Automatically selected patient:`, results[0]);
          } else if (results.length === 0) {
            console.log(`${logPrefix}: No patients found with name "${clientName}"`);
            setError(`לא נמצא מטופל עם השם "${clientName}"`);
            setNoResultsFound(true);
          } else {
            console.log(`${logPrefix}: Multiple patients found (${results.length}), waiting for user selection`);
          }
        });
      } else {
        console.log(`${logPrefix}: No client name available to search for`);
      }
    } else {
      // ניקוי בעת סגירת החלון
      if (!open) {
        console.log(`${logPrefix}: Dialog closing, resetting state`);
        setSearchResults([]);
        setSelectedPatient(null);
        setError(null);
        setNoResultsFound(false);
      }
    }
  }, [meetingData, open, form]);

  // Check authentication status
  const checkAuthentication = async () => {
    console.log(`${logPrefix}: Checking authentication status`);
    try {
      const supabase = await supabaseClient();
      const { data: session, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error(`${logPrefix}: Auth error:`, error);
        return false;
      }
      
      const hasSession = !!session && !!session.session;
      console.log(`${logPrefix}: User has active session: ${hasSession ? 'Yes' : 'No'}`);
      
      if (hasSession) {
        const { data: user } = await supabase.auth.getUser();
        console.log(`${logPrefix}: Current user:`, user?.user?.email);
      }
      
      return hasSession;
    } catch (err) {
      console.error(`${logPrefix}: Error checking auth:`, err);
      return false;
    }
  };

  const onSubmit = async (values: FormValues) => {
    console.log(`${logPrefix}: Form submitted with values:`, values);
    setIsLoading(true);
    setError(null);
    
    try {
      if (!values.patient_id) {
        console.error(`${logPrefix}: Missing patient_id in form submission`);
        throw new Error("יש לבחור מטופל תחילה");
      }
      
      // Check authentication before proceeding
      const isAuthenticated = await checkAuthentication();
      console.log(`${logPrefix}: Authentication check result: ${isAuthenticated}`);
      
      if (!isAuthenticated) {
        console.error(`${logPrefix}: User not authenticated`);
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
      
      console.log(`${logPrefix}: Attempting to create future session with data:`, sessionData);
      
      // Direct insertion using Supabase client for comparison
      const supabase = await supabaseClient();
      console.log(`${logPrefix}: Initialized direct Supabase client for insertion test`);
      
      const { data: directData, error: directError } = await supabase
        .from('future_sessions')
        .insert({
          ...sessionData,
          created_at: new Date().toISOString()
        })
        .select();
      
      console.log(`${logPrefix}: Direct insertion result:`, { data: directData, error: directError });
      
      if (directError) {
        console.error(`${logPrefix}: Direct insertion failed:`, directError);
        throw directError;
      }
      
      console.log(`${logPrefix}: Direct insertion succeeded:`, directData);
      
      toast({
        title: "נוספה פגישה חדשה",
        description: `פגישה עבור ${selectedPatient?.name || 'מטופל'} נוספה בהצלחה ליומן`,
      });
      
      // Close dialog and refresh data
      onOpenChange(false);
      
      // Only call onCreated if the insert was successful
      if (onCreated) {
        console.log(`${logPrefix}: Calling onCreated callback`);
        onCreated();
      }
      
    } catch (err: any) {
      console.error(`${logPrefix}: Error creating future session:`, err);
      
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
    console.log(`${logPrefix}: Patient selected:`, patient);
    setSelectedPatient(patient);
    form.setValue('patient_id', patient.id);
    form.setValue('patient_name', patient.name);
    setSearchResults([]); // Clear search results after selection
  };

  // Handle manual patient search
  const handleSearchPatient = async () => {
    const patientName = form.getValues('patient_name');
    if (!patientName || patientName.trim().length === 0) {
      console.log(`${logPrefix}: Empty search string, showing warning`);
      setError("יש להזין שם לחיפוש");
      return;
    }
    
    console.log(`${logPrefix}: Manually searching for patient: "${patientName}"`);
    
    const results = await searchPatientByName(patientName);
    setSearchResults(results);
    
    if (results.length === 0) {
      console.log(`${logPrefix}: No results found for "${patientName}"`);
      setError(`לא נמצא מטופל עם השם "${patientName}"`);
      setNoResultsFound(true);
    } else {
      setError(null);
      setNoResultsFound(false);
      console.log(`${logPrefix}: Found ${results.length} results for "${patientName}"`);
    }
  };

  // הוספת פונקציה להוספת לקוחה חדשה
  const handleAddNewPatient = async (patient: Omit<Patient, 'id'>): Promise<boolean> => {
    console.log(`${logPrefix}: Adding new patient:`, patient);
    try {
      const supabase = await supabaseClient();
      
      const { data, error } = await supabase
        .from('patients')
        .insert(patient)
        .select();
      
      if (error) {
        console.error(`${logPrefix}: Error adding new patient:`, error);
        throw error;
      }
      
      console.log(`${logPrefix}: New patient added successfully:`, data);
      
      if (data && data.length > 0) {
        const newPatient = data[0] as Patient;
        
        // עדכון הטופס עם הלקוח החדש
        setSelectedPatient(newPatient);
        form.setValue('patient_id', newPatient.id);
        form.setValue('patient_name', newPatient.name);
        
        toast({
          title: "לקוח חדש נוסף",
          description: `${newPatient.name} נוסף בהצלחה למערכת`,
        });
        
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error(`${logPrefix}: Error in handleAddNewPatient:`, err);
      
      toast({
        variant: "destructive", 
        title: "שגיאה",
        description: `הוספת הלקוח נכשלה: ${err.message}`,
      });
      
      return false;
    }
  };

  // פונקציה לניווט לדף הלקוחות
  const navigateToPatientsPage = () => {
    console.log(`${logPrefix}: Navigating to patients page`);
    
    // שמירת הנתונים מהטופס אם צריך
    const formData = form.getValues();
    
    // ניווט לדף הלקוחות
    navigate('/admin/patients');
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchPatient();
                          }
                        }}
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSearchPatient}
                      disabled={isLoading || isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                  
                  {/* Search results */}
                  {searchResults.length > 0 && !selectedPatient && (
                    <div className="mt-2 border rounded-md p-2 bg-gray-50">
                      <p className="text-xs mb-1">תוצאות חיפוש:</p>
                      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                        {searchResults.map((patient) => (
                          <Button
                            key={patient.id}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start overflow-hidden"
                            onClick={() => handlePatientSelect(patient)}
                          >
                            <span className="truncate">{patient.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* No results found - הוספת אפשרויות להוספת לקוח חדש */}
                  {noResultsFound && !selectedPatient && (
                    <div className="mt-2 border rounded-md p-2 bg-gray-50">
                      <p className="text-sm mb-2">לא נמצאו לקוחות מתאימים.</p>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => setAddPatientDialogOpen(true)}
                        >
                          <UserPlus className="h-3 w-3" />
                          <span>הוסף לקוח חדש</span>
                        </Button>
                        
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={navigateToPatientsPage}
                        >
                          <span>למסך ניהול לקוחות</span>
                        </Button>
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
              <Button 
                type="submit" 
                disabled={isLoading || !selectedPatient}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    שומר...
                  </>
                ) : 'שמור פגישה'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isLoading}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                ביטול
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 flex gap-1 items-center mr-auto"
                onClick={() => setAddPatientDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                <span>הוסף לקוח חדש</span>
              </Button>
              <div className="text-xs text-gray-400 hidden">v{COMPONENT_VERSION}</div>
            </DialogFooter>
          </form>
        </Form>

        {/* Dialog for adding a new patient */}
        <AddPatientDialog
          isOpen={addPatientDialogOpen}
          onClose={() => setAddPatientDialogOpen(false)}
          onAddPatient={handleAddNewPatient}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddMeetingToFutureSessionsDialog;
