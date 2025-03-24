
import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

interface PaymentStats {
  totalReceived: number;
  outstandingBalance: number;
  loading: boolean;
}

export const usePaymentStats = () => {
  const [stats, setStats] = useState<PaymentStats>({
    totalReceived: 0,
    outstandingBalance: 0,
    loading: true
  });

  useEffect(() => {
    const fetchPaymentStats = async () => {
      try {
        const client = await supabaseClient();
        
        // Fetch all paid sessions
        const { data: paidSessions, error: paidError } = await client
          .from('sessions')
          .select('paid_amount')
          .eq('payment_status', 'paid');
          
        if (paidError) throw paidError;

        // Calculate total payments received
        const totalReceived = paidSessions?.reduce((sum, session) => 
          sum + (session.paid_amount || 0), 0) || 0;

        // Fetch all unpaid sessions with their patient's session price
        const { data: unpaidSessions, error: unpaidError } = await client
          .from('sessions')
          .select(`
            patient_id,
            patients (
              session_price
            )
          `)
          .neq('payment_status', 'paid');

        if (unpaidError) throw unpaidError;

        // Calculate outstanding balance with proper type checking
        const outstandingBalance = unpaidSessions?.reduce((sum, session) => {
          // Check if patients exists and handle different possible data structures
          if (!session.patients) return sum;
          
          let sessionPrice = 0;
          
          // If patients is an array (when returned as an array of related records)
          if (Array.isArray(session.patients)) {
            if (session.patients.length > 0 && session.patients[0].session_price) {
              sessionPrice = session.patients[0].session_price;
            }
          } 
          // If patients is a direct object (when returned as a nested object)
          else if (typeof session.patients === 'object') {
            sessionPrice = session.patients.session_price || 0;
          }
          
          return sum + sessionPrice;
        }, 0) || 0;

        setStats({
          totalReceived,
          outstandingBalance,
          loading: false
        });

      } catch (error) {
        console.error("Error fetching payment statistics:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPaymentStats();
  }, []);

  return stats;
};
