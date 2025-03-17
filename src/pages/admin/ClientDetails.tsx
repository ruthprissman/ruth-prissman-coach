
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import ClientInfoCard from '@/components/admin/ClientInfoCard';
import ClientStatisticsCard from '@/components/admin/ClientStatisticsCard';
import { Patient, Session } from '@/types/patient';
import { ClientStatistics } from '@/types/session';
import { formatDateInIsraelTimeZone } from '@/utils/dateUtils';
import { toast } from '@/components/ui/use-toast';

const ClientDetails = () => {
  const { id } = useParams();
  const patientId = parseInt(id || '0');
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null);

  useEffect(() => {
    if (patientId) {
      fetchClientData();
    }
  }, [patientId]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      
      setPatient(patientData as Patient);

      // Fetch session statistics
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', patientId);

      if (sessionsError) throw sessionsError;
      
      // Fetch future sessions
      const { data: futureSessionsData, error: futureSessionsError } = await supabase
        .from('future_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .gt('session_date', new Date().toISOString())
        .order('session_date', { ascending: true })
        .limit(1);

      if (futureSessionsError) throw futureSessionsError;

      // Calculate total debt
      const totalDebt = sessionsData.reduce((sum: number, session: Session) => {
        if (session.payment_status === 'unpaid') {
          return sum + (session.paid_amount ? session_price - session.paid_amount : session_price);
        } else if (session.payment_status === 'partially_paid') {
          return sum + (session.paid_amount ? session_price - session.paid_amount : 0);
        }
        return sum;
      }, 0);
      
      const session_price = patientData.session_price || 0;

      // Get latest session date
      const sortedSessions = [...sessionsData].sort((a, b) => 
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );
      
      const lastSessionDate = sortedSessions.length > 0 ? sortedSessions[0].session_date : null;
      const nextSessionDate = futureSessionsData.length > 0 ? futureSessionsData[0].session_date : null;

      setStatistics({
        total_sessions: sessionsData.length,
        total_debt: totalDebt,
        last_session: lastSessionDate,
        next_session: nextSessionDate
      });

    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "שגיאה בטעינת נתונים",
        description: "לא ניתן לטעון את נתוני הלקוח",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateOnly = (date: string | null) => {
    if (!date) return 'אין מידע';
    return formatDateInIsraelTimeZone(date, 'dd/MM/yyyy');
  };

  if (loading) {
    return (
      <AdminLayout title="פרטי לקוח">
        <div className="flex justify-center items-center h-64">
          <div className="text-purple-600 text-xl animate-pulse">טוען נתונים...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!patient) {
    return (
      <AdminLayout title="פרטי לקוח">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-red-600 text-xl mb-4">לקוח לא נמצא</div>
          <p className="text-gray-600">הלקוח המבוקש אינו קיים במערכת</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`${patient.name} - פרטי לקוח`}>
      <div className="grid gap-6 md:grid-cols-2">
        <ClientInfoCard patient={patient} />
        <ClientStatisticsCard 
          statistics={statistics}
          formatDateOnly={formatDateOnly}
        />
      </div>
    </AdminLayout>
  );
};

export default ClientDetails;
