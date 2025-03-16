import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistance, isAfter, subHours } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { 
  ArrowRight, Edit, Trash2, AlertTriangle, 
  RefreshCw, Phone, User, Monitor, 
  Check, X, CreditCard, BadgeDollarSign, Calendar, 
  Search, ChevronDown, ChevronUp, Info,
  PlusCircle, ArrowDownToLine, History
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Patient, Session, Exercise } from '@/types/patient';
import { FutureSession, ClientStatistics } from '@/types/session';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, CardContent, CardDescription, CardFooter, 
  CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SessionEditDialog from '@/components/admin/SessionEditDialog';
import DeleteSessionDialog from '@/components/admin/sessions/DeleteSessionDialog';
import ConvertSessionDialog from '@/components/admin/sessions/ConvertSessionDialog';
import SessionDetailCollapsible from '@/components/admin/sessions/SessionDetailCollapsible';
import ClientStatisticsCard from '@/components/admin/ClientStatisticsCard';
import NewFutureSessionDialog from '@/components/admin/sessions/NewFutureSessionDialog';
import NewHistoricalSessionDialog from '@/components/admin/sessions/NewHistoricalSessionDialog';

console.log("🚀 ClientDetails.tsx is loaded!");

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("🚀 ClientDetails component rendering with ID:", id);

  // State variables
  const [client, setClient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<FutureSession[]>([]);
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  // Dialog states
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteSessionDialogOpen, setIsDeleteSessionDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isEditSessionDialogOpen, setIsEditSessionDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [isConvertSessionDialogOpen, setIsConvertSessionDialogOpen] = useState(false);
  const [sessionToConvert, setSessionToConvert] = useState<FutureSession | null>(null);
  
  // New dialog states
  const [isNewFutureSessionDialogOpen, setIsNewFutureSessionDialogOpen] = useState(false);
  const [isNewHistoricalSessionDialogOpen, setIsNewHistoricalSessionDialogOpen] = useState(false);
  const [isMoveToHistoricalDialogOpen, setIsMoveToHistoricalDialogOpen] = useState(false);
  const [futureSessionToMove, setFutureSessionToMove] = useState<FutureSession | null>(null);

  // Fetch client data
  const fetchClientData = async () => {
    if (!id) return;
    
    console.log("📌 Fetching client data for ID:", id);
    setIsLoading(true);
    try {
      // Fetch client information
      const { data: clientData, error: clientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clientError) throw clientError;
      
      console.log("📌 Client Data:", clientData);
      setClient(clientData);
      setEditFormData(clientData);
      
      // Fetch upcoming sessions - FIX: Change scheduled_date to session_date
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('future_sessions')
        .select('*')
        .eq('patient_id', id)
        .order('session_date', { ascending: true })
        .limit(3);
      
      if (upcomingError) throw upcomingError;
      
      console.log("📌 Upcoming Sessions:", upcomingData);
      setUpcomingSessions(upcomingData || []);
      
      // Fetch past sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', id)
        .order('session_date', { ascending: false });
      
      if (sessionsError) throw sessionsError;
      
      console.log("📌 Sessions Data:", sessionsData);
      setPastSessions(sessionsData || []);
      setFilteredSessions(sessionsData || []);
      
      // Calculate statistics
      const totalSessions = sessionsData?.length || 0;
      
      let totalDebt = 0;
      sessionsData?.forEach(session => {
        if (session.payment_status !== 'paid') {
          totalDebt += (clientData.session_price || 0) - (session.paid_amount || 0);
        }
      });
      
      const lastSession = sessionsData && sessionsData.length > 0 
        ? sessionsData[0].session_date 
        : null;
      
      // FIX: Use session_date instead of scheduled_date
      const nextSession = upcomingData && upcomingData.length > 0 
        ? upcomingData[0].session_date 
        : null;
      
      const stats = {
        total_sessions: totalSessions,
        total_debt: totalDebt,
        last_session: lastSession,
        next_session: nextSession
      };
      
      console.log("📌 Statistics:", stats);
      setStatistics(stats);
      
    } catch (error: any) {
      console.error('❌ Error fetching client data:', error);
      toast({
        title: "שגיאה בטעינת נתוני לקוח",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when id changes
  useEffect(() => {
    console.log("🔄 useEffect triggered for ID:", id);
    fetchClientData();
  }, [id]);

  // Filter sessions based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSessions(pastSessions);
      return;
    }
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    const filtered = pastSessions.filter(session => {
      return (
        (session.summary && session.summary.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (session.session_date && session.session_date.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (session.exercise_list && session.exercise_list.some(ex => 
          ex.toLowerCase().includes(lowerCaseSearchTerm)
        ))
      );
    });
    
    setFilteredSessions(filtered);
  }, [searchTerm, pastSessions]);

  // Handle client update
  const handleUpdateClient = async () => {
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
          session_price: editFormData.session_price
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "פרטי לקוח עודכנו בהצלחה",
        description: `הפרטים של ${editFormData.name} עודכנו במערכת`,
      });
      
      setIsEditClientDialogOpen(false);
      await fetchClientData();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        title: "שגיאה בעדכון פרטי לקוח",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert future session to completed session
  const handleConvertSession = async (futureSession: FutureSession) => {
    setSessionToConvert(futureSession);
    setIsConvertSessionDialogOpen(true);
  };

  // Move future session to historical
  const handleMoveToHistorical = (futureSession: FutureSession) => {
    setFutureSessionToMove(futureSession);
    setIsMoveToHistoricalDialogOpen(true);
  };

  // Delete future session after moving to historical
  const handleDeleteFutureSession = async () => {
    if (!futureSessionToMove) return;
    
    try {
      const { error } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', futureSessionToMove.id);
      
      if (error) throw error;
      
      await fetchClientData();
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting future session:', error);
      return Promise.reject(error);
    }
  };

  // Handle session conversion confirmation
  const handleSessionConverted = async () => {
    await fetchClientData();
    setIsConvertSessionDialogOpen(false);
    setSessionToConvert(null);
  };

  // Handle delete session
  const handleDeleteSessionConfirm = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteSessionDialogOpen(true);
  };

  // Handle session deletion
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
      
      await fetchClientData();
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

  // Handle edit session
  const handleEditSession = (session: Session) => {
    setSessionToEdit(session);
    setIsEditSessionDialogOpen(true);
  };

  // Handle session update
  const handleSessionUpdated = async () => {
    await fetchClientData();
    setIsEditSessionDialogOpen(false);
    setSessionToEdit(null);
  };

  // Handle new future session created
  const handleFutureSessionCreated = async () => {
    await fetchClientData();
    setIsNewFutureSessionDialogOpen(false);
  };

  // Handle new historical session created
  const handleHistoricalSessionCreated = async () => {
    await fetchClientData();
    setIsNewHistoricalSessionDialogOpen(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  // Format date only (without time)
  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  // Get meeting type icon
  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'Zoom':
        return <Monitor className="h-4 w-4 text-purple-700" />;
      case 'Phone':
        return <Phone className="h-4 w-4 text-purple-700" />;
      case 'In-Person':
        return <User className="h-4 w-4 text-purple-700" />;
      default:
        return null;
    }
  };

  // Get meeting type text
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

  // Get payment method text
  const getPaymentMethodText = (method: string | null) => {
    if (!method) return '-';
    switch (method) {
      case 'cash':
        return 'מזומן';
      case 'bit':
        return 'ביט';
      case 'transfer':
        return 'העברה בנקאית';
      default:
        return method;
    }
  };

  // Get payment status text
  const getPaymentStatusText = (status: string | null) => {
    if (!status) return 'לא שולם';
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

  // Get payment status badge
  const getPaymentStatusBadge = (status: string | null) => {
    if (!status) status = 'unpaid';
    
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

  // Check if session is overdue
  const isSessionOverdue = (sessionDate: string) => {
    const now = new Date();
    const fortyEightHoursAgo = subHours(now, 48);
    const sessionDateTime = new Date(sessionDate);
    
    return isAfter(fortyEightHoursAgo, sessionDateTime);
  };

  // Toggle expand session
  const toggleExpandSession = (sessionId: number) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
    }
  };

  return (
    <AdminLayout title="פרטי לקוח">
      <div dir="rtl">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !client ? (
          <div className="text-center space-y-4 p-10">
            <p className="text-lg font-medium">לקוח לא נמצא</p>
            <Button onClick={() => navigate('/admin/patients')}>
              <ArrowRight className="ml-2 h-4 w-4" />
              חזרה לרשימת הלקוחות
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/patients')}
              className="mb-4 flex items-center"
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              חזרה לרשימת הלקוחות
            </Button>
            
            {/* Alert for unpaid sessions */}
            {statistics && statistics.total_debt > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
                  <p className="text-red-700">
                    <span className="font-bold">שים לב:</span> ללקוח זה יש חוב פתוח של ₪{statistics.total_debt}
                  </p>
                </div>
              </div>
            )}
            
            {/* Client info card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-row-reverse justify-between items-start">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditClientDialogOpen(true)}
                    className="border-purple-300 hover:bg-purple-50 text-purple-700"
                  >
                    <Edit className="h-4 w-4 ml-2 text-purple-600" />
                    עריכת פרטים
                  </Button>
                  <div className="text-right">
                    <CardTitle className="text-2xl text-purple-800">{client.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-purple-700">פרטי קשר</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-purple-600">טלפון:</span>
                          <span dir="ltr">{client.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-purple-600">אימייל:</span>
                          <span>{client.email || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-purple-600">מחיר לפגישה:</span>
                          <span>{client.session_price ? `₪${client.session_price}` : '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-purple-700">הערות</h3>
                    <div className="bg-purple-50 p-3 rounded border border-purple-100 min-h-[100px]">
                      {client.notes || 'אין הערות'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Stats and upcoming sessions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming sessions */}
              <Card className="border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl text-purple-700">פגישות קרובות</CardTitle>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsNewFutureSessionDialogOpen(true)}
                      className="border-purple-300 hover:bg-purple-50 text-purple-700"
                    >
                      <PlusCircle className="h-4 w-4 ml-2 text-purple-600" />
                      יצירת פגישה עתידית חדשה
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">אין פגישות קרובות מתוכננות</p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => {
                        const isOverdue = isSessionOverdue(session.session_date);
                        
                        return (
                          <div 
                            key={session.id} 
                            className={`p-3 rounded-md border ${isOverdue 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-purple-50 border-purple-200'}`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  {isOverdue && (
                                    <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />
                                  )}
                                  <div className="font-medium">
                                    {formatDate(session.session_date)}
                                  </div>
                                </div>
                                <div className="flex items-center mt-1 text-sm text-gray-600">
                                  {getMeetingTypeIcon(session.meeting_type)}
                                  <span className="mr-1">{getMeetingTypeText(session.meeting_type)}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-purple-300 hover:bg-purple-50 text-purple-700"
                                  onClick={() => handleMoveToHistorical(session)}
                                >
                                  <History className="h-3 w-3 ml-1 text-purple-600" />
                                  העבר לפגישה היסטורית
                                </Button>
                                
                                {isOverdue && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-amber-300 hover:bg-amber-50 text-amber-700"
                                    onClick={() => handleConvertSession(session)}
                                  >
                                    <RefreshCw className="h-3 w-3 ml-1 text-amber-600" />
                                    המר לפגישה שהושלמה
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {upcomingSessions.length > 0 && (
                        <div className="flex justify-center pt-2">
                          <Button 
                            variant="ghost" 
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                            onClick={() => toast({
                              title: "בקרוב",
                              description: "תצוגת כל הפגישות העתידיות תהיה זמינה בקרוב",
                            })}
                          >
                            הצג את כל הפגישות העתידיות
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Client statistics */}
              <ClientStatisticsCard 
                statistics={statistics}
                formatDateOnly={formatDateOnly}
              />
            </div>
            
            {/* Past sessions section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewHistoricalSessionDialogOpen(true)}
                  className="border-purple-300 hover:bg-purple-50 text-purple-700"
                >
                  <ArrowDownToLine className="h-4 w-4 ml-2 text-purple-600" />
                  יצירת פגישה היסטורית חדשה
                </Button>
                <h3 className="text-xl font-bold text-purple-800">היסטוריית פגישות</h3>
              </div>
              
              {/* Search bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="חיפוש בפגישות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 border-purple-200 focus-visible:ring-purple-500"
                />
              </div>
              
              {/* No sessions message */}
              {filteredSessions.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">
                      {pastSessions.length === 0 
                        ? 'אין פגישות קודמות עבור לקוח זה' 
                        : 'לא נמצאו פגישות התואמות את החיפוש שלך'}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Sessions table */}
              {filteredSessions.length > 0 && (
                <Card className="border-purple-200">
                  <Table>
                    <TableHeader className="bg-purple-100">
                      <TableRow>
                        <TableHead className="text-purple-800 font-bold">תאריך</TableHead>
                        <TableHead className="text-purple-800 font-bold">סוג פגישה</TableHead>
                        <TableHead className="text-purple-800 font-bold">סטטוס תשלום</TableHead>
                        <TableHead className="text-purple-800 font-bold">סכום ששולם</TableHead>
                        <TableHead className="text-purple-800 font-bold">פעולות</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((session, index) => (
                        <React.Fragment key={session.id}>
                          <TableRow 
                            className={`cursor-pointer hover:bg-purple-50 ${index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}`}
                            onClick={() => toggleExpandSession(session.id)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 ml-2 text-purple-600" />
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
                              {getPaymentStatusBadge(session.payment_status)}
                            </TableCell>
                            <TableCell>
                              <span className={session.payment_status === 'paid' ? 'text-green-600 font-medium' : ''}>
                                ₪{session.paid_amount || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2 space-x-reverse">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSession(session);
                                  }}
                                >
                                  <Edit className="h-4 w-4 ml-1 text-purple-600" />
                                  ערוך
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSessionConfirm(session);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 ml-1 text-red-600" />
                                  מחק
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {expandedSessionId === session.id ? 
                                <ChevronUp className="h-4 w-4 text-purple-600" /> : 
                                <ChevronDown className="h-4 w-4 text-purple-600" />
                              }
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded session details */}
                          {expandedSessionId === session.id && (
                            <TableRow className="bg-purple-50">
                              <TableCell colSpan={6} className="p-0">
                                <SessionDetailCollapsible
                                  session={session}
                                  isExpanded={expandedSessionId === session.id}
                                  onToggle={() => toggleExpandSession(session.id)}
                                  formatDateOnly={formatDateOnly}
                                  getPaymentMethodText={getPaymentMethodText}
                                  client={client}
                                />
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
            
            {/* Edit client dialog */}
            <Dialog open={isEditClientDialogOpen} onOpenChange={setIsEditClientDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center text-purple-800">עריכת פרטי לקוח</DialogTitle>
                </DialogHeader>
                
                {editFormData && (
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-purple-700">שם מלא</Label>
                      <Input 
                        id="name" 
                        value={editFormData.name} 
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className="border-purple-200 focus-visible:ring-purple-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-purple-700">טלפון</Label>
                      <Input 
                        id="phone" 
                        value={editFormData.phone || ''} 
                        onChange={(e) => setEditFormData({...editFormData, phone: e.target.value || null})}
                        className="border-purple-200 focus-visible:ring-purple-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-purple-700">אימייל</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={editFormData.email || ''} 
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value || null})}
                        className="border-purple-200 focus-visible:ring-purple-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="session_price" className="text-purple-700">מחיר לפגישה (₪)</Label>
                      <Input 
                        id="session_price" 
                        type="number"
                        value={editFormData.session_price === null ? '' : editFormData.session_price} 
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : Number(e.target.value);
                          setEditFormData({...editFormData, session_price: value});
                        }}
                        className="border-purple-200 focus-visible:ring-purple-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-purple-700">הערות</Label>
                      <Textarea 
                        id="notes" 
                        value={editFormData.notes || ''} 
                        onChange={(e) => setEditFormData({...editFormData, notes: e.target.value || null})}
                        className="border-purple-200 focus-visible:ring-purple-500 min-h-[100px]"
                      />
                    </div>
                  </div>
                )}
                
                <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
                  <Button 
                    onClick={handleUpdateClient}
                    disabled={isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSubmitting ? 'מעדכן...' : 'עדכן פרטים'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditClientDialogOpen(false)}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    ביטול
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Delete session dialog */}
            <DeleteSessionDialog 
              open={isDeleteSessionDialogOpen}
              onOpenChange={setIsDeleteSessionDialogOpen}
              session={sessionToDelete}
              onConfirm={handleDeleteSession}
              formatDate={formatDate}
            />
            
            {/* Convert session dialog */}
            {sessionToConvert && (
              <ConvertSessionDialog
                open={isConvertSessionDialogOpen}
                onOpenChange={setIsConvertSessionDialogOpen}
                session={sessionToConvert}
                patient={client}
                onSessionConverted={handleSessionConverted}
              />
            )}
            
            {/* New future session dialog */}
            <NewFutureSessionDialog
              open={isNewFutureSessionDialogOpen}
              onOpenChange={setIsNewFutureSessionDialogOpen}
              patientId={Number(id)}
              onSessionCreated={handleFutureSessionCreated}
            />
            
            {/* New historical session dialog */}
            <NewHistoricalSessionDialog
              open={isNewHistoricalSessionDialogOpen}
              onOpenChange={setIsNewHistoricalSessionDialogOpen}
              patientId={Number(id)}
              patient={client}
              onSessionCreated={handleHistoricalSessionCreated}
            />
            
            {/* Move to historical dialog */}
            {futureSessionToMove && (
              <NewHistoricalSessionDialog
                open={isMoveToHistoricalDialogOpen}
                onOpenChange={setIsMoveToHistoricalDialogOpen}
                patientId={Number(id)}
                patient={client}
                onSessionCreated={handleHistoricalSessionCreated}
                fromFutureSession={futureSessionToMove}
                onDeleteFutureSession={handleDeleteFutureSession}
              />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ClientDetails;

