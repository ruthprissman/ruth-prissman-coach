import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { EditLeadDialog } from '@/components/admin/EditLeadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Download, 
  Filter,
  Search,
  X
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

type Lead = {
  id: string;
  created_at: string | null;
  date: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  referrer_name: string | null;
  status: string | null;
  content_type: string | null;
  first_meeting: string | null;
  second_meeting: string | null;
  first_call_summary: string | null;
  second_call_summary: string | null;
  quoted_price: string | null;
  notes: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

const STATUS_OPTIONS = [
  'Closed – Meetings started',
  'No', 
  'Pending'
];

const getStatusColor = (status: string | null) => {
  switch (status) {
    case 'Closed – Meetings started':
      return 'bg-green-50 text-green-800';
    case 'No':
      return 'bg-red-50 text-red-800';
    case 'Pending':
      return 'bg-orange-50 text-orange-800';
    default:
      return 'bg-gray-50 text-gray-800';
  }
};

const getRowBackgroundColor = (status: string | null) => {
  switch (status) {
    case 'Closed – Meetings started':
      return 'bg-green-50/50';
    case 'No':
      return 'bg-red-50/50';
    case 'Pending':
      return 'bg-orange-50/50';
    default:
      return '';
  }
};

const isLeadOverdue = (status: string | null, updatedAt: string | null) => {
  if (status !== 'Pending' || !updatedAt) return false;
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return new Date(updatedAt) <= threeDaysAgo;
};

const LeadsManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '' });
  const { toast } = useToast();

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת הלידים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      const searchMatch = !searchTerm || 
        (lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         lead.phone?.includes(searchTerm) ||
         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const statusMatch = statusFilter === 'all' || lead.status === statusFilter;

      // Date range filter
      let dateMatch = true;
      if (dateRange.from || dateRange.to) {
        const leadDate = lead.date ? new Date(lead.date) : null;
        if (leadDate) {
          if (dateRange.from && leadDate < dateRange.from) dateMatch = false;
          if (dateRange.to && leadDate > dateRange.to) dateMatch = false;
        }
      }

      return searchMatch && statusMatch && dateMatch;
    });
  }, [leads, searchTerm, statusFilter, dateRange]);

  // Dashboard stats
  const stats = useMemo(() => {
    const total = leads.length;
    const closed = leads.filter(l => l.status === 'Closed – Meetings started').length;
    const open = leads.filter(l => l.status !== 'Closed – Meetings started').length;
    const upcomingMeetings = leads.filter(l => {
      const today = new Date().toISOString().split('T')[0];
      return (l.first_meeting && l.first_meeting >= today) || 
             (l.second_meeting && l.second_meeting >= today);
    }).length;
    const closureRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return { total, closed, open, upcomingMeetings, closureRate };
  }, [leads]);

  // Add new lead
  const handleAddLead = async () => {
    if (!newLead.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'שם הליד הוא שדה חובה',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: newLead.name,
          phone: newLead.phone || null,
          email: newLead.email || null,
          status: 'Pending',
          date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'ליד חדש נוסף בהצלחה',
      });

      setNewLead({ name: '', phone: '', email: '' });
      setShowAddDialog(false);
      fetchLeads();
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהוספת הליד',
        variant: 'destructive',
      });
    }
  };

  // Update lead status
  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'סטטוס הליד עודכן בהצלחה',
      });

      fetchLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון הסטטוס',
        variant: 'destructive',
      });
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: 'הצלחה',
        description: 'הליד נמחק בהצלחה',
      });

      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת הליד',
        variant: 'destructive',
      });
    }
  };

  // Export functionality
  const handleExport = (format: 'csv' | 'pdf') => {
    // Implementation for export functionality would go here
    toast({
      title: 'בקרוב',
      description: `ייצוא ${format.toUpperCase()} יהיה זמין בקרוב`,
    });
  };

  if (loading) {
    return (
      <AdminLayout title="ניהול לידים">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">טוען...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ניהול לידים">
      <div className="space-y-6" dir="rtl">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">סה״כ לידים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-live="polite">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">לידים פתוחים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" aria-live="polite">{stats.open}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">לידים סגורים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" aria-live="polite">{stats.closed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">פגישות עתידיות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" aria-live="polite">{stats.upcomingMeetings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">אחוז סגירה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" aria-live="polite">{stats.closureRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="חיפוש לפי שם, טלפון או אימייל..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 min-w-[250px]"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="סנן לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Active filters */}
            <div className="flex gap-2 flex-wrap">
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {statusFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setStatusFilter('all')}
                  />
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {/* Export */}
            <Select onValueChange={(value) => handleExport(value as 'csv' | 'pdf')}>
              <SelectTrigger className="w-24">
                <Download className="h-4 w-4" />
                <SelectValue placeholder="ייצוא" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Lead */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button aria-label="הוסף ליד חדש">
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף ליד
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>הוסף ליד חדש</DialogTitle>
                  <DialogDescription>
                    הוסף ליד חדש למערכת
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="שם (חובה)"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  />
                  <Input
                    placeholder="טלפון"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  />
                  <Input
                    placeholder="אימייל"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleAddLead}>
                    הוסף
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead scope="col">תאריך</TableHead>
                    <TableHead scope="col">שם</TableHead>
                    <TableHead scope="col">טלפון</TableHead>
                    <TableHead scope="col">אימייל</TableHead>
                    <TableHead scope="col">מאיפה הגיע</TableHead>
                    <TableHead scope="col">שם הממליץ</TableHead>
                    <TableHead scope="col">סטטוס</TableHead>
                    <TableHead scope="col">סוג תוכן</TableHead>
                    <TableHead scope="col">פגישה ראשונה</TableHead>
                    <TableHead scope="col">פגישה שנייה</TableHead>
                    <TableHead scope="col">סיכום שיחה ראשונה</TableHead>
                    <TableHead scope="col">סיכום שיחה שנייה</TableHead>
                    <TableHead scope="col">מחיר שנמסר</TableHead>
                    <TableHead scope="col">הערות</TableHead>
                    <TableHead scope="col">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className={cn(getRowBackgroundColor(lead.status))}
                    >
                      <TableCell>
                        {lead.date ? format(new Date(lead.date), 'dd/MM/yyyy', { locale: he }) : ''}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {lead.name}
                          {isLeadOverdue(lead.status, lead.updated_at) && (
                            <div title="צריך טיפול - עבר יותר מ-3 ימים" aria-label="צריך טיפול">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.source}</TableCell>
                      <TableCell>{lead.referrer_name}</TableCell>
                      <TableCell>
                        <Select 
                          value={lead.status || ''} 
                          onValueChange={(value) => handleStatusUpdate(lead.id, value)}
                        >
                          <SelectTrigger className={cn("w-40", getStatusColor(lead.status))}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{lead.content_type}</TableCell>
                      <TableCell>
                        {lead.first_meeting ? format(new Date(lead.first_meeting), 'dd/MM/yyyy', { locale: he }) : ''}
                      </TableCell>
                      <TableCell>
                        {lead.second_meeting ? format(new Date(lead.second_meeting), 'dd/MM/yyyy', { locale: he }) : ''}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={lead.first_call_summary || ''}>
                          {lead.first_call_summary}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={lead.second_call_summary || ''}>
                          {lead.second_call_summary}
                        </div>
                      </TableCell>
                      <TableCell>{lead.quoted_price}</TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={lead.notes || ''}>
                          {lead.notes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            aria-label={`ערוך ליד ${lead.name}`}
                            onClick={() => {
                              setEditingLead(lead);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                aria-label={`מחק ליד ${lead.name}`}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>מחק ליד</AlertDialogTitle>
                                <AlertDialogDescription>
                                  האם אתה בטוח שברצונך למחוק את הליד "{lead.name}"? פעולה זו לא ניתנת לביטול.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  מחק
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          {lead.status === 'Closed – Meetings started' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: 'בקרוב',
                                  description: 'העברה ללקוחות תהיה זמינה בקרוב',
                                });
                              }}
                            >
                              העבר ללקוחות
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Lead Dialog */}
        <EditLeadDialog
          lead={editingLead}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onLeadUpdated={fetchLeads}
        />

        {filteredLeads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== 'all' ? 'לא נמצאו לידים התואמים לחיפוש' : 'אין לידים במערכת'}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default LeadsManagement;