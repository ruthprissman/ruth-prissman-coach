
import { format, startOfDay, addDays } from 'date-fns';
import { supabaseClient } from '@/lib/supabaseClient';

export const fetchAvailabilitySlots = async () => {
  const supabase = await supabaseClient();
  const today = startOfDay(new Date());
  const thirtyDaysLater = addDays(today, 30);
  
  const { data: availableSlots, error: availableSlotsError } = await supabase
    .from('calendar_slots')
    .select('*')
    .gte('date', format(today, 'yyyy-MM-dd'))
    .lte('date', format(thirtyDaysLater, 'yyyy-MM-dd'));
  
  if (availableSlotsError) throw new Error(availableSlotsError.message);
  
  return availableSlots || [];
};

export const fetchBookedSessions = async () => {
  const supabase = await supabaseClient();
  const today = startOfDay(new Date());
  const thirtyDaysLater = addDays(today, 30);
  
  const { data: bookedSlots, error: bookedSlotsError } = await supabase
    .from('future_sessions')
    .select('*, patients(name)')
    .gte('session_date', format(today, 'yyyy-MM-dd'))
    .lte('session_date', format(thirtyDaysLater, 'yyyy-MM-dd'));
  
  if (bookedSlotsError) throw new Error(bookedSlotsError.message);
  
  return bookedSlots || [];
};
