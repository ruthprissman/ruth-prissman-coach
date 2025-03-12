
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, RefreshCw, Search, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/types/patient';
import { supabase } from '@/lib/supabase';
import AddPatientDialog from '@/components/admin/AddPatientDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const PatientsList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      // First, fetch basic patient data
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('name', { ascending: true });

      if (patientsError) throw patientsError;

      // For each patient, fetch their latest session date and status
      const patientsWithDetails = await Promise.all((patientsData || []).map(async (patient) => {
        // Get latest session
        const { data: latestSession } = await supabase
          .from('sessions')
          .select('session_date')
          .eq('patient_id', patient.id)
          .order('session_date', { ascending: false })
          .limit(1)
          .single();

        // Check for unpaid sessions (assuming there's a paid field in sessions table)
        const { data: unpaidSessions } = await supabase
          .from('sessions')
          .select('id')
          .eq('patient_id', patient.id)
          .eq('paid', false)
          .limit(1);

        // Check for upcoming sessions
        const { data: upcomingSessions } = await supabase
          .from('sessions')
          .select('id')
          .eq('patient_id', patient.id)
          .gt('session_date', new Date().toISOString())
          .limit(1);

        return {
          ...patient,
          last_session_date: latestSession?.session_date || null,
          has_unpaid_sessions: (unpaidSessions?.length || 0) > 0,
          has_upcoming_sessions: (upcomingSessions?.length || 0) > 0,
        };
      }));

      setPatients(patientsWithDetails);
      setFilteredPatients(patientsWithDetails);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: "שגיאה בטעינת נתוני מטופלים",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.phone && patient.phone.includes(searchTerm))
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: he });
    } catch (e) {
      return '-';
    }
  };

  const getPatientStatusClasses = (patient: Patient) => {
    if (patient.has_unpaid_sessions) {
      return 'border-2 border-[#ea384c] bg-white';
    }
    if (patient.last_session_date && 
        new Date(patient.last_session_date).getTime() < new Date().getTime() - (180 * 24 * 60 * 60 * 1000)) {
      return 'border-2 border-[#FEF7CD] bg-white';
    }
    if (patient.has_upcoming_sessions) {
      return 'border-2 border-[#F2FCE2] bg-white';
    }
    return 'bg-white';
  };

  const handleAddPatient = async (newPatient: Omit<Patient, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([newPatient])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "מטופל נוסף בהצלחה",
        description: `${newPatient.name} נוסף/ה לרשימת המטופלים`,
      });
      
      await fetchPatients();
      return true;
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast({
        title: "שגיאה בהוספת מטופל",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <AdminLayout title="ניהול מטופלים">
      <div className="flex flex-col space-y-6">
        {/* Top controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pr-10"
              placeholder="חיפוש לפי שם, אימייל או טלפון"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-4 space-x-reverse w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={fetchPatients}
              disabled={isLoading}
              className="flex-1 md:flex-none"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
              רענון
            </Button>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="flex-1 md:flex-none"
            >
              <UserPlus className="h-4 w-4 ml-2" />
              הוספת מטופל חדש
            </Button>
          </div>
        </div>

        {/* Patients table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center p-10">
              <p className="text-gray-500">לא נמצאו מטופלים{searchTerm ? " התואמים את החיפוש" : ""}.</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')}>
                  נקה חיפוש
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם מלא</TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead>אימייל</TableHead>
                  <TableHead>מחיר לפגישה</TableHead>
                  <TableHead>פגישה אחרונה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className={getPatientStatusClasses(patient)}>
                    <TableCell>
                      <Link 
                        to={`/admin/patients/${patient.id}`}
                        className="text-[#4A235A] hover:text-gold hover:underline font-medium"
                      >
                        {patient.name}
                      </Link>
                    </TableCell>
                    <TableCell>{patient.phone || '-'}</TableCell>
                    <TableCell>{patient.email || '-'}</TableCell>
                    <TableCell>₪{patient.session_price || '-'}</TableCell>
                    <TableCell>{formatDate(patient.last_session_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {patient.has_unpaid_sessions && (
                          <Badge variant="destructive">תשלום חסר</Badge>
                        )}
                        {patient.has_upcoming_sessions && (
                          <Badge variant="default" className="bg-green-500">פגישה קרובה</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link to={`/admin/patients/${patient.id}`}>
                        <Button variant="ghost" size="sm">
                          <Wrench className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <AddPatientDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onAddPatient={handleAddPatient}
      />
    </AdminLayout>
  );
};

export default PatientsList;
