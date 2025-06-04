import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, Trash2, Edit, User, Plus, History, RefreshCw, Monitor, RotateCcw, Wrench, CreditCard, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import EditClientDialog from '@/components/admin/clients/EditClientDialog';
import NewFutureSessionDialog from '@/components/admin/sessions/NewFutureSessionDialog';
import RecurringSessionDialog from '@/components/admin/sessions/RecurringSessionDialog';
import ConvertSessionDialog from '@/components/admin/sessions/ConvertSessionDialog';
import DeleteFutureSessionDialog from '@/components/admin/sessions/DeleteFutureSessionDialog';
import DeleteSessionDialog from '@/components/admin/sessions/DeleteSessionDialog';
import SessionEditDialog from '@/components/admin/SessionEditDialog';
import NewHistoricalSessionDialog from '@/components/admin/sessions/NewHistoricalSessionDialog';
import EditFutureSessionDialog from '@/components/admin/sessions/EditFutureSessionDialog';
import ClientStatisticsCard from '@/components/admin/ClientStatisticsCard';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Patient, Session } from '@/types/patient';
import { FutureSession, ClientStatistics } from '@/types/session';

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [futureSessions, setFutureSessions] = useState<FutureSession[]>([]);
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewFutureSessionDialogOpen, setIsNewFutureSessionDialogOpen] = useState(false);
  const [isNewHistoricalSessionDialogOpen, setIsNewHistoricalSessionDialogOpen] = useState(false);
  const [isRecurringSessionDialogOpen, setIsRecurringSessionDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isDeleteFutureDialogOpen, setIsDeleteFutureDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditSessionDialogOpen, setIsEditSessionDialogOpen] = useState(false);
  const [isEditFutureSessionDialogOpen, setIsEditFutureSessionDialogOpen] = useState(false);
  const [selectedFutureSession, setSelectedFutureSession] = useState<FutureSession | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  const fetchClientDetails = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const supabase = supabaseClient();
      
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch historical sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', id)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Fetch future sessions
      const { data: futureSessionsData, error: futureSessionsError } = await supabase
        .from('future_sessions')
        .select('*')
        .eq('patient_id', id)
        .order('session_date', { ascending: true });

      if (futureSessionsError) throw futureSessionsError;
      setFutureSessions(futureSessionsData || []);

      // Create statistics based on the fetched data
      const lastSession = sessionsData && sessionsData.length > 0 ? sessionsData[0].session_date : null;
      const nextSession = futureSessionsData && futureSessionsData.length > 0 ? futureSessionsData[0].session_date : null;
      
      setStatistics({
        total_sessions: sessionsData?.length || 0,
        total_debt: 0, // This will be calculated in the component based on sessions
        last_session: lastSession,
        next_session: nextSession,
      });
    } catch (error: any) {
      console.error('Error fetching client details:', error);
      toast({
        title: "שגיאה בטעינת פרטי הלקוח",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!client || !window.confirm('האם אתה בטוח שברצונך למחוק את הלקוח? פעולה זו אינה ניתנת לביטול.')) {
      return;
    }

    try {
      const supabase = supabaseClient();
      
      // Delete all future sessions first
      const { error: futureSessionsError } = await supabase
        .from('future_sessions')
        .delete()
        .eq('patient_id', client.id);

      if (futureSessionsError) throw futureSessionsError;

      // Delete all historical sessions
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('patient_id', client.id);

      if (sessionsError) throw sessionsError;

      // Delete the client
      const { error: clientError } = await supabase
        .from('patients')
        .delete()
        .eq('id', client.id);

      if (clientError) throw clientError;

      toast({
        title: "הלקוח נמחק בהצלחה",
        description: "הלקוח וכל הפגישות שלו נמחקו מהמערכת",
      });

      navigate('/admin/patients');
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: "שגיאה במחיקת הלקוח",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

  const handleClientUpdated = (updatedPatient: Patient) => {
    setClient(updatedPatient);
    toast({
      title: "פרטי הלקוח עודכנו בהצלחה",
      description: "הפרטים נשמרו במערכת",
    });
  };

  const handleMoveToHistorical = async (futureSession: FutureSession) => {
    setSelectedFutureSession(futureSession);
    setIsConvertDialogOpen(true);
  };

  const handleEditFutureSession = (futureSession: FutureSession) => {
    setSelectedFutureSession(futureSession);
    setIsEditFutureSessionDialogOpen(true);
  };

  const handleDeleteFutureSession = async (futureSession: FutureSession) => {
    setSelectedFutureSession(futureSession);
    setIsDeleteFutureDialogOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setIsEditSessionDialogOpen(true);
  };

  const handleDeleteSession = async (session: Session) => {
    setSelectedSession(session);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteFutureSession = async () => {
    if (!selectedFutureSession) return;
    
    try {
      const supabase = supabaseClient();
      const { error } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', selectedFutureSession.id);

      if (error) throw error;

      toast({
        title: "פגישה עתידית נמחקה בהצלחה",
        description: "הפגישה הוסרה מהמערכת",
      });

      await fetchClientDetails();
    } catch (error: any) {
      console.error('Error deleting future session:', error);
      toast({
        title: "שגיאה במחיקת פגישה עתידית",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsDeleteFutureDialogOpen(false);
      setSelectedFutureSession(null);
    }
  };

  const confirmDeleteSession = async () => {
    if (!selectedSession) return;
    
    try {
      const supabase = supabaseClient();
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', selectedSession.id);

      if (error) throw error;

      toast({
        title: "פגישה היסטורית נמחקה בהצלחה",
        description: "הפגישה הוסרה מהמערכת",
      });

      await fetchClientDetails();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast({
        title: "שגיאה במחיקת פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSession(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'Zoom':
        return <Monitor className="h-4 w-4 text-purple-700 ml-1" />;
      case 'Phone':
        return <Phone className="h-4 w-4 text-purple-700 ml-1" />;
      case 'In-Person':
        return <User className="h-4 w-4 text-purple-700 ml-1" />;
      default:
        return null;
    }
  };

  const getMeetingTypeText = (type: string) => {
    switch (type) {
      case 'Zoom':
        return 'זום';
      case 'Phone':
        return 'טלפון';
      case 'In-Person':
        return 'פגישה פרונטית';
      default:
        return type;
    }
  };

  // Calculate outstanding balance based on sessions data
  const calculateOutstandingBalance = () => {
    if (!client?.session_price) return 0;
    
    const unpaidSessions = sessions.filter(session => 
      session.payment_status === 'pending' || session.payment_status === 'partial'
    );
    
    return unpaidSessions.reduce((total, session) => {
      const sessionPrice = client.session_price || 0;
      const paidAmount = session.paid_amount || 0;
      return total + (sessionPrice - paidAmount);
    }, 0);
  };

  const outstandingBalance = calculateOutstandingBalance();

  if (isLoading) {
    return (
      <AdminLayout title="פרטי לקוח">
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!client) {
    return (
      <AdminLayout title="פרטי לקוח">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-gray-700">לקוח לא נמצא</h2>
          <p className="text-gray-500 mt-2">הלקוח המבוקש אינו קיים במערכת</p>
          <Button 
            onClick={() => navigate('/admin/patients')}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            חזרה לרשימת הלקוחות
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`פרטי לקוח - ${client.name}`}>
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => navigate('/admin/patients')}
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            חזרה לרשימת הלקוחות
          </Button>
          
          <Button 
            onClick={handleDeleteClient}
            variant="destructive"
            className="flex items-center"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            מחיקת לקוח
          </Button>
        </div>
        
        {/* Swapped order: Details on right, Statistics on left */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Right side - Editable client details */}
          <Card className="relative">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-purple-800 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  פרטי לקוח
                </CardTitle>
                <button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="p-2 hover:bg-purple-100 rounded-full transition-colors"
                  title="ערוך פרטי לקוח"
                >
                  <Wrench className="h-4 w-4 text-purple-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">שם מלא:</span>
                  <span className="font-medium">{client.name}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">אימייל:</span>
                  {client.email ? (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-1" />
                      <a href={`mailto:${client.email}`} className="text-purple-600 hover:underline">
                        {client.email}
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-400">לא הוזן</span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">טלפון:</span>
                  {client.phone ? (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-1" />
                      <a href={`tel:${client.phone}`} className="text-purple-600 hover:underline">
                        {client.phone}
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-400">לא הוזן</span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">מחיר פגישה:</span>
                  <span>{client.session_price ? `₪${client.session_price}` : 'לא הוגדר'}</span>
                </div>
              </div>
              
              {client.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-medium text-gray-700 mb-2">הערות:</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Left side - Statistics using the updated component */}
          <ClientStatisticsCard 
            statistics={statistics}
            sessions={sessions}
            sessionPrice={client.session_price}
            formatDateOnly={formatDateOnly}
          />
        </div>
        
        <Tabs defaultValue="future" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="future">פגישות עתידיות ({futureSessions.length})</TabsTrigger>
            <TabsTrigger value="past">פגישות קודמות ({sessions.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="future" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center" dir="rtl">
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setIsRecurringSessionDialogOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      פגישות חוזרות
                    </Button>
                    <Button 
                      onClick={() => setIsNewFutureSessionDialogOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      הוספת פגישה עתידית
                    </Button>
                  </div>
                  <CardTitle className="text-xl font-bold text-purple-800">פגישות עתידיות</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {futureSessions.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">אין פגישות עתידיות מתוכננות</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
                    {futureSessions.map((session) => (
                      <div key={session.id} className="p-4 rounded-lg border border-purple-200 bg-purple-50 relative">
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => handleEditFutureSession(session)}
                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                          >
                            <Edit className="h-4 w-4 text-purple-600" />
                          </button>
                          <button
                            onClick={() => handleMoveToHistorical(session)}
                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                          >
                            <History className="h-4 w-4 text-purple-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteFutureSession(session)}
                            className="p-1 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                        
                        <div className="mt-6">
                          <div className="font-medium text-purple-800 mb-2">
                            {formatDate(session.session_date)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            {getMeetingTypeIcon(session.meeting_type)}
                            <span>{getMeetingTypeText(session.meeting_type)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center" dir="rtl">
                  <Button 
                    onClick={() => setIsNewHistoricalSessionDialogOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    הוספת פגישה היסטורית
                  </Button>
                  <CardTitle className="text-xl font-bold text-purple-800">היסטוריית פגישות</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">אין פגישות קודמות עם לקוח זה</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto" dir="rtl">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 px-4 text-right">תאריך</th>
                          <th className="py-2 px-4 text-right">סוג פגישה</th>
                          <th className="py-2 px-4 text-right">סטטוס תשלום</th>
                          <th className="py-2 px-4 text-right">סכום</th>
                          <th className="py-2 px-4 text-right">פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => (
                          <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">{formatDate(session.session_date)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {getMeetingTypeIcon(session.meeting_type)}
                                <span>{getMeetingTypeText(session.meeting_type)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant="outline" 
                                className={
                                  session.payment_status === 'paid' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : session.payment_status === 'partial'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }
                              >
                                {session.payment_status === 'paid' 
                                  ? 'שולם' 
                                  : session.payment_status === 'partial'
                                  ? 'שולם חלקית'
                                  : 'לא שולם'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {session.paid_amount ? `₪${session.paid_amount}` : '-'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditSession(session)}
                                  className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                                >
                                  <Edit className="h-4 w-4 text-purple-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(session)}
                                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {isEditDialogOpen && (
        <EditClientDialog 
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          patient={client}
          onPatientUpdated={handleClientUpdated}
        />
      )}

      {isNewFutureSessionDialogOpen && (
        <NewFutureSessionDialog
          open={isNewFutureSessionDialogOpen}
          onOpenChange={setIsNewFutureSessionDialogOpen}
          patientId={Number(id)}
          patientName={client.name}
          onSessionCreated={fetchClientDetails}
        />
      )}

      {isRecurringSessionDialogOpen && (
        <RecurringSessionDialog
          open={isRecurringSessionDialogOpen}
          onOpenChange={setIsRecurringSessionDialogOpen}
          patientId={Number(id)}
          patientName={client.name}
          onSessionsCreated={fetchClientDetails}
        />
      )}

      {isConvertDialogOpen && selectedFutureSession && (
        <ConvertSessionDialog
          open={isConvertDialogOpen}
          onOpenChange={setIsConvertDialogOpen}
          session={selectedFutureSession}
          patientId={Number(id)}
          onConverted={() => {
            fetchClientDetails();
            setIsConvertDialogOpen(false);
            setSelectedFutureSession(null);
          }}
        />
      )}

      {isDeleteFutureDialogOpen && selectedFutureSession && (
        <DeleteFutureSessionDialog
          open={isDeleteFutureDialogOpen}
          onOpenChange={setIsDeleteFutureDialogOpen}
          session={selectedFutureSession}
          onConfirm={confirmDeleteFutureSession}
          formatDate={formatDate}
        />
      )}

      {isDeleteDialogOpen && selectedSession && (
        <DeleteSessionDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          session={selectedSession}
          onConfirm={confirmDeleteSession}
          formatDate={formatDate}
        />
      )}

      {isEditSessionDialogOpen && selectedSession && (
        <SessionEditDialog
          isOpen={isEditSessionDialogOpen}
          onClose={() => {
            setIsEditSessionDialogOpen(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          onSessionUpdated={fetchClientDetails}
          sessionPrice={client.session_price}
        />
      )}

      {isNewHistoricalSessionDialogOpen && (
        <NewHistoricalSessionDialog
          open={isNewHistoricalSessionDialogOpen}
          onOpenChange={setIsNewHistoricalSessionDialogOpen}
          patientId={Number(id)}
          onSessionCreated={fetchClientDetails}
        />
      )}

      {isEditFutureSessionDialogOpen && selectedFutureSession && (
        <EditFutureSessionDialog
          open={isEditFutureSessionDialogOpen}
          onOpenChange={setIsEditFutureSessionDialogOpen}
          session={selectedFutureSession}
          patientId={Number(id)}
          onUpdated={() => {
            fetchClientDetails();
            setIsEditFutureSessionDialogOpen(false);
            setSelectedFutureSession(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default ClientDetails;
