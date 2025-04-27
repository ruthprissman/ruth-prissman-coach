
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { CalendarSlot, TimeSlot } from '@/types/calendar';
import { addDays, format, startOfWeek, addWeeks } from 'date-fns';

export function useCalendarOperations() {
  const [tableExists, setTableExists] = useState<boolean>(true);

  const checkTableExists = async () => {
    try {
      const supabase = await supabaseClient();
      
      const { error } = await supabase
        .from('calendar_slots')
        .select('id')
        .limit(1);
      
      if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('Calendar slots table does not exist:', error.message);
        setTableExists(false);
        return false;
      }
      
      setTableExists(true);
      return true;
    } catch (error: any) {
      console.error('Error checking if table exists:', error);
      return false;
    }
  };

  const createCalendarSlotsTable = async () => {
    try {
      const supabase = await supabaseClient();
      
      const { error } = await supabase.rpc('create_calendar_slots_table');
      
      if (error) {
        console.error('Error creating calendar_slots table:', error);
        toast({
          title: 'שגיאה ביצירת טבלת יומן',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }
      
      toast({
        title: 'טבלת יומן נוצרה בהצלחה',
        description: 'כעת ניתן להגדיר זמינות ביומן',
      });
      
      setTableExists(true);
      return true;
    } catch (error: any) {
      console.error('Error creating calendar_slots table:', error);
      toast({
        title: 'שגיאה ביצירת טבלת יומן',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const applyDefaultAvailability = async () => {
    if (!tableExists) {
      toast({
        title: 'טבלת היומן חסרה',
        description: 'לא ניתן להגדיר זמינות ברירת מחדל ללא טבלת היומן. אנא צור את הטבלה תחילה.',
        variant: 'destructive',
      });
      return;
    }
    
    const defaultPatterns = [
      { days: [0, 1, 2, 4], startHour: 8, endHour: 16 },
      { days: [0, 1, 2, 3, 4], startHour: 21, endHour: 23 },
      { days: [5], startHour: 9, endHour: 11 }
    ];
    
    const availabilitySlots: TimeSlot[] = [];
    
    for (let week = 0; week < 4; week++) {
      const weekStart = addWeeks(new Date(), week);
      
      defaultPatterns.forEach(pattern => {
        pattern.days.forEach(day => {
          const date = addDays(startOfWeek(weekStart, { weekStartsOn: 0 }), day);
          
          for (let hour = pattern.startHour; hour < pattern.endHour; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
            
            availabilitySlots.push({
              day,
              date: format(date, 'yyyy-MM-dd'),
              startTime,
              endTime,
              status: 'available',
              isRecurring: false
            });
          }
        });
      });
    }
    
    try {
      const supabase = await supabaseClient();
      
      const { error } = await supabase
        .from('calendar_slots')
        .insert(availabilitySlots.map(slot => ({
          date: slot.date,
          start_time: slot.startTime,
          end_time: slot.endTime,
          slot_type: 'available',
          is_recurring: slot.isRecurring
        })));
      
      if (error) throw new Error(error.message);
      
      toast({
        title: 'הגדרת זמינות ברירת מחדל',
        description: 'זמני הזמינות הוגדרו בהצלחה לפי התבנית המוגדרת',
      });
    } catch (error: any) {
      console.error('Error setting default availability:', error);
      toast({
        title: 'שגיאה בהגדרת זמינות ברירת מחדל',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    tableExists,
    checkTableExists,
    createCalendarSlotsTable,
    applyDefaultAvailability
  };
}
