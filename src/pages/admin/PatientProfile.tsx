
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Patient, Session } from '@/types/patient';
import { supabase } from '@/lib/supabase';
import { ArrowRight, CalendarPlus, Edit, Trash2 } from 'lucide-react';
import AddSessionDialog from '@/components/admin/AddSessionDialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import he from 'date-fns/locale/he';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPatientData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Fetch patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (patientError) throw patientError;
      
      setPatient(patientData);
      setEditFormData(patientData);
      
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
        title: "שגיאה בטעינת נתוני מטופל",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleAddSession = async (newSession: Omit<Session, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([newSession])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "פגישה נוספה בהצלחה",
        description: `פגישה חדשה נוספה למטופל/ת ${patient?.name}`,
      });
      
      await fetchPatientData();
      return true;
    } catch (error: any) {
      console.error('Error adding session:', error);
      toast({
        title: "שגיאה בהוספת פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleUpdatePatient = async () => {
    if (!editFormData || !id) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          name: editFormData.name,
          phone: editFormData.phone,
          email: editFormData.email,
          notes: editFormData.notes,
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "פרטי מטופל עודכנו בהצלחה",
        description: `הפרטים של ${editFormData.name} עודכנו במערכת`,
      });
      
      setIsEditDialogOpen(false);
      await fetchPatientData();
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast({
        title: "שגיאה בעדכון פרטי מטופל",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!id || !patient) return;
    
    setIsSubmitting(true);
    try {
      // First delete all sessions
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('patient_id', id);
      
      if (sessionsError) throw sessionsError;
      
      // Then delete the patient
      const { error: patientError } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      
      if (patientError) throw patientError;
      
      toast({
        title: "מטופל נמחק בהצלחה",
        description: `${patient.name} נמחק/ה מהמערכת`,
      });
      
      navigate('/admin/patients');
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast({
        title: "שגיאה במחיקת מטופל",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <AdminLayout title="פרטי מטופל">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !patient ? (
        <div className="text-center space-y-4 p-10">
          <p className="text-lg font-medium">מטופל לא נמצא</p>
          <Button onClick={() => navigate('/admin/patients')}>
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה לרשימת המטופלים
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Back button */}
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/patients')}
            className="mb-4"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה לרשימת המטופלים
          </Button>
          
          {/* Patient details card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex space-x-2 space-x-reverse">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 ml-2" />
                  עריכת פרטים
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-white border-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחיקת מטופל
                </Button>
              </div>
              <h2 className="text-2xl font-bold">{patient.name}</h2>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">פרטי קשר</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">טלפון:</span>
                    <span>{patient.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">אימייל:</span>
                    <span>{patient.email || '-'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">הערות</h3>
                <div className="bg-gray-50 p-3 rounded border min-h-[100px]">
                  {patient.notes || 'אין הערות'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sessions section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button onClick={() => setIsSessionDialogOpen(true)}>
                <CalendarPlus className="h-4 w-4 ml-2" />
                הוספת פגישה חדשה
              </Button>
              <h3 className="text-xl font-bold">היסטוריית פגישות</h3>
            </div>
            
            {sessions.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <p className="text-gray-500">אין פגישות קודמות עם מטופל זה.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div className="text-gray-500">
                        {formatDate(session.session_date)}
                      </div>
                      <h4 className="text-lg font-medium">פגישה #{session.id}</h4>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-2">סיכום פגישה</h5>
                        <div className="bg-gray-50 p-3 rounded border min-h-[100px]">
                          {session.summary || 'אין סיכום'}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">תרגילים שניתנו</h5>
                        <div className="bg-gray-50 p-3 rounded border min-h-[100px]">
                          {session.exercise || 'לא ניתנו תרגילים'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Dialogs */}
          <AddSessionDialog 
            isOpen={isSessionDialogOpen} 
            onClose={() => setIsSessionDialogOpen(false)} 
            onAddSession={handleAddSession}
            patientId={Number(id)}
          />
          
          {/* Delete confirmation dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">מחיקת מטופל</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <p className="text-center">
                  האם אתה בטוח שברצונך למחוק את {patient.name}?
                </p>
                <p className="text-center text-muted-foreground mt-2">
                  פעולה זו תמחק גם את כל הפגישות המשויכות ואינה ניתנת לביטול.
                </p>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
                <Button 
                  variant="destructive" 
                  onClick={handleDeletePatient}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'מוחק...' : 'כן, מחק'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  ביטול
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">עריכת פרטי מטופל</DialogTitle>
              </DialogHeader>
              
              {editFormData && (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">שם מלא</Label>
                    <Input 
                      id="name" 
                      value={editFormData.name} 
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">טלפון</Label>
                    <Input 
                      id="phone" 
                      value={editFormData.phone || ''} 
                      onChange={(e) => setEditFormData({...editFormData, phone: e.target.value || null})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={editFormData.email || ''} 
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value || null})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">הערות</Label>
                    <Textarea 
                      id="notes" 
                      value={editFormData.notes || ''} 
                      onChange={(e) => setEditFormData({...editFormData, notes: e.target.value || null})}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
                <Button 
                  onClick={handleUpdatePatient}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'מעדכן...' : 'עדכן פרטים'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  ביטול
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </AdminLayout>
  );
};

export default PatientProfile;
