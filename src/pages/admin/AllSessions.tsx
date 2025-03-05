
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Patient, Session } from '@/types/patient';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, Monitor, Phone, User, Filter, ChevronDown, Edit, 
  Search, CalendarRange, Calendar as CalendarIcon 
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import SessionEditDialog from '@/components/admin/SessionEditDialog';

interface SessionWithPatient extends Session {
  patients: Patient;
}

const AllSessions: React.FC = () => {
  const [sessions, setSessions] = useState<SessionWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithPatient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientFilter, setPatientFilter] = useState<string>('');
  const [meetingTypeFilter, setMeetingTypeFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      // Fetch all sessions with patient information
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          patients(*)
        `)
        .order('session_date', { ascending: false });
      
      if (error) throw error;
      
      setSessions(data as SessionWithPatient[] || []);
      setFilteredSessions(data as SessionWithPatient[] || []);
      
      // Fetch all patients for the filter
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('name');
      
      if (patientsError) throw patientsError;
      
      setPatients(patientsData || []);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "שגיאה בטעינת הפגישות",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, patientFilter, meetingTypeFilter, dateRangeFilter, sessions]);

  const applyFilters = () => {
    let filtered = [...sessions];
    
    // Apply search term filter (patient name)
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.patients.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply patient filter
    if (patientFilter) {
      filtered = filtered.filter(session => 
        session.patient_id.toString() === patientFilter
      );
    }
    
    // Apply meeting type filter
    if (meetingTypeFilter) {
      filtered = filtered.filter(session => 
        session.meeting_type === meetingTypeFilter
      );
    }
    
    // Apply date range filter
    if (dateRangeFilter.from) {
      filtered = filtered.filter(session => 
        new Date(session.session_date) >= dateRangeFilter.from!
      );
    }
    
    if (dateRangeFilter.to) {
      filtered = filtered.filter(session => 
        new Date(session.session_date) <= dateRangeFilter.to!
      );
    }
    
    setFilteredSessions(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setPatientFilter('');
    setMeetingTypeFilter('');
    setDateRangeFilter({ from: undefined, to: undefined });
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setIsEditDialogOpen(true);
  };

  const handleSessionUpdated = () => {
    fetchSessions();
    setIsEditDialogOpen(false);
    setEditingSession(null);
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
        return <Monitor className="h-4 w-4 ml-2" />;
      case 'Phone':
        return <Phone className="h-4 w-4 ml-2" />;
      case 'In-Person':
        return <User className="h-4 w-4 ml-2" />;
      default:
        return <Calendar className="h-4 w-4 ml-2" />;
    }
  };

  return (
    <AdminLayout title="כל הפגישות">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetFilters}
                className="flex gap-2"
              >
                <Filter className="h-4 w-4" />
                איפוס מסננים
              </Button>
              <h3 className="text-lg font-medium">סינון וחיפוש</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search by patient name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">חיפוש לפי שם מטופל</label>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="הקלד שם מטופל..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filter by patient */}
              <div className="space-y-2">
                <label className="text-sm font-medium">סינון לפי מטופל</label>
                <Select
                  value={patientFilter}
                  onValueChange={setPatientFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל המטופלים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כל המטופלים</SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filter by meeting type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">סינון לפי סוג פגישה</label>
                <Select
                  value={meetingTypeFilter}
                  onValueChange={setMeetingTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל סוגי הפגישות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כל סוגי הפגישות</SelectItem>
                    <SelectItem value="Zoom">זום</SelectItem>
                    <SelectItem value="Phone">טלפון</SelectItem>
                    <SelectItem value="In-Person">פגישה פרונטלית</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filter by date range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">סינון לפי טווח תאריכים</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarRange className="ml-2 h-4 w-4" />
                      {dateRangeFilter.from ? (
                        dateRangeFilter.to ? (
                          <>
                            {format(dateRangeFilter.from, "dd/MM/yyyy")} -{" "}
                            {format(dateRangeFilter.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRangeFilter.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "בחר טווח תאריכים"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRangeFilter.from}
                      selected={{
                        from: dateRangeFilter.from,
                        to: dateRangeFilter.to,
                      }}
                      onSelect={(range) => setDateRangeFilter({
                        from: range?.from,
                        to: range?.to,
                      })}
                      numberOfMonths={2}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          {/* Sessions list */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold">רשימת הפגישות ({filteredSessions.length})</h3>
            </div>
            
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">לא נמצאו פגישות התואמות את הסינון.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם המטופל</th>
                      <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך פגישה</th>
                      <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סוג פגישה</th>
                      <th className="py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <a 
                            href={`/admin/patients/${session.patient_id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {session.patients.name}
                          </a>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {formatDate(session.session_date)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            {getMeetingTypeIcon(session.meeting_type)}
                            <span>{session.meeting_type === 'Zoom' ? 'זום' : 
                                   session.meeting_type === 'Phone' ? 'טלפון' : 'פגישה פרונטלית'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditSession(session)}
                          >
                            <Edit className="h-4 w-4 ml-2" />
                            עריכה
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Session edit dialog */}
          {editingSession && (
            <SessionEditDialog
              isOpen={isEditDialogOpen}
              onClose={() => setIsEditDialogOpen(false)}
              session={editingSession}
              onSessionUpdated={handleSessionUpdated}
            />
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AllSessions;
