
import { format, startOfDay, addDays } from 'date-fns';
import { supabaseClient } from '@/lib/supabaseClient';

export const fetchAvailabilitySlots = async () => {
  const supabase = await supabaseClient();
  const today = startOfDay(new Date());
  const thirtyDaysLater = addDays(today, 30);
  
  console.log('Fetching availability slots from', format(today, 'yyyy-MM-dd'), 'to', format(thirtyDaysLater, 'yyyy-MM-dd'));
  
  const { data: availableSlots, error: availableSlotsError } = await supabase
    .from('calendar_slots')
    .select('*')
    .gte('date', format(today, 'yyyy-MM-dd'))
    .lte('date', format(thirtyDaysLater, 'yyyy-MM-dd'));
  
  if (availableSlotsError) {
    console.error('Error fetching availability slots:', availableSlotsError);
    throw new Error(availableSlotsError.message);
  }
  
  console.log('Fetched availability slots:', availableSlots?.length || 0);
  return availableSlots || [];
};

export const fetchBookedSessions = async () => {
  const supabase = await supabaseClient();
  const today = startOfDay(new Date());
  const thirtyDaysLater = addDays(today, 30);
  
  console.log('Fetching booked sessions from', format(today, 'yyyy-MM-dd'), 'to', format(thirtyDaysLater, 'yyyy-MM-dd'));
  
  const { data: bookedSlots, error: bookedSlotsError } = await supabase
    .from('future_sessions')
    .select('*, patients(name)')
    .gte('session_date', format(today, 'yyyy-MM-dd'))
    .lte('session_date', format(thirtyDaysLater, 'yyyy-MM-dd'));
  
  if (bookedSlotsError) {
    console.error('Error fetching booked sessions:', bookedSlotsError);
    throw new Error(bookedSlotsError.message);
  }
  
  console.log('Fetched booked sessions:', bookedSlots?.length || 0, bookedSlots);
  return bookedSlots || [];
};
