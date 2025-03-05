
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { Patient, Session } from '@/types/patient';
import { SessionWithPatient } from '@/types/session';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Skeleton } from '@/components/ui/skeleton';
import SessionFilters from '@/components/admin/sessions/SessionFilters';
import SessionsList from '@/components/admin/sessions/SessionsList';
import DeleteSessionDialog from '@/components/admin/sessions/DeleteSessionDialog';
import SessionEditDialog from '@/components/admin/SessionEditDialog';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
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

  const handleDeleteSession = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "הפגישה נמחקה בהצלחה",
        description: "הפגישה הוסרה מהמערכת",
      });
      
      // Refresh sessions list
      fetchSessions();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast({
        title: "שגיאה במחיקת הפגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
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

  return (
    <AdminLayout title="כל הפגישות">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <SessionFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            patientFilter={patientFilter}
            setPatientFilter={setPatientFilter}
            meetingTypeFilter={meetingTypeFilter}
            setMeetingTypeFilter={setMeetingTypeFilter}
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
            patients={patients}
            resetFilters={resetFilters}
          />
          
          {/* Sessions list */}
          <SessionsList
            sessions={filteredSessions}
            formatDate={formatDate}
            onEditSession={handleEditSession}
            onDeleteSession={handleDeleteSession}
          />
          
          {/* Session edit dialog */}
          {editingSession && (
            <SessionEditDialog
              isOpen={isEditDialogOpen}
              onClose={() => setIsEditDialogOpen(false)}
              session={editingSession}
              onSessionUpdated={handleSessionUpdated}
            />
          )}
          
          {/* Delete confirmation dialog */}
          <DeleteSessionDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            session={sessionToDelete}
            onConfirm={confirmDeleteSession}
            formatDate={formatDate}
          />
        </div>
      )}
    </AdminLayout>
  );
};

export default AllSessions;
