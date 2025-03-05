
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/types/patient';
import { supabase } from '@/lib/supabase';
import AddPatientDialog from '@/components/admin/AddPatientDialog';

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
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setPatients(data || []);
      setFilteredPatients(data || []);
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      שם מלא
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      טלפון
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      אימייל
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      הערות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          to={`/admin/patients/${patient.id}`}
                          className="text-[#4A235A] hover:text-gold hover:underline font-medium transition-colors"
                        >
                          {patient.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {patient.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {patient.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div className="max-w-xs overflow-hidden text-ellipsis">
                          {patient.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
