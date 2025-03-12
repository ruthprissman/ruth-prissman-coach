
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Patient, Session } from '@/types/patient';
import { supabase } from '@/lib/supabase';
import { 
  ArrowRight, CalendarPlus, Edit, Trash2, Monitor, Phone, User, 
  Check, X, CreditCard, BadgeDollarSign, Calendar, Info, 
  ChevronDown, ChevronUp
} from 'lucide-react';
import AddSessionDialog from '@/components/admin/AddSessionDialog';
import SessionEditDialog from '@/components/admin/SessionEditDialog';
import AddExerciseDialog from '@/components/admin/AddExerciseDialog';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isEditSessionDialogOpen, setIsEditSessionDialogOpen] = useState(false);
  const [isAddExerciseDialogOpen, setIsAddExerciseDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteSessionDialogOpen, setIsDeleteSessionDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPatientData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (patientError) throw patientError;
      
      setPatient(patientData);
      setEditFormData(patientData);
      
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

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setIsEditSessionDialogOpen(true);
  };

  const handleDeleteSessionConfirm = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteSessionDialogOpen(true);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "פגישה נמחקה בהצלחה",
        description: `הפגישה נמחקה בהצלחה`,
      });
      
      await fetchPatientData();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast({
        title: "שגיאה במחיקת פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteSessionDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleSessionUpdated = () => {
    fetchPatientData();
    setIsEditSessionDialogOpen(false);
    setSelectedSession(null);
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
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('patient_id', id);
      
      if (sessionsError) throw sessionsError;
      
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

  const handleExerciseAdded = () => {
    toast({
      title: "תרגיל נוסף בהצלחה",
      description: "התרגיל נוסף למאגר בהצלחה"
    });
    setIsAddExerciseDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'Zoom':
        return <Monitor className="h-4 w-4" />;
      case 'Phone':
        return <Phone className="h-4 w-4" />;
      case 'In-Person':
        return <User className="h-4 w-4" />;
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

  // Payment status - this is a placeholder implementation
  // In a real implementation, this would be calculated based on actual payment data
  const getPaymentStatus = (session: Session) => {
    // This is just a placeholder, in reality you would determine this from your payment data
    const statuses = ['paid', 'partially_paid', 'unpaid'];
    const randomIndex = session.id % 3;
    return statuses[randomIndex];
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'שולם';
      case 'partially_paid':
        return 'שולם חלקית';
      case 'unpaid':
        return 'לא שולם';
      default:
        return status;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            {getPaymentStatusText(status)}
          </Badge>
        );
      case 'partially_paid':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <BadgeDollarSign className="h-3 w-3 mr-1" />
            {getPaymentStatusText(status)}
          </Badge>
        );
      case 'unpaid':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <CreditCard className="h-3 w-3 mr-1" />
            {getPaymentStatusText(status)}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // In a real application, this would be calculated from actual data
  const getFinancialStatus = () => {
    if (!patient) return null;
    
    const hasUnpaidSessions = sessions.some(session => getPaymentStatus(session) === 'unpaid');
    
    if (hasUnpaidSessions) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <BadgeDollarSign className="h-3 w-3 mr-1" />
          חיובים לא משולמים
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Check className="h-3 w-3 mr-1" />
        אין חובות
      </Badge>
    );
  };

  const toggleExpandSession = (sessionId: number) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
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
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/patients')}
            className="mb-4"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה לרשימת המטופלים
          </Button>
          
          {/* Customer Card */}
          <Card>
            <CardHeader className="pb-3">
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
                <div className="text-right">
                  <CardTitle className="text-2xl">{patient.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {getFinancialStatus()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">פרטי קשר</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-gray-600">טלפון:</span>
                        <span dir="ltr">{patient.phone || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-gray-600">אימייל:</span>
                        <span>{patient.email || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-medium text-gray-600">מחיר לפגישה:</span>
                        <span>{patient.session_price ? `₪${patient.session_price}` : '-'}</span>
                      </div>
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
            </CardContent>
          </Card>
          
          {/* Sessions List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsAddExerciseDialogOpen(true)}
                >
                  ניהול מאגר תרגילים
                </Button>
                <Button onClick={() => setIsSessionDialogOpen(true)}>
                  <CalendarPlus className="h-4 w-4 ml-2" />
                  הוספת פגישה חדשה
                </Button>
              </div>
              <h3 className="text-xl font-bold">היסטוריית פגישות</h3>
            </div>
            
            {sessions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">אין פגישות קודמות עם מטופל זה.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>תאריך</TableHead>
                      <TableHead>סוג פגישה</TableHead>
                      <TableHead>סטטוס תשלום</TableHead>
                      <TableHead>פעולות</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <React.Fragment key={session.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleExpandSession(session.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 ml-2" />
                              {formatDate(session.session_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getMeetingTypeIcon(session.meeting_type)}
                              <span className="mr-1">{getMeetingTypeText(session.meeting_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(getPaymentStatus(session))}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2 space-x-reverse">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSession(session);
                                }}
                              >
                                <Edit className="h-4 w-4 ml-1" />
                                ערוך
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSessionConfirm(session);
                                }}
                              >
                                <Trash2 className="h-4 w-4 ml-1" />
                                מחק
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {expandedSessionId === session.id ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded Session Details */}
                        {expandedSessionId === session.id && (
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={5} className="p-0">
                              <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2 flex items-center">
                                        <Info className="h-4 w-4 ml-2" />
                                        סיכום פגישה
                                      </h4>
                                      <div className="bg-white p-3 rounded border min-h-[100px]">
                                        {session.summary || 'אין סיכום'}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="flex items-center mb-2">
                                        <h4 className="font-medium">נשלחו תרגילים?</h4>
                                        <div className="flex items-center mr-4">
                                          {session.sent_exercises ? (
                                            <>
                                              <Check className="h-4 w-4 text-green-500 ml-1" />
                                              <span className="text-green-600">כן</span>
                                            </>
                                          ) : (
                                            <>
                                              <X className="h-4 w-4 text-red-500 ml-1" />
                                              <span className="text-red-600">לא</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-2">תרגילים שניתנו</h4>
                                    {session.exercise_list && session.exercise_list.length > 0 ? (
                                      <div className="bg-white p-3 rounded border">
                                        <ul className="list-disc list-inside space-y-1">
                                          {session.exercise_list.map((exercise, index) => (
                                            <li key={index}>{exercise}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : (
                                      <div className="bg-white p-3 rounded border min-h-[100px]">
                                        לא ניתנו תרגילים
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Payment History Section - This would be populated with actual payment data */}
                                <div className="mt-4">
                                  <h4 className="font-medium mb-2 flex items-center">
                                    <BadgeDollarSign className="h-4 w-4 ml-2" />
                                    היסטוריית תשלומים
                                  </h4>
                                  <div className="bg-white p-3 rounded border">
                                    {getPaymentStatus(session) === 'paid' ? (
                                      <div className="flex items-center text-green-600">
                                        <Check className="h-4 w-4 ml-2" />
                                        שולם במלואו: ₪{patient.session_price || 0}
                                      </div>
                                    ) : getPaymentStatus(session) === 'partially_paid' ? (
                                      <div>
                                        <div className="text-amber-600 mb-1">שולם חלקית</div>
                                        <div className="pl-5 border-r-2 border-amber-300 pr-2">
                                          <div className="text-sm">שולם: ₪{Math.floor((patient.session_price || 0) * 0.5)}</div>
                                          <div className="text-sm">יתרה לתשלום: ₪{Math.ceil((patient.session_price || 0) * 0.5)}</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center text-red-600">
                                        <X className="h-4 w-4 ml-2" />
                                        לא שולם: ₪{patient.session_price || 0}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
          
          {/* Dialogs */}
          <AddSessionDialog 
            isOpen={isSessionDialogOpen} 
            onClose={() => setIsSessionDialogOpen(false)} 
            onAddSession={handleAddSession}
            patientId={Number(id)}
          />
          
          {selectedSession && (
            <SessionEditDialog
              isOpen={isEditSessionDialogOpen}
              onClose={() => setIsEditSessionDialogOpen(false)}
              session={selectedSession}
              onSessionUpdated={handleSessionUpdated}
            />
          )}
          
          <AddExerciseDialog
            isOpen={isAddExerciseDialogOpen}
            onClose={() => setIsAddExerciseDialogOpen(false)}
            onExerciseAdded={handleExerciseAdded}
          />
          
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
          
          <Dialog open={isDeleteSessionDialogOpen} onOpenChange={setIsDeleteSessionDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">מחיקת פגישה</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                <p className="text-center">
                  האם אתה בטוח שברצונך למחוק את הפגישה 
                  {sessionToDelete && 
                    ` מתאריך ${formatDate(sessionToDelete.session_date)}`}?
                </p>
                <p className="text-center text-muted-foreground mt-2">
                  פעולה זו אינה ניתנת לביטול.
                </p>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteSession}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'מוחק...' : 'כן, מחק'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteSessionDialogOpen(false)}
                >
                  ביטול
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
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
                    <Label htmlFor="session_price">מחיר לפגישה (₪)</Label>
                    <Input 
                      id="session_price" 
                      type="number"
                      value={editFormData.session_price === null ? '' : editFormData.session_price} 
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number(e.target.value);
                        setEditFormData({...editFormData, session_price: value});
                      }}
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
