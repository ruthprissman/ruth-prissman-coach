
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  Patient, 
  Session
} from '@/types/patient';
import { FutureSession } from '@/types/session';
import { Calendar, CalendarDays, Calculator, Clock, Edit, MoreVertical, Plus, Trash, Trash2 } from 'lucide-react';
import ClientStatisticsCard from '@/components/admin/ClientStatisticsCard';
import SessionsList from '@/components/admin/sessions/SessionsList';
import PatientSessionFilters from '@/components/admin/sessions/PatientSessionFilters';
import SessionEditDialog from '@/components/admin/SessionEditDialog';
import { formatDateInIsraelTimeZone } from '@/utils/dateUtils';
import DeleteSessionDialog from '@/components/admin/sessions/DeleteSessionDialog';
import NewHistoricalSessionDialog from '@/components/admin/sessions/NewHistoricalSessionDialog';
import ConvertSessionDialog from '@/components/admin/sessions/ConvertSessionDialog';
import NewFutureSessionDialog from '@/components/admin/sessions/NewFutureSessionDialog';
import EditFutureSessionDialog from '@/components/admin/sessions/EditFutureSessionDialog';
import DeleteFutureSessionDialog from '@/components/admin/sessions/DeleteFutureSessionDialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Empty client object for initialization
const emptyClient: Patient = {
  id: 0,
  name: '',
  email: '',
  phone: '',
  address: '',
  date_of_birth: null,
  gender: null,
  occupation: null,
  referral_source: null,
  status: 'Active',
  financial_status: 'No Debts',
  emergency_contact: null,
  emergency_phone: null,
  last_session_date: null,
  notes: null,
  session_price: 0,
  previous_therapy: null,
  reason_for_therapy: null,
  allergies: null,
  medications: null,
  medical_history: null,
  family_status: null,
  children: null,
};

