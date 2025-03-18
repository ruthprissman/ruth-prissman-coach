import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { Patient, Session } from '@/types/patient';
import { SessionWithPatient } from '@/types/session';
import { supabaseClient } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Skeleton } from '@/components/ui/skeleton';
import SessionFilters from '@/components/admin/sessions/SessionFilters';
import SessionsList from '@/components/admin/sessions/SessionsList';
import DeleteSessionDialog from '@/components/admin/sessions/DeleteSessionDialog';
import SessionEditDialog from '@/components/admin/SessionEditDialog';
import { useAuth } from '@/contexts/AuthContext';

const AllSessions: React.FC = () => {
  const [sessions, setSessions] = useState<SessionWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithPatient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [meetingTypeFilter, setMeetingTypeFilter] = useState<string>('all');
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session: authSession } = useAuth();
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (isLoading && hasAttemptedFetch) return;
    
    setIsLoading(true);
    setHasAttemptedFetch(true);
    setError(null);
    
    try {
      console.log("Fetching sessions, auth session:", !!authSession);
      
      const supabase = supabaseClient();
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          patients(*)
        `)
        .order('session_date', { ascending: false });
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Sessions fetched:", data?.length || 0);
      setSessions(data as SessionWithPatient[] || []);
      setFilteredSessions(data as SessionWithPatient[] || []);
      
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('name');
      
      if (patientsError) throw patientsError;
      
      const validPatients = (patientsData || []).filter(patient => 
        patient && patient.id && patient.name
      );
      
      console.log("Patients fetched:", validPatients.length);
      setPatients(validPatients);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      setError(error.message || "Could not fetch sessions");
      toast({
        title: "שגיאה בטעינת הפגישות",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [authSession, toast, hasAttemptedFetch, isLoading]);

  useEffect(() => {
    if (!hasAttemptedFetch) {
      fetchSessions();
    }
  }, [fetchSessions, hasAttemptedFetch]);

  useEffect(() => {
    if (sessions.length === 0) return;
    
    try {
      let filtered = [...sessions];
      
      if (searchTerm) {
        filtered = filtered.filter(session => 
          session.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (patientFilter && patientFilter !== 'all') {
        filtered = filtered.filter(session => 
          session.patient_id.toString() === patientFilter
        );
      }
      
      if (meetingTypeFilter && meetingTypeFilter !== 'all') {
        filtered = filtered.filter(session => 
          session.meeting_type === meetingTypeFilter
        );
      }
      
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
    } catch (error) {
      console.error('Error applying filters:', error);
      setError('שגיאה בהחלת המסננים');
    }
  }, [searchTerm, patientFilter, meetingTypeFilter, dateRangeFilter, sessions]);

  const resetFilters = () => {
    setSearchTerm('');
    setPatientFilter('all');
    setMeetingTypeFilter('all');
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
      const supabase = supabaseClient();
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "הפגישה נמחקה בהצלחה",
        description: "הפגישה הוסרה מהמערכת",
      });
      
      setHasAttemptedFetch(false);
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
    setHasAttemptedFetch(false);
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
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium text-lg">{error}</p>
          <button 
            onClick={() => {
              setHasAttemptedFetch(false);
              fetchSessions();
            }}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      ) : (
        <div className="space-y-6">
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
          
          <SessionsList
            sessions={filteredSessions}
            formatDate={formatDate}
            onEditSession={handleEditSession}
            onDeleteSession={handleDeleteSession}
          />
          
          {editingSession && (
            <SessionEditDialog
              isOpen={isEditDialogOpen}
              onClose={() => setIsEditDialogOpen(false)}
              session={editingSession}
              onSessionUpdated={handleSessionUpdated}
            />
          )}
          
          <DeleteSessionDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
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
