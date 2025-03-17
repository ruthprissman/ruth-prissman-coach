
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Patient, Session } from '@/types/patient';
import { Edit, ChevronLeft } from 'lucide-react';
import { formatDateInIsraelTimeZone } from '@/utils/dateUtils';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientId = parseInt(id || '0');
  
  const [client, setClient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('שגיאה בטעינת פרטי לקוח');
    } finally {
      setLoading(false);
    }
  }, [clientId]);
  
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
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('שגיאה בטעינת פגישות');
    }
  }, [clientId]);
  
  // Load data on initial render
  useEffect(() => {
    fetchClientData();
    fetchSessions();
  }, [fetchClientData, fetchSessions]);

  if (loading) {
    return (
      <AdminLayout title="טוען פרטי לקוח...">
        <div className="flex items-center justify-center h-full">
          <p>טוען...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!client) {
    return (
      <AdminLayout title="לקוח לא נמצא">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p>הלקוח שחיפשת לא נמצא</p>
          <Button onClick={() => navigate('/admin/patients')}>
            חזרה לרשימת הלקוחות
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="פרטי לקוח">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">פרטי לקוח: {client.name}</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/patients')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          חזרה לרשימת הלקוחות
        </Button>
      </div>

      <Tabs defaultValue="info" className="my-6">
        <TabsList className="mb-4">
          <TabsTrigger value="info">מידע כללי</TabsTrigger>
          <TabsTrigger value="sessions">היסטוריית פגישות</TabsTrigger>
          <TabsTrigger value="notes">הערות</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>פרטים אישיים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>שם</Label>
                    <div className="font-medium">{client.name}</div>
                  </div>
                  <div>
                    <Label>אימייל</Label>
                    <div className="font-medium">{client.email || 'לא צוין'}</div>
                  </div>
                  <div>
                    <Label>טלפון</Label>
                    <div className="font-medium">{client.phone || 'לא צוין'}</div>
                  </div>
                  <div>
                    <Label>מחיר פגישה</Label>
                    <div className="font-medium">{client.session_price || 0} ₪</div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    ערוך פרטים
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>נתונים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>תאריך פגישה אחרון</Label>
                    <div className="font-medium">
                      {client.last_session_date 
                        ? formatDateInIsraelTimeZone(client.last_session_date, 'dd/MM/yyyy') 
                        : 'אין פגישות'}
                    </div>
                  </div>
                  <div>
                    <Label>סטטוס תשלום</Label>
                    <div className="font-medium">
                      {client.financial_status === 'No Debts' 
                        ? 'ללא חובות' 
                        : client.financial_status === 'Has Outstanding Payments' 
                          ? 'תשלומים פתוחים'
                          : 'לא ידוע'}
                    </div>
                  </div>
                  <div>
                    <Label>מספר פגישות</Label>
                    <div className="font-medium">{sessions.length}</div>
                  </div>
                  <div>
                    <Label>פגישות שלא שולמו</Label>
                    <div className="font-medium">
                      {sessions.filter(s => s.payment_status !== 'paid').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>פגישות</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>תאריך</TableHead>
                      <TableHead>סוג פגישה</TableHead>
                      <TableHead>סכום ששולם</TableHead>
                      <TableHead>סטטוס תשלום</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {formatDateInIsraelTimeZone(session.session_date, 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {session.meeting_type === 'Zoom' ? 'זום' : 
                           session.meeting_type === 'Phone' ? 'טלפון' : 
                           session.meeting_type === 'In-Person' ? 'פרונטלית' : 
                           session.meeting_type}
                        </TableCell>
                        <TableCell>{session.paid_amount || 0} ₪</TableCell>
                        <TableCell>
                          <div className={
                            `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${session.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                              session.payment_status === 'partially_paid' ? 'bg-amber-100 text-amber-800' : 
                              'bg-red-100 text-red-800'}`
                          }>
                            {session.payment_status === 'paid' ? 'שולם' : 
                             session.payment_status === 'partially_paid' ? 'שולם חלקית' : 
                             'לא שולם'}
                          </div>
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>הערות</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                readOnly 
                value={client.notes || ''} 
                placeholder="אין הערות" 
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default ClientDetails;