// Client validation schema
const clientSchema = z.object({
  name: z.string().min(2, { message: "שם הלקוח חייב להכיל לפחות 2 תווים" }),
  email: z.string().email({ message: "אימייל לא תקין" }).or(z.literal('')),
  phone: z.string().min(9, { message: "מספר טלפון חייב להכיל לפחות 9 ספרות" }),
  session_price: z.coerce.number().min(0, { message: "מחיר חייב להיות חיובי" }),
  address: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  referral_source: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  emergency_phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string(),
  previous_therapy: z.string().optional().nullable(),
  reason_for_therapy: z.string().optional().nullable(),
  medical_history: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  family_status: z.string().optional().nullable(),
  children: z.string().optional().nullable(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientId = parseInt(id || '0');
  
  const [client, setClient] = useState<Patient>(emptyClient);
  const [originalClient, setOriginalClient] = useState<Patient>(emptyClient);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [futureSessions, setFutureSessions] = useState<FutureSession[]>([]);
  const [stats, setStats] = useState<{
    sessionsCount: number;
    completedPayments: number;
    pendingPayments: number;
    averageSessionLength: number;
  }>({
    sessionsCount: 0,
    completedPayments: 0,
    pendingPayments: 0,
    averageSessionLength: 60,
  });
  
  // Dialog/Sheet states
  const [editMode, setEditMode] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showSessionEditDialog, setShowSessionEditDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [futureSessionToConvert, setFutureSessionToConvert] = useState<FutureSession | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showNewFutureSessionDialog, setShowNewFutureSessionDialog] = useState(false);
  const [futureSessionToEdit, setFutureSessionToEdit] = useState<FutureSession | null>(null);
  const [showEditFutureSessionDialog, setShowEditFutureSessionDialog] = useState(false);
  const [futureSessionToDelete, setFutureSessionToDelete] = useState<FutureSession | null>(null);
  const [showDeleteFutureSessionDialog, setShowDeleteFutureSessionDialog] = useState(false);
  const [futureSessionToMove, setFutureSessionToMove] = useState<FutureSession | null>(null);
  const [showMoveToHistoryDialog, setShowMoveToHistoryDialog] = useState(false);
  
  // Filter states
  const [sessionFilters, setSessionFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    dateSortOrder: 'desc',
  });

  // Form setup
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      session_price: 0,
      address: '',
      gender: '',
      date_of_birth: '',
      occupation: '',
      referral_source: '',
      emergency_contact: '',
      emergency_phone: '',
      notes: '',
      status: 'Active',
      previous_therapy: '',
      reason_for_therapy: '',
      medical_history: '',
      allergies: '',
      medications: '',
      family_status: '',
      children: '',
    }
  });
  
  // Fetch client data
  const fetchClientData = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', clientId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setClient(data);
        setOriginalClient(data);
        
        // Reset form with client data
        form.reset({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          session_price: data.session_price || 0,
          address: data.address || '',
          gender: data.gender || '',
          date_of_birth: data.date_of_birth || '',
          occupation: data.occupation || '',
          referral_source: data.referral_source || '',
          emergency_contact: data.emergency_contact || '',
          emergency_phone: data.emergency_phone || '',
          notes: data.notes || '',
          status: data.status || 'Active',
          previous_therapy: data.previous_therapy || '',
          reason_for_therapy: data.reason_for_therapy || '',
          medical_history: data.medical_history || '',
          allergies: data.allergies || '',
          medications: data.medications || '',
          family_status: data.family_status || '',
          children: data.children || '',
        });
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('שגיאה בטעינת פרטי לקוח');
    }
  }, [clientId, form]);
  
  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', clientId)
        .order('session_date', { ascending: false });
        
      if (error) throw error;
      
      setSessions(data || []);
      setFilteredSessions(data || []);
      
      // Calculate statistics
      if (data) {
        const completedPayments = data.filter(s => s.payment_status === 'paid').length;
        const pendingPayments = data.filter(s => s.payment_status !== 'paid').length;
        const totalSessions = data.length;
        
        setStats({
          sessionsCount: totalSessions,
          completedPayments,
          pendingPayments,
          averageSessionLength: 60, // Default value, could be calculated from data
        });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('שגיאה בטעינת פגישות');
    }
  }, [clientId]);
  
  // Fetch future sessions
  const fetchFutureSessions = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('future_sessions')
        .select('*')
        .eq('patient_id', clientId)
        .order('session_date', { ascending: true });
        
      if (error) throw error;
      
      setFutureSessions(data || []);
    } catch (error) {
      console.error('Error fetching future sessions:', error);
      toast.error('שגיאה בטעינת פגישות עתידיות');
    }
  }, [clientId]);
  
  // Apply filters to sessions
  const applyFilters = useCallback(() => {
    let filtered = [...sessions];
    
    // Apply payment status filter
    if (sessionFilters.paymentStatus !== 'all') {
      filtered = filtered.filter(s => s.payment_status === sessionFilters.paymentStatus);
    }
    
    // Apply sort order
    filtered.sort((a, b) => {
      const dateA = new Date(a.session_date).getTime();
      const dateB = new Date(b.session_date).getTime();
      return sessionFilters.dateSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredSessions(filtered);
  }, [sessions, sessionFilters]);
  
  // Load data on initial render and when client ID changes
  useEffect(() => {
    fetchClientData();
    fetchSessions();
    fetchFutureSessions();
  }, [clientId, fetchClientData, fetchSessions, fetchFutureSessions]);
  
  // Apply filters when filter settings or sessions change
  useEffect(() => {
    applyFilters();
  }, [sessions, sessionFilters, applyFilters]);

  // Handle client edit form submission
  const handleFormSubmit = async (data: ClientFormValues) => {
    if (!clientId) return;
    
    setSavingChanges(true);
    
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          session_price: data.session_price,
          address: data.address || null,
          gender: data.gender || null,
          date_of_birth: data.date_of_birth || null,
          occupation: data.occupation || null,
          referral_source: data.referral_source || null,
          emergency_contact: data.emergency_contact || null,
          emergency_phone: data.emergency_phone || null,
          notes: data.notes || null,
          status: data.status,
          previous_therapy: data.previous_therapy || null,
          reason_for_therapy: data.reason_for_therapy || null,
          medical_history: data.medical_history || null,
          allergies: data.allergies || null,
          medications: data.medications || null,
          family_status: data.family_status || null,
          children: data.children || null,
        })
        .eq('id', clientId);
        
      if (error) throw error;
      
      toast.success('פרטי הלקוח עודכנו בהצלחה');
      setEditMode(false);
      fetchClientData();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('שגיאה בעדכון פרטי לקוח');
    } finally {
      setSavingChanges(false);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    form.reset({
      name: originalClient.name || '',
      email: originalClient.email || '',
      phone: originalClient.phone || '',
      session_price: originalClient.session_price || 0,
      address: originalClient.address || '',
      gender: originalClient.gender || '',
      date_of_birth: originalClient.date_of_birth || '',
      occupation: originalClient.occupation || '',
      referral_source: originalClient.referral_source || '',
      emergency_contact: originalClient.emergency_contact || '',
      emergency_phone: originalClient.emergency_phone || '',
      notes: originalClient.notes || '',
      status: originalClient.status || 'Active',
      previous_therapy: originalClient.previous_therapy || '',
      reason_for_therapy: originalClient.reason_for_therapy || '',
      medical_history: originalClient.medical_history || '',
      allergies: originalClient.allergies || '',
      medications: originalClient.medications || '',
      family_status: originalClient.family_status || '',
      children: originalClient.children || '',
    });
    setEditMode(false);
  };
  
  // Handle session edit
  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setShowSessionEditDialog(true);
  };
  
  // Handle session update
  const handleSessionUpdate = async () => {
    await fetchSessions();
    setShowSessionEditDialog(false);
    setEditingSession(null);
    toast.success('הפגישה עודכנה בהצלחה');
  };
  
  // Handle session delete
  const handleDeleteSession = (session: Session) => {
    setSessionToDelete(session);
    setShowDeleteDialog(true);
  };
  
  // Confirm session delete
  const handleConfirmDeleteSession = async () => {
    try {
      if (!sessionToDelete) return;
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionToDelete.id);
        
      if (error) throw error;
      
      toast.success('הפגישה נמחקה בהצלחה');
      await fetchSessions();
      setShowDeleteDialog(false);
      setSessionToDelete(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('שגיאה במחיקת פגישה');
    }
  };
  
  // Handle future session conversion
  const handleConvertFutureSession = (session: FutureSession) => {
    setFutureSessionToConvert(session);
    setShowConvertDialog(true);
  };
  
  // Handle session converted
  const handleSessionConverted = async () => {
    await fetchSessions();
    await fetchFutureSessions();
    setShowConvertDialog(false);
    setFutureSessionToConvert(null);
    toast.success('הפגישה הומרה והועברה להיסטוריה בהצלחה');
  };
  
  // Handle future session edit
  const handleEditFutureSession = (session: FutureSession) => {
    setFutureSessionToEdit(session);
    setShowEditFutureSessionDialog(true);
  };
  
  // Handle future session update
  const handleFutureSessionUpdated = async () => {
    await fetchFutureSessions();
    setShowEditFutureSessionDialog(false);
    setFutureSessionToEdit(null);
    toast.success('הפגישה העתידית עודכנה בהצלחה');
  };
  
  // Handle future session delete
  const handleDeleteFutureSession = (session: FutureSession) => {
    setFutureSessionToDelete(session);
    setShowDeleteFutureSessionDialog(true);
  };
  
  // Confirm future session delete
  const handleConfirmDeleteFutureSession = async () => {
    try {
      if (!futureSessionToDelete) return;
      
      const { error } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', futureSessionToDelete.id);
        
      if (error) throw error;
      
      toast.success('הפגישה העתידית נמחקה בהצלחה');
      await fetchFutureSessions();
      setShowDeleteFutureSessionDialog(false);
      setFutureSessionToDelete(null);
    } catch (error) {
      console.error('Error deleting future session:', error);
      toast.error('שגיאה במחיקת פגישה עתידית');
    }
  };
  
  // Handle future session move to history
  const handleMoveToHistory = (session: FutureSession) => {
    setFutureSessionToMove(session);
    setShowMoveToHistoryDialog(true);
  };
  
  // Handle after move to history
  const handleAfterMoveToHistory = async () => {
    try {
      if (!futureSessionToMove) return;
      
      // Delete the future session after it has been moved to history
      const { error } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', futureSessionToMove.id);
        
      if (error) throw error;
      
      await fetchSessions();
      await fetchFutureSessions();
      setShowMoveToHistoryDialog(false);
      setFutureSessionToMove(null);
      toast.success('הפגישה הועברה בהצלחה להיסטוריה');
    } catch (error) {
      console.error('Error during move operation:', error);
      toast.error('שגיאה בפעולת ההעברה');
    }
  };
  
  // Create new session
  const handleSessionCreated = async () => {
    await fetchSessions();
    setShowNewSessionDialog(false);
    toast.success('פגישה חדשה נוצרה בהצלחה');
  };
  
  // Create new future session
  const handleFutureSessionCreated = async () => {
    await fetchFutureSessions();
    setShowNewFutureSessionDialog(false);
    toast.success('פגישה עתידית חדשה נוצרה בהצלחה');
  };
  
  // Handle filter change
  const handleFilterChange = (filters: {
    status?: string;
    paymentStatus?: string;
    dateSortOrder?: string;
  }) => {
    setSessionFilters(prevState => ({
      ...prevState,
      ...filters,
    }));
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return formatDateInIsraelTimeZone(dateString, 'dd/MM/yyyy HH:mm');
  };

  return (
    <AdminLayout title="פרטי לקוח">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">פרטי לקוח</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/patients')}
          >
            חזרה לרשימת הלקוחות
          </Button>
          {!editMode ? (
            <Button onClick={() => setEditMode(true)}>
              <Edit className="h-4 w-4 mr-2" />
              ערוך פרטים
            </Button>
          ) : null}
        </div>
      </div>

      {editMode ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>עריכת פרטי לקוח</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>שם מלא *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
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
                        <FormLabel>טלפון *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>כתובת</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
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
                        <FormLabel>מחיר פגישה (₪) *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תאריך לידה</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date" 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מגדר</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                            value={field.value || ''}
                          >
                            <option value="">בחר מגדר</option>
                            <option value="male">זכר</option>
                            <option value="female">נקבה</option>
                            <option value="other">אחר</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>עיסוק</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סטטוס לקוח</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="Active">פעיל</option>
                            <option value="Inactive">לא פעיל</option>
                            <option value="Suspended">מושהה</option>
                            <option value="Completed">סיים טיפול</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergency_contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>איש קשר לחירום</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergency_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>טלפון לחירום</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="previous_therapy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>טיפולים קודמים</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''} 
                            className="min-h-[80px]" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reason_for_therapy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סיבה לפנייה לטיפול</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''} 
                            className="min-h-[80px]" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referral_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>איך הגיע אלינו</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="family_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מצב משפחתי</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="children"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ילדים</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator className="my-6" />
                
                <div className="grid md:grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="medical_history"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>היסטוריה רפואית</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''} 
                            className="min-h-[80px]" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>אלרגיות</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תרופות</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''} 
                            className="min-h-[80px]" 
                          />
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
                        <FormLabel>הערות כלליות</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''} 
                            className="min-h-[100px]" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleFormCancel}
                  >
                    ביטול
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={savingChanges}
                  >
                    {savingChanges ? 'שומר שינויים...' : 'שמור שינויים'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">פרטי קשר</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">שם: </span>
                  <span>{client.name}</span>
                </div>
                <div>
                  <span className="font-medium">טלפון: </span>
                  <span dir="ltr" className="text-left inline-block">{client.phone}</span>
                </div>
                <div>
                  <span className="font-medium">אימייל: </span>
                  <span dir="ltr" className="text-left inline-block">{client.email}</span>
                </div>
                <div>
                  <span className="font-medium">כתובת: </span>
                  <span>{client.address || 'לא צוין'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">מידע אישי</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">תאריך לידה: </span>
                  <span>
                    {client.date_of_birth 
                      ? formatDateInIsraelTimeZone(client.date_of_birth, 'dd/MM/yyyy') 
                      : 'לא צוין'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">מגדר: </span>
                  <span>
                    {client.gender === 'male' ? 'זכר' : 
                     client.gender === 'female' ? 'נקבה' : 
                     client.gender === 'other' ? 'אחר' : 'לא צוין'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">עיסוק: </span>
                  <span>{client.occupation || 'לא צוין'}</span>
                </div>
                <div>
                  <span className="font-medium">מחיר פגישה: </span>
                  <span>{client.session_price || 0} ₪</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">מידע נוסף</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">סטטוס: </span>
                  <span>{
                    client.status === 'Active' ? 'פעיל' :
                    client.status === 'Inactive' ? 'לא פעיל' :
                    client.status === 'Suspended' ? 'מושהה' :
                    client.status === 'Completed' ? 'סיים טיפול' :
                    client.status
                  }</span>
                </div>
                <div>
                  <span className="font-medium">סטטוס כספי: </span>
                  <span>{
                    client.financial_status === 'No Debts' ? 'ללא חובות' :
                    client.financial_status === 'Has Outstanding Payments' ? 'יש תשלומים פתוחים' :
                    client.financial_status
                  }</span>
                </div>
                <div>
                  <span className="font-medium">איך הגיע אלינו: </span>
                  <span>{client.referral_source || 'לא צוין'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {!editMode && (
        <div className="mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            <ClientStatisticsCard
              label="מספר פגישות"
              value={stats.sessionsCount}
              description="סך כל הפגישות"
              icon={<Calendar className="h-8 w-8 text-blue-500" />}
            />
            <ClientStatisticsCard
              label="תשלומים שבוצעו"
              value={stats.completedPayments}
              description="מתוך סך כל הפגישות"
              icon={<Calculator className="h-8 w-8 text-green-500" />}
            />
            <ClientStatisticsCard
              label="ממתינים לתשלום"
              value={stats.pendingPayments}
              description="מספר פגישות שלא שולמו"
              icon={<Clock className="h-8 w-8 text-amber-500" />}
            />
          </div>
        </div>
      )}
      
      {!editMode && (
        <Tabs defaultValue="history" className="my-6">
          <TabsList className="mb-4">
            <TabsTrigger value="history">היסטוריית פגישות</TabsTrigger>
            <TabsTrigger value="future">פגישות עתידיות</TabsTrigger>
            <TabsTrigger value="notes">הערות ומידע רפואי</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle>פגישות</CardTitle>
                <Button onClick={() => setShowNewSessionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  פגישה חדשה
                </Button>
              </CardHeader>
              <CardContent>
                {/* Note: We're manually passing props to PatientSessionFilters since it seems to have different props than SessionFilters */}
                <div className="mt-4">
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="paymentStatus" className="ml-2">סטטוס תשלום</Label>
                      <select
                        id="paymentStatus"
                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={sessionFilters.paymentStatus}
                        onChange={(e) => handleFilterChange({ paymentStatus: e.target.value })}
                      >
                        <option value="all">הכל</option>
                        <option value="paid">שולם</option>
                        <option value="partially_paid">שולם חלקי</option>
                        <option value="unpaid">לא שולם</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="dateSortOrder" className="ml-2">מיון לפי תאריך</Label>
                      <select
                        id="dateSortOrder"
                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={sessionFilters.dateSortOrder}
                        onChange={(e) => handleFilterChange({ dateSortOrder: e.target.value })}
                      >
                        <option value="desc">מהחדש לישן</option>
                        <option value="asc">מהישן לחדש</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  {filteredSessions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>תאריך</TableHead>
                          <TableHead>סוג פגישה</TableHead>
                          <TableHead>סכום ששולם</TableHead>
                          <TableHead>סטטוס תשלום</TableHead>
                          <TableHead className="text-right">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{formatDate(session.session_date)}</TableCell>
                            <TableCell>
                              {session.meeting_type === 'Zoom' ? 'זום' : 
                               session.meeting_type === 'Phone' ? 'טלפון' : 
                               session.meeting_type === 'In-Person' ? 'פרונטלית' : 
                               session.meeting_type}
                            </TableCell>
                            <TableCell>{session.paid_amount || 0} ₪</TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${session.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                                  session.payment_status === 'partially_paid' ? 'bg-amber-100 text-amber-800' : 
                                  'bg-red-100 text-red-800'}`}
                              >
                                {session.payment_status === 'paid' ? 'שולם' : 
                                 session.payment_status === 'partially_paid' ? 'שולם חלקית' : 
                                 'ממתין לתשלום'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditSession(session)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    ערוך פגישה
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteSession(session)}>
                                    <Trash className="h-4 w-4 mr-2" />
                                    מחק פגישה
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">אין פגישות להצגה</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="future">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle>פגישות עתידיות</CardTitle>
                <Button onClick={() => setShowNewFutureSessionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  פגישה עתידית חדשה
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  {futureSessions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>תאריך</TableHead>
                          <TableHead>סוג פגישה</TableHead>
                          <TableHead>סטטוס</TableHead>
                          <TableHead className="text-right">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {futureSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{formatDate(session.session_date)}</TableCell>
                            <TableCell>
                              {session.meeting_type === 'Zoom' ? 'זום' : 
                               session.meeting_type === 'Phone' ? 'טלפון' : 
                               session.meeting_type === 'In-Person' ? 'פרונטלית' : 
                               session.meeting_type}
                            </TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${session.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 
                                  session.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                  session.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800'}`}
                              >
                                {session.status === 'Scheduled' ? 'מתוכנן' : 
                                 session.status === 'Completed' ? 'הושלם' : 
                                 session.status === 'Cancelled' ? 'בוטל' : 
                                 session.status}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditFutureSession(session)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    ערוך פגישה
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMoveToHistory(session)}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    העבר להיסטוריה
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleConvertFutureSession(session)}>
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    המר לפגישה שהושלמה
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteFutureSession(session)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    מחק פגישה
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">אין פגישות עתידיות להצגה</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">הערות</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <p className="text-sm">{client.notes || 'אין הערות להצגה'}</p>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">מידע רפואי</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">היסטוריה רפואית:</h3>
                      <p className="text-sm">{client.medical_history || 'לא צוין'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">אלרגיות:</h3>
                      <p className="text-sm">{client.allergies || 'לא צוין'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">תרופות:</h3>
                      <p className="text-sm">{client.medications || 'לא צוין'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">מידע טיפולי</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">טיפולים קודמים:</h3>
                      <p className="text-sm">{client.previous_therapy || 'לא צוין'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">סיבה לפנייה לטיפול:</h3>
                      <p className="text-sm">{client.reason_for_therapy || 'לא צוין'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">פרטים אישיים</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">מצב משפחתי:</h3>
                      <p className="text-sm">{client.family_status || 'לא צוין'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">ילדים:</h3>
                      <p className="text-sm">{client.children || 'לא צוין'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">איש קשר לחירום:</h3>
                      <p className="text-sm">{client.emergency_contact || 'לא צוין'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">טלפון לחירום:</h3>
                      <p dir="ltr" className="text-sm text-left">{client.emergency_phone || 'לא צוין'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Dialogs and Modals */}
      {editingSession && (
        <SessionEditDialog
          session={editingSession}
          onUpdated={handleSessionUpdate}
        />
      )}
      
      <DeleteSessionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        session={sessionToDelete}
        onConfirm={handleConfirmDeleteSession}
        formatDate={formatDate}
      />
      
      {futureSessionToConvert && (
        <ConvertSessionDialog
          open={showConvertDialog}
          onOpenChange={setShowConvertDialog}
          session={futureSessionToConvert}
          patientId={clientId}
          onConverted={handleSessionConverted}
        />
      )}
      
      <NewFutureSessionDialog
        open={showNewFutureSessionDialog}
        onOpenChange={setShowNewFutureSessionDialog}
        patientId={clientId}
        patientName={client.name}
        onCreated={handleFutureSessionCreated}
      />
      
      <NewHistoricalSessionDialog
        open={showNewSessionDialog}
        onOpenChange={setShowNewSessionDialog}
        patientId={clientId}
        patient={client}
        onCreated={handleSessionCreated}
      />
      
      {futureSessionToMove && (
        <NewHistoricalSessionDialog
          open={showMoveToHistoryDialog}
          onOpenChange={setShowMoveToHistoryDialog}
          patientId={clientId}
          patient={client}
          onCreated={handleAfterMoveToHistory}
          fromFutureSession={futureSessionToMove}
        />
      )}
      
      {futureSessionToEdit && (
        <EditFutureSessionDialog
          open={showEditFutureSessionDialog}
          onOpenChange={setShowEditFutureSessionDialog}
          session={futureSessionToEdit}
          onUpdated={handleFutureSessionUpdated}
        />
      )}
      
      <DeleteFutureSessionDialog
        open={showDeleteFutureSessionDialog}
        onOpenChange={setShowDeleteFutureSessionDialog}
        session={futureSessionToDelete}
        onConfirm={handleConfirmDeleteFutureSession}
      />
    </AdminLayout>
  );
};

export default ClientDetails;
