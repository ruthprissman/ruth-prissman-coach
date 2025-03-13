
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  UserPlus, 
  RefreshCw, 
  Search, 
  Wrench, 
  Calendar, 
  BadgeDollarSign, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal 
} from 'lucide-react';
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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import PatientsListFilters from '@/components/admin/patients/PatientsListFilters';

const PatientsList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [sortOrder, setSortOrder] = useState<'name' | 'last_session'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [debtFilter, setDebtFilter] = useState<'all' | 'has_debt' | 'no_debt'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
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
          .neq('payment_status', 'paid')
          .limit(1);

        // Check for upcoming sessions
        const { data: upcomingSessions } = await supabase
          .from('sessions')
          .select('id')
          .eq('patient_id', patient.id)
          .gt('session_date', new Date().toISOString())
          .limit(1);

        // Calculate if patient is active (had session in last 6 months)
        const isActive = latestSession?.session_date && 
          (new Date(latestSession.session_date).getTime() > new Date().getTime() - (180 * 24 * 60 * 60 * 1000));

        return {
          ...patient,
          last_session_date: latestSession?.session_date || null,
          has_unpaid_sessions: (unpaidSessions?.length || 0) > 0,
          has_upcoming_sessions: (upcomingSessions?.length || 0) > 0,
          is_active: isActive,
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

  // Apply filters and search
  useEffect(() => {
    if (patients.length === 0) return;

    try {
      let filtered = [...patients];

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(patient =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (patient.phone && patient.phone.includes(searchTerm))
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(patient => 
          statusFilter === 'active' ? patient.is_active : !patient.is_active
        );
      }

      // Apply debt filter
      if (debtFilter !== 'all') {
        filtered = filtered.filter(patient => 
          debtFilter === 'has_debt' ? patient.has_unpaid_sessions : !patient.has_unpaid_sessions
        );
      }

      // Apply date range filter
      if (dateRangeFilter.from) {
        filtered = filtered.filter(patient => 
          patient.last_session_date && new Date(patient.last_session_date) >= dateRangeFilter.from!
        );
      }

      if (dateRangeFilter.to) {
        filtered = filtered.filter(patient => 
          patient.last_session_date && new Date(patient.last_session_date) <= dateRangeFilter.to!
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        if (sortOrder === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        } else { // sort by last_session_date
          const dateA = a.last_session_date ? new Date(a.last_session_date).getTime() : 0;
          const dateB = b.last_session_date ? new Date(b.last_session_date).getTime() : 0;
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
      });

      setFilteredPatients(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [patients, searchTerm, sortOrder, sortDirection, statusFilter, debtFilter, dateRangeFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setSortOrder('name');
    setSortDirection('asc');
    setStatusFilter('all');
    setDebtFilter('all');
    setDateRangeFilter({ from: undefined, to: undefined });
  };

  const toggleSort = (field: 'name' | 'last_session') => {
    if (sortOrder === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOrder(field);
      setSortDirection('asc');
    }
  };

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
      return 'border-r-4 border-[#FFD700] bg-white';
    }
    if (patient.last_session_date && 
        new Date(patient.last_session_date).getTime() < new Date().getTime() - (180 * 24 * 60 * 60 * 1000)) {
      return 'border-r-4 border-[#CCCCCC] bg-white';
    }
    if (patient.has_upcoming_sessions) {
      return 'border-r-4 border-[#7E69AB] bg-white';
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
    <AdminLayout title="ניהול לקוחות">
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
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="flex-1 md:flex-none"
            >
              <SlidersHorizontal className="h-4 w-4 ml-2" />
              {isFiltersExpanded ? 'הסתר סינון' : 'הצג סינון'}
            </Button>
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
              className="flex-1 md:flex-none bg-[#CFB53B] hover:bg-[#996515] text-black"
            >
              <UserPlus className="h-4 w-4 ml-2" />
              הוספת לקוחה חדשה
            </Button>
          </div>
        </div>

        {/* Filters section */}
        {isFiltersExpanded && (
          <PatientsListFilters 
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            debtFilter={debtFilter}
            setDebtFilter={setDebtFilter}
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
            resetFilters={resetFilters}
          />
        )}

        {/* Patients summary */}
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-[#4A235A] font-medium">
            סה"כ {filteredPatients.length} מטופלים {searchTerm && 'התואמים את החיפוש'}
            {filteredPatients.length !== patients.length && ` (מתוך ${patients.length} סה"כ)`}
          </p>
        </div>

        {/* Patients table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-[#7E69AB] border-t-transparent rounded-full animate-spin"></div>
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
              <TableHeader className="bg-[#F8F7FA]">
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center">
                      שם מלא
                      {sortOrder === 'name' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4 ml-1" /> : 
                          <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead>אימייל</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('last_session')}
                  >
                    <div className="flex items-center">
                      פגישה אחרונה
                      {sortOrder === 'last_session' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4 ml-1" /> : 
                          <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>סטטוס תשלום</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient, index) => (
                  <TableRow 
                    key={patient.id}
                    className={`${getPatientStatusClasses(patient)} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-[#F0EBF8] transition-colors`}
                  >
                    <TableCell>
                      <Link 
                        to={`/admin/patients/${patient.id}`}
                        className="text-[#4A235A] hover:text-[#CFB53B] hover:underline font-medium flex items-center"
                      >
                        {patient.name}
                        {!patient.is_active && (
                          <Badge variant="outline" className="ml-2 text-xs bg-gray-100">לא פעיל</Badge>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">{patient.phone || '-'}</TableCell>
                    <TableCell>{patient.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-[#7E69AB] ml-1.5" />
                        {formatDate(patient.last_session_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {patient.has_unpaid_sessions ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
                            <BadgeDollarSign className="h-3.5 w-3.5 text-[#CFB53B] ml-1" />
                            חוב פתוח
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                            אין חוב
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Link to={`/admin/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm" className="text-[#7E69AB] hover:text-[#CFB53B] hover:bg-[#F0EBF8]">
                            <Wrench className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
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
