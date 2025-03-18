import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus, Repeat, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Patient, Session } from '@/types/patient';
import { FutureSession } from '@/types/session';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { formatDateInIsraelTimeZone, formatDateTimeInIsrael } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EditClientDialog from '@/components/admin/clients/EditClientDialog';
import NewFutureSessionDialog from '@/components/admin/sessions/NewFutureSessionDialog';
import RecurringSessionDialog from '@/components/admin/sessions/RecurringSessionDialog';
import NewHistoricalSessionDialog from '@/components/admin/sessions/NewHistoricalSessionDialog';
import EditFutureSessionDialog from '@/components/admin/sessions/EditFutureSessionDialog';
import DeleteFutureSessionDialog from '@/components/admin/sessions/DeleteFutureSessionDialog';
import ConvertSessionDialog from '@/components/admin/sessions/ConvertSessionDialog';

const PatientProfile = () => {
  const { id } = useParams();
  const patientId = parseInt(id || '0');
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [historicalSessions, setHistoricalSessions] = useState<Session[]>([]);
  const [futureSessions, setFutureSessions] = useState<FutureSession[]>([]);
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [newFutureSessionDialog, setNewFutureSessionDialog] = useState(false);
  const [recurringSessionDialog, setRecurringSessionDialog] = useState(false);
  const [newHistoricalSessionDialog, setNewHistoricalSessionDialog] = useState(false);
  const [editFutureSessionDialog, setEditFutureSessionDialog] = useState<{open: boolean, session: FutureSession | null}>({
    open: false,
    session: null
  });
  const [deleteFutureSessionDialog, setDeleteFutureSessionDialog] = useState<{open: boolean, session: FutureSession | null}>({
    open: false,
    session: null
  });
  const [convertSessionDialog, setConvertSessionDialog] = useState<{open: boolean, session: FutureSession | null}>({
    open: false,
    session: null
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    
    try {
      const supabase = supabaseClient();
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
        
      if (patientError) throw patientError;
      
      setPatient(patientData as Patient);
      
      // Fetch historical sessions
      const { data: historicalData, error: historicalError } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('session_date', { ascending: false });
        
      if (historicalError) throw historicalError;
      
      setHistoricalSessions(historicalData as Session[]);
      
      // Fetch future sessions
      const { data: futureData, error: futureError } = await supabase
        .from('future_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .gt('session_date', new Date().toISOString())
        .order('session_date', { ascending: true });
        
      if (futureError) throw futureError;
      
      setFutureSessions(futureData as FutureSession[]);
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      toast({
        title: "שגיאה בטעינת נתונים",
        description: "לא ניתן לטעון את נתוני הלקוח",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = () => {
    setIsEditClientDialogOpen(true);
  };

  const handleSessionCreated = () => {
    fetchPatientData();
  };

  const formatDateOnly = (dateString: string) => {
    return formatDateInIsraelTimeZone(dateString, 'dd/MM/yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return formatDateTimeInIsrael(dateString);
  };

  const handleEditFutureSession = (session: FutureSession) => {
    setEditFutureSessionDialog({
      open: true,
      session
    });
  };

  const handleDeleteFutureSession = (session: FutureSession) => {
    setDeleteFutureSessionDialog({
      open: true,
      session
    });
  };

  const handleConvertSession = (session: FutureSession) => {
    setConvertSessionDialog({
      open: true,
      session
    });
  };

  const confirmDeleteFutureSession = async () => {
    if (!deleteFutureSessionDialog.session) return;
    
    try {
      const supabase = supabaseClient();
      const { error } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', deleteFutureSessionDialog.session.id);
      
      if (error) throw error;
      
      toast({
        title: "פגישה נמחקה",
        description: "הפגישה העתידית נמחקה בהצלחה",
      });
      
      fetchPatientData();
    } catch (error: any) {
      console.error('Error deleting future session:', error);
      toast({
        title: "שגיאה במחיקת פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setDeleteFutureSessionDialog({ open: false, session: null });
    }
  };

  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case 'Zoom': return 'זום';
      case 'Phone': return 'טלפון';
      case 'In-Person': return 'פרונטלי';
      default: return type;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'שולם';
      case 'partially_paid': return 'שולם חלקית';
      case 'unpaid': return 'לא שולם';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFutureSessionStatusLabel = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'מתוכנן';
      case 'Completed': return 'הושלם';
      case 'Cancelled': return 'בוטל';
      default: return status;
    }
  };

  const getFutureSessionStatusClass = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="פרופיל לקוח">
        <div className="flex justify-center items-center h-64">
          <Skeleton className="w-64 h-8" />
        </div>
      </AdminLayout>
    );
  }

  if (!patient) {
    return (
      <AdminLayout title="פרופיל לקוח">
        <Alert variant="destructive">
          <AlertTitle>לקוח לא נמצא</AlertTitle>
          <AlertDescription>
            לא ניתן למצוא את הלקוח המבוקש.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`פרופיל לקוח - ${patient.name}`}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex justify-between items-center">
                <span>פרטי לקוח</span>
                <Button variant="outline" size="sm" onClick={handleEditPatient}>
                  <Pencil className="w-4 h-4 ml-2" />
                  עריכה
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center">
                <span className="font-semibold w-32">שם:</span>
                <span>{patient.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-32">טלפון:</span>
                <span>{patient.phone || 'לא הוגדר'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-32">אימייל:</span>
                <span>{patient.email || 'לא הוגדר'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-32">מחיר לפגישה:</span>
                <span>{patient.session_price ? `₪${patient.session_price}` : 'לא הוגדר'}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold w-32">הערות:</span>
                <span>{patient.notes || 'אין הערות'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="future" className="space-y-4">
          <TabsList>
            <TabsTrigger value="future">פגישות עתידיות</TabsTrigger>
            <TabsTrigger value="historical">היסטוריית פגישות</TabsTrigger>
          </TabsList>
          <TabsContent value="future">
            <div className="flex justify-end">
              <Button onClick={() => setNewFutureSessionDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                פגישה עתידית חדשה
              </Button>
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={() => setRecurringSessionDialog(true)}
              >
                <Repeat className="h-4 w-4 ml-1" />
                יצירת פגישה חוזרת
              </Button>
            </div>
            {futureSessions.length === 0 ? (
              <Alert>
                <AlertTitle>אין פגישות עתידיות</AlertTitle>
                <AlertDescription>
                  לא קיימות פגישות עתידיות עבור לקוח זה.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {futureSessions.map(session => (
                  <Card key={session.id} className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 ml-2" />
                          <span>{formatDateTime(session.session_date)}</span>
                        </div>
                        <Badge variant="secondary" className={getFutureSessionStatusClass(session.status)}>
                          {getFutureSessionStatusLabel(session.status)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Clock className="w-4 h-4" />
                        <span>{getMeetingTypeLabel(session.meeting_type)}</span>
                      </div>
                      {session.zoom_link && (
                        <a href={session.zoom_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          קישור לזום
                        </a>
                      )}
                      <div className="flex justify-end space-x-2 space-x-reverse mt-4">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditFutureSession(session)}
                                className="text-green-600 hover:text-green-800 hover:bg-green-100"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent dir="rtl">
                              <p>עריכת פגישה</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleConvertSession(session)}
                                className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent dir="rtl">
                              <p>העבר לפגישה היסטורית</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteFutureSession(session)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent dir="rtl">
                              <p>מחיקת פגישה</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="historical">
            {historicalSessions.length === 0 ? (
              <Alert>
                <AlertTitle>אין היסטוריית פגישות</AlertTitle>
                <AlertDescription>
                  לא קיימות פגישות היסטוריות עבור לקוח זה.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תאריך</TableHead>
                    <TableHead>סוג פגישה</TableHead>
                    <TableHead>סטטוס תשלום</TableHead>
                    <TableHead>סכום ששולם</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalSessions.map(session => (
                    <TableRow key={session.id}>
                      <TableCell>{formatDateOnly(session.session_date)}</TableCell>
                      <TableCell>{getMeetingTypeLabel(session.meeting_type)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusBadgeClass(session.payment_status)}>
                          {getPaymentStatusLabel(session.payment_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{session.paid_amount ? `₪${session.paid_amount}` : 'לא שולם'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Button onClick={() => setNewHistoricalSessionDialog(true)}>
              <Plus className="w-4 h-4 ml-2" />
              פגישה היסטורית חדשה
            </Button>
          </TabsContent>
        </Tabs>

        <EditClientDialog
          open={isEditClientDialogOpen}
          onOpenChange={setIsEditClientDialogOpen}
          patient={patient}
          onPatientUpdated={fetchPatientData}
        />

        <NewFutureSessionDialog
          open={newFutureSessionDialog}
          onOpenChange={setNewFutureSessionDialog}
          patientId={patientId}
          patientName={patient.name}
          onCreated={fetchPatientData}
        />

        <RecurringSessionDialog
          open={recurringSessionDialog}
          onOpenChange={setRecurringSessionDialog}
          patientId={patientId}
          patientName={patient.name}
          onCreated={fetchPatientData}
        />

        <NewHistoricalSessionDialog
          open={newHistoricalSessionDialog}
          onOpenChange={setNewHistoricalSessionDialog}
          patientId={patientId}
          patient={patient}
          onSessionCreated={fetchPatientData}
        />

        <EditFutureSessionDialog
          open={editFutureSessionDialog.open}
          onOpenChange={(open) => setEditFutureSessionDialog({ ...editFutureSessionDialog, open })}
          session={editFutureSessionDialog.session}
          patientId={patientId}
          onUpdated={fetchPatientData}
        />

        <DeleteFutureSessionDialog
          open={deleteFutureSessionDialog.open}
          onOpenChange={(open) => setDeleteFutureSessionDialog({ ...deleteFutureSessionDialog, open })}
          session={deleteFutureSessionDialog.session}
          onConfirm={confirmDeleteFutureSession}
          formatDate={formatDateTime}
        />

        <ConvertSessionDialog
          open={convertSessionDialog.open}
          onOpenChange={(open) => setConvertSessionDialog({ ...convertSessionDialog, open })}
          session={convertSessionDialog.session}
          patientId={patientId}
          onConverted={fetchPatientData}
        />
      </div>
    </AdminLayout>
  );
};

export default PatientProfile;
