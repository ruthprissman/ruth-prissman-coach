
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { FutureSession } from '@/types/session';
import { Patient } from '@/types/patient';
import NewHistoricalSessionDialog from './NewHistoricalSessionDialog';

interface ConvertSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FutureSession | null;
  patientId: number;
  onConverted?: () => void;
}

const ConvertSessionDialog: React.FC<ConvertSessionDialogProps> = ({
  open,
  onOpenChange,
  session,
  patientId,
  onConverted,
}) => {
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      if (patientId) {
        try {
          const supabase = supabaseClient();
          const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', patientId)
            .single();
            
          if (error) throw error;
          setPatient(data as Patient);
        } catch (error) {
          console.error('Error fetching patient:', error);
        }
      }
    };
    
    if (open) {
      fetchPatient();
    }
  }, [patientId, open]);

  const handleDeleteFutureSession = async (): Promise<void> => {
    if (!session) return;
    
    try {
      const supabase = supabaseClient();
      const { error } = await supabase
        .from('future_sessions')
        .delete()
        .eq('id', session.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting future session:', error);
      toast({
        title: "שגיאה במחיקת פגישה עתידית",
        description: "לא ניתן למחוק את הפגישה העתידית",
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <NewHistoricalSessionDialog
      open={open}
      onOpenChange={onOpenChange}
      patientId={patientId}
      onSessionCreated={() => {
        if (onConverted) onConverted();
      }}
      fromFutureSession={session}
      onDeleteFutureSession={handleDeleteFutureSession}
    />
  );
};

export default ConvertSessionDialog;
