import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Patient, Session } from '@/types/patient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, Calendar, BadgeDollarSign, Edit, Trash2, User } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AddSessionDialog from '@/components/admin/AddSessionDialog';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const supabase = supabaseClient();
      
      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', id)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      toast({
        title: "שגיאה בטעינת נתוני המטופל",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionAdded = async () => {
    await fetchPatientData();
    setIsAddSessionDialogOpen(false);
    toast({
      title: "פגישה נוספה בהצלחה",
      description: "הפגישה נשמרה במערכת",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="פרופיל מטופל">
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!patient) {
    return (
      <AdminLayout title="פרופיל מטופל">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-gray-700">מטופל לא נמצא</h2>
          <p className="text-gray-500 mt-2">המטופל המבוקש אינו קיים במערכת</p>
          <Button 
            onClick={() => navigate('/admin/patients')}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            חזרה לרשימת המטופלים
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`פרופיל מטופל - ${patient.name}`}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => navigate('/admin/patients')}
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            חזרה לרשימת המטופלים
          </Button>
          
          <Button 
            onClick={() => setIsAddSessionDialogOpen(true)}
            className="flex items-center bg-purple-600 hover:bg-purple-700"
          >
            <Calendar className="mr-2 h-4 w-4" />
            הוספת פגישה
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-purple-800 flex items-center">
              <User className="mr-2 h-5 w-5" />
              פרטי מטופל
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">שם מלא:</span>
                  <span className="font-medium">{patient.name}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">אימייל:</span>
                  {patient.email ? (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-1" />
                      <a href={`mailto:${patient.email}`} className="text-purple-600 hover:underline">
                        {patient.email}
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-400">לא הוזן</span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">טלפון:</span>
                  {patient.phone ? (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-1" />
                      <a href={`tel:${patient.phone}`} className="text-purple-600 hover:underline">
                        {patient.phone}
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
                  <div className="flex items-center">
                    <BadgeDollarSign className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{patient.session_price ? `₪${patient.session_price}` : 'לא הוגדר'}</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">סטטוס:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    פעיל
                  </Badge>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">מספר פגישות:</span>
                  <span>{sessions.length}</span>
                </div>
              </div>
            </div>
            
            {patient.notes && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-medium text-gray-700 mb-2">הערות:</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{patient.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-purple-800">היסטוריית פגישות</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">אין פגישות קודמות עם מטופל זה</p>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {isAddSessionDialogOpen && (
        <AddSessionDialog 
          isOpen={isAddSessionDialogOpen}
          onClose={() => setIsAddSessionDialogOpen(false)}
          patient={patient}
          onSessionAdded={handleSessionAdded}
          sessionPrice={patient.session_price}
        />
      )}
    </AdminLayout>
  );
};

export default PatientProfile;
