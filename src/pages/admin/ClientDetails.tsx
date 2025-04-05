import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientInfoCard from '@/components/admin/ClientInfoCard';
import ClientStatisticsCard from '@/components/admin/ClientStatisticsCard';
import { Patient, Session } from '@/types/patient';
import { ClientStatistics, FutureSession } from '@/types/session';
import { formatDateTimeInIsrael, formatDateOnlyInIsrael } from '@/utils/dateUtils';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Plus, Repeat, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DeleteFutureSessionDialog from '@/components/admin/sessions/DeleteFutureSessionDialog';
import EditFutureSessionDialog from '@/components/admin/sessions/EditFutureSessionDialog';
import ConvertSessionDialog from '@/components/admin/sessions/ConvertSessionDialog';
import DeleteSessionDialog from '@/components/admin/sessions/DeleteSessionDialog';
import NewFutureSessionDialog from '@/components/admin/sessions/NewFutureSessionDialog';
import RecurringSessionDialog from '@/components/admin/sessions/RecurringSessionDialog';
import NewHistoricalSessionDialog from '@/components/admin/sessions/NewHistoricalSessionDialog';
import SessionEditDialog from '@/components/admin/SessionEditDialog';

const ClientDetails = () => {
  const { id } = useParams();
  const patientId = parseInt(id || '0');
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null);
  const [futureSessions, setFutureSessions] = useState<FutureSession[]>([]);
  const [historicalSessions, setHistoricalSessions] = useState<Session[]>([]);

  const [deleteSessionDialog, setDeleteSessionDialog] = useState<{open: boolean, session: Session | null}>({
    open: false,
    session: null
  });
  const [deleteFutureSessionDialog, setDeleteFutureSessionDialog] = useState<{open: boolean, session: FutureSession | null}>({
    open: false,
    session: null
  });
  const [editFutureSessionDialog, setEditFutureSessionDialog] = useState<{open: boolean, session: FutureSession | null}>({
    open: false,
    session: null
  });
  const [convertSessionDialog, setConvertSessionDialog] = useState<{open: boolean, session: FutureSession | null}>({
    open: false,
    session: null
  });
  const [newFutureSessionDialog, setNewFutureSessionDialog] = useState<boolean>(false);
  const [recurringSessionDialog, setRecurringSessionDialog] = useState<boolean>(false);
  const [newHistoricalSessionDialog, setNewHistoricalSessionDialog] = useState<boolean>(false);
  const [editHistoricalSessionDialog, setEditHistoricalSessionDialog] = useState<{open: boolean, session: Session | null}>({
    open: false,
    session: null
  });

  useEffect(() => {
    if (patientId) {
      fetchClientData();
    }
  }, [patientId]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      
      setPatient(patientData as Patient);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', patientId);

      if (sessionsError) throw sessionsError;
      
      setHistoricalSessions(sessionsData as Session[]);
      
      const { data: futureSessionsData, error: futureSessionsError } = await supabase
        .from('future_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .gt('session_date', new Date().toISOString())
        .order('session_date', { ascending: true });

      if (futureSessionsError) throw futureSessionsError;
      
      setFutureSessions(futureSessionsData as FutureSession[]);

      const { data: nextSessionData, error: nextSessionError } = await supabase
        .from('future_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .gt('session_date', new Date().toISOString())
        .order('session_date', { ascending: true })
        .limit(1);

      if (nextSessionError) throw nextSessionError;

      const session_price = patientData.session_price || 0;
      const totalDebt = sessionsData.reduce((sum: number, session: Session) => {
        if (session.payment_status === 'unpaid') {
          return sum + (session.paid_amount ? session_price - session.paid_amount : session_price);
        } else if (session.payment_status === 'partially_paid') {
          return sum + (session.paid_amount ? session_price - session.paid_amount : 0);
        }
        return sum;
      }, 0);
      
      const sortedSessions = [...sessionsData].sort((a, b) => 
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );
      
      const lastSessionDate = sortedSessions.length > 0 ? sortedSessions[0].session_date : null;
      const nextSessionDate = nextSessionData.length > 0 ? nextSessionData[0].session_date : null;

      setStatistics({
        total_sessions: sessionsData.length,
        total_debt: totalDebt,
        last_session: lastSessionDate,
        next_session: nextSessionDate
      });

    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "שגיאה בטעינת נתונים",
        description: "לא ניתן לטעון את נתוני הלקוח",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateOnly = (date: string | null) => {
    if (!date) return 'אין מידע';
    return formatDateOnlyInIsrael(date);
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return 'אין מידע';
    return formatDateTimeInIsrael(date);
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

  const handleDeleteHistoricalSession = (session: Session) => {
    setDeleteSessionDialog({
      open: true,
      session
    });
  };

  const handleEditHistoricalSession = (session: Session) => {
    setEditHistoricalSessionDialog({
      open: true,
      session
    });
  };

  const confirmDeleteFutureSession = async () => {
    if (!deleteFutureSessionDialog.session) return;
    
    try {
      const { error } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', deleteFutureSessionDialog.session.id);
      
      if (error) throw error;
      
      toast({
        title: "פגישה נמחקה",
        description: "הפגישה העתידית נמחקה בהצלחה",
      });
      
      fetchClientData();
    } catch (error) {
      console.error('Error deleting future session:', error);
      toast({
        title: "שגיאה במחיקת פגישה",
        description: "לא ניתן למחוק את הפגישה",
        variant: "destructive"
      });
    } finally {
      setDeleteFutureSessionDialog({ open: false, session: null });
    }
  };

  const confirmDeleteHistoricalSession = async () => {
    if (!deleteSessionDialog.session) return;
    
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', deleteSessionDialog.session.id);
      
      if (error) throw error;
      
      toast({
        title: "פגישה נמחקה",
        description: "הפגישה נמחקה בהצלחה",
      });
      
      fetchClientData();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "שגיאה במחיקת פגישה",
        description: "לא ניתן למחוק את הפגישה",
        variant: "destructive"
      });
    } finally {
      setDeleteSessionDialog({ open: false, session: null });
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
      case 'unpaid': 
      case 'pending': 
        return 'bg-red-100 text-red-800';
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
      <AdminLayout title="פרטי לקוח">
        <div className="flex justify-center items-center h-64">
          <div className="text-purple-600 text-xl animate-pulse">טוען נתונים...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!patient) {
    return (
      <AdminLayout title="פרטי לקוח">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-red-600 text-xl mb-4">לקוח לא נמצא</div>
          <p className="text-gray-600">הלקוח המבוקש אינו קיים במערכת</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`${patient.name} - פרטי לקוח`}>
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <ClientInfoCard 
          patient={patient} 
          onPatientUpdated={fetchClientData}
        />
        <ClientStatisticsCard 
          statistics={statistics}
          formatDateOnly={formatDateOnly}
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <Tabs defaultValue="future_sessions" dir="rtl">
          <div className="p-4 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="future_sessions" className="text-base">פגישות עתידיות</TabsTrigger>
              <TabsTrigger value="historical_sessions" className="text-base">היסטוריית פגישות</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="future_sessions" className="p-4">
            <div className="flex justify-between mb-6">
              <Button 
                className="bg-purple-600 hover:bg-purple-700 mr-2"
                onClick={() => setNewFutureSessionDialog(true)}
              >
                <Plus className="h-4 w-4 ml-1" />
                יצירת פגישה חדשה
              </Button>
              <Button 
                variant="outline" 
                className="border-purple-200 text-purple-700"
                onClick={() => setRecurringSessionDialog(true)}
              >
                <Repeat className="h-4 w-4 ml-1" />
                יצירת פגישה חוזרת
              </Button>
            </div>

            {futureSessions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                אין פגישות עתידיות מתוכננות
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {futureSessions.map((session) => (
                  <Card key={session.id} className="border-purple-100 shadow-sm hover:shadow bg-purple-50">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-purple-600 ml-2" />
                          <span className="font-medium text-purple-800">
                            {formatDateTime(session.session_date)}
                          </span>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-full ${getFutureSessionStatusClass(session.status)}`}>
                          {getFutureSessionStatusLabel(session.status)}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-700 mb-2">
                        <Clock className="h-4 w-4 text-purple-500 ml-2" />
                        <span>{getMeetingTypeLabel(session.meeting_type)}</span>
                      </div>

                      {session.zoom_link && (
                        <div className="mb-3">
                          <a 
                            href={session.zoom_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            קישור לזום
                          </a>
                        </div>
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
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historical_sessions" className="p-4">
            <div className="flex justify-end mb-6">
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setNewHistoricalSessionDialog(true)}
              >
                <Plus className="h-4 w-4 ml-1" />
                יצירת פגישה היסטורית חדשה
              </Button>
            </div>

            {historicalSessions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                אין פגישות היסטוריות
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>תאריך ושעה</TableHead>
                      <TableHead>סוג פגישה</TableHead>
                      <TableHead>סטטוס תשלום</TableHead>
                      <TableHead>סכום ששולם</TableHead>
                      <TableHead>תרגילים</TableHead>
                      <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicalSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{formatDateTime(session.session_date)}</TableCell>
                        <TableCell>{getMeetingTypeLabel(session.meeting_type)}</TableCell>
                        <TableCell>
                          <span className={`text-sm px-2 py-1 rounded-full ${getStatusBadgeClass(session.payment_status)}`}>
                            {getPaymentStatusLabel(session.payment_status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {session.paid_amount ? `₪${session.paid_amount}` : 'לא שולם'}
                        </TableCell>
                        <TableCell>
                          {session.sent_exercises && session.exercise_list && session.exercise_list.length > 0 ? (
                            <span className="text-purple-600">
                              {session.exercise_list.length} תרגילים
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">אין תרגילים</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 space-x-reverse">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                              onClick={() => handleEditHistoricalSession(session)}
                            >
                              עריכה
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteHistoricalSession(session)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100"
                            >
                              מחיקה
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DeleteFutureSessionDialog
        open={deleteFutureSessionDialog.open}
        onOpenChange={(open) => setDeleteFutureSessionDialog({ ...deleteFutureSessionDialog, open })}
        session={deleteFutureSessionDialog.session}
        onConfirm={confirmDeleteFutureSession}
        formatDate={formatDateTime}
      />

      <DeleteSessionDialog
        open={deleteSessionDialog.open}
        onOpenChange={(open) => setDeleteSessionDialog({ ...deleteSessionDialog, open })}
        session={deleteSessionDialog.session}
        onConfirm={confirmDeleteHistoricalSession}
        formatDate={formatDateTime}
      />

      <EditFutureSessionDialog
        open={editFutureSessionDialog.open}
        onOpenChange={(open) => setEditFutureSessionDialog({ ...editFutureSessionDialog, open })}
        session={editFutureSessionDialog.session}
        patientId={patientId}
        onUpdated={fetchClientData}
      />

      <ConvertSessionDialog
        open={convertSessionDialog.open}
        onOpenChange={(open) => setConvertSessionDialog({ ...convertSessionDialog, open })}
        session={convertSessionDialog.session}
        patientId={patientId}
        onConverted={fetchClientData}
      />

      <NewFutureSessionDialog
        open={newFutureSessionDialog}
        onOpenChange={setNewFutureSessionDialog}
        patientId={patientId}
        patientName={patient.name}
        onCreated={fetchClientData}
      />

      <RecurringSessionDialog
        open={recurringSessionDialog}
        onOpenChange={setRecurringSessionDialog}
        patientId={patientId}
        patientName={patient.name}
        onCreated={fetchClientData}
      />

      <NewHistoricalSessionDialog
        open={newHistoricalSessionDialog}
        onOpenChange={setNewHistoricalSessionDialog}
        patientId={patientId}
        patient={patient}
        onSessionCreated={fetchClientData}
      />

      {editHistoricalSessionDialog.session && (
        <SessionEditDialog
          isOpen={editHistoricalSessionDialog.open}
          onClose={() => setEditHistoricalSessionDialog({ open: false, session: null })}
          session={editHistoricalSessionDialog.session}
          onSessionUpdated={fetchClientData}
          sessionPrice={patient?.session_price || null}
        />
      )}
    </AdminLayout>
  );
};

export default ClientDetails;
