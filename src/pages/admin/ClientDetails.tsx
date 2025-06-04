
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, Trash2, Edit, User, Plus } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import EditClientDialog from '@/components/admin/clients/EditClientDialog';
import NewFutureSessionDialog from '@/components/admin/sessions/NewFutureSessionDialog';
import ConvertSessionDialog from '@/components/admin/sessions/ConvertSessionDialog';
import DeleteFutureSessionDialog from '@/components/admin/sessions/DeleteFutureSessionDialog';
import DeleteSessionDialog from '@/components/admin/sessions/DeleteSessionDialog';
import UpcomingSessionCard from '@/components/admin/sessions/UpcomingSessionCard';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Patient, Session } from '@/types/patient';
import { FutureSession } from '@/types/session';

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [futureSessions, setFutureSessions] = useState<FutureSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewFutureSessionDialogOpen, setIsNewFutureSessionDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isDeleteFutureDialogOpen, setIsDeleteFutureDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const handleConvertSession = async (futureSession: FutureSession) => {
    setSelectedFutureSession(futureSession);
    setIsConvertDialogOpen(true);
  };

  const handleDeleteFutureSession = async (futureSession: FutureSession) => {
    setSelectedFutureSession(futureSession);
    setIsDeleteFutureDialogOpen(true);
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

  const isOverdue = (sessionDate: string): boolean => {
    const sessionDateTime = new Date(sessionDate);
    const now = new Date();
    return sessionDateTime < now;
  };

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => navigate('/admin/patients')}
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            חזרה לרשימת הלקוחות
          </Button>
          
          <div className="flex space-x-2 space-x-reverse">
            <Button 
              onClick={() => setIsNewFutureSessionDialogOpen(true)}
              className="flex items-center bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              הוספת פגישה עתידית
            </Button>
            
            <Button 
              onClick={() => setIsEditDialogOpen(true)}
              variant="outline"
              className="flex items-center"
            >
              <Edit className="mr-2 h-4 w-4" />
              עריכת פרטים
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
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-purple-800 flex items-center">
              <User className="mr-2 h-5 w-5" />
              פרטי לקוח
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
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
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">מחיר פגישה:</span>
                  <span>{client.session_price ? `₪${client.session_price}` : 'לא הוגדר'}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">סטטוס:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    פעיל
                  </Badge>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">סה"כ פגישות:</span>
                  <span>{sessions.length + futureSessions.length}</span>
                </div>
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
        
        <Tabs defaultValue="future" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="future">פגישות עתידיות ({futureSessions.length})</TabsTrigger>
            <TabsTrigger value="past">פגישות קודמות ({sessions.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="future" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-purple-800">פגישות עתידיות</CardTitle>
              </CardHeader>
              <CardContent>
                {futureSessions.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">אין פגישות עתידיות מתוכננות</p>
                    <Button 
                      onClick={() => setIsNewFutureSessionDialogOpen(true)}
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      הוספת פגישה עתידית
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {futureSessions.map((session) => (
                      <div key={session.id} className="flex justify-between items-center">
                        <UpcomingSessionCard
                          session={session}
                          isOverdue={isOverdue(session.session_date)}
                          onMoveToHistorical={handleMoveToHistorical}
                          onConvertSession={handleConvertSession}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFutureSession(session)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                <CardTitle className="text-xl font-bold text-purple-800">היסטוריית פגישות</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">אין פגישות קודמות עם לקוח זה</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
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
                            <td className="py-3 px-4">{session.meeting_type}</td>
                            <td className="py-3 px-4">
                              <Badge 
                                variant="outline" 
                                className={
                                  session.payment_status === 'paid' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : session.payment_status === 'partially_paid'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }
                              >
                                {session.payment_status === 'paid' 
                                  ? 'שולם' 
                                  : session.payment_status === 'partially_paid'
                                  ? 'שולם חלקית'
                                  : 'לא שולם'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {session.paid_amount ? `₪${session.paid_amount}` : '-'}
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteSession(session)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
    </AdminLayout>
  );
};

export default ClientDetails;
