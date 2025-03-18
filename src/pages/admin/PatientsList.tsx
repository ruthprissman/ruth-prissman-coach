import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Patient } from '@/types/patient';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AddClientDialog from '@/components/admin/clients/AddClientDialog';
import EditClientDialog from '@/components/admin/clients/EditClientDialog';
import DeleteClientDialog from '@/components/admin/clients/DeleteClientDialog';

const PatientsList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false);
  const [deleteClientDialogOpen, setDeleteClientDialogOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = supabaseClient();
      let query = supabase
        .from('patients')
        .select('*')
        .order('name');
      
      if (activeTab === 'active') {
        query = query.eq('is_active', true);
      } else if (activeTab === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setPatients(data || []);
      setFilteredPatients(data || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      setError(error.message || 'Failed to fetch patients');
      toast({
        title: "שגיאה בטעינת לקוחות",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const handleAddClient = () => {
    setAddClientDialogOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setEditClientDialogOpen(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteClientDialogOpen(true);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    
    setIsDeletingPatient(true);
    
    try {
      const supabase = supabaseClient();
      
      // First check if this patient has any sessions
      const { count: sessionsCount, error: sessionsError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientToDelete.id);
      
      if (sessionsError) throw sessionsError;
      
      // Check if patient has future sessions
      const { count: futureSessionsCount, error: futureSessionsError } = await supabase
        .from('future_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientToDelete.id);
      
      if (futureSessionsError) throw futureSessionsError;
      
      if (sessionsCount || futureSessionsCount) {
        // Has related data, mark as inactive instead of deleting
        const { error: updateError } = await supabase
          .from('patients')
          .update({ is_active: false })
          .eq('id', patientToDelete.id);
        
        if (updateError) throw updateError;
        
        toast({
          title: "לקוח הועבר לארכיון",
          description: "הלקוח סומן כלא פעיל ולא יופיע ברשימת הלקוחות הפעילים"
        });
      } else {
        // No related data, can delete
        const { error: deleteError } = await supabase
          .from('patients')
          .delete()
          .eq('id', patientToDelete.id);
        
        if (deleteError) throw deleteError;
        
        toast({
          title: "לקוח נמחק",
          description: "הלקוח נמחק בהצלחה מהמערכת"
        });
      }
      
      fetchPatients();
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast({
        title: "שגיאה במחיקת לקוח",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setIsDeletingPatient(false);
      setDeleteClientDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handlePatientUpdated = () => {
    fetchPatients();
    setEditClientDialogOpen(false);
    setPatientToEdit(null);
  };

  const handlePatientAdded = () => {
    fetchPatients();
    setAddClientDialogOpen(false);
  };

  return (
    <AdminLayout title="ניהול לקוחות">
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="active" className="w-1/2">לקוחות פעילים</TabsTrigger>
                  <TabsTrigger value="inactive" className="w-1/2">לקוחות לא פעילים</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={handleAddClient} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 ml-2" />
                הוסף לקוח
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <Input
                type="text"
                placeholder="חיפוש לקוח..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם</TableHead>
                      <TableHead>טלפון</TableHead>
                      <TableHead>אימייל</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>{patient.phone || 'לא הוגדר'}</TableCell>
                        <TableCell>{patient.email || 'לא הוגדר'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPatient(patient)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePatient(patient)}
                              disabled={isDeletingPatient}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddClientDialog
        open={addClientDialogOpen}
        onOpenChange={setAddClientDialogOpen}
        onPatientAdded={handlePatientAdded}
      />

      <EditClientDialog
        open={editClientDialogOpen}
        onOpenChange={setEditClientDialogOpen}
        patient={patientToEdit || { id: 0, name: '' }}
        onPatientUpdated={handlePatientUpdated}
      />

      <DeleteClientDialog
        open={deleteClientDialogOpen}
        onOpenChange={setDeleteClientDialogOpen}
        patient={patientToDelete}
        onConfirm={confirmDeletePatient}
        isDeleting={isDeletingPatient}
      />
    </AdminLayout>
  );
};

export default PatientsList;
