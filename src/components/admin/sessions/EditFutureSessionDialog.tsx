
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FutureSession } from '@/types/session';
import { supabaseClient } from '@/lib/supabaseClient';
import { convertLocalToUTC } from '@/utils/dateUtils';
import { useSessionTypes } from '@/hooks/useSessionTypes';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface EditFutureSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FutureSession | null;
  patientId: number;
  onUpdated?: () => void;
}

const EditFutureSessionDialog: React.FC<EditFutureSessionDialogProps> = ({
  open,
  onOpenChange,
  session,
  patientId,
  onUpdated,
}) => {
  const { toast } = useToast();
  const { data: sessionTypes, isLoading: isLoadingSessionTypes } = useSessionTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('');
  
  const [formData, setFormData] = useState<{
    session_date: string;
    meeting_type: 'Zoom' | 'Phone' | 'In-Person';
    session_type_id: number | null;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    zoom_link: string;
  }>({
    session_date: '',
    meeting_type: 'Zoom',
    session_type_id: null,
    status: 'Scheduled',
    zoom_link: '',
  });

  // Initialize form with session data when it's loaded
  useEffect(() => {
    if (session && open) {
      try {
        // Convert session date to local date for editing
        const sessionDate = new Date(session.session_date);
        
        // Set the date and time values for display
        setDate(sessionDate);
        
        // Format time in 24-hour format
        const hours = sessionDate.getHours().toString().padStart(2, '0');
        const minutes = sessionDate.getMinutes().toString().padStart(2, '0');
        setTime(`${hours}:${minutes}`);
        
        // Update form data with session info
        setFormData({
          session_date: session.session_date,
          meeting_type: session.meeting_type,
          session_type_id: session.session_type_id || null,
          status: session.status,
          zoom_link: session.zoom_link || '',
        });
        
        console.log('Editing session with date:', {
          original: session.session_date,
          parsed: sessionDate.toString(),
          time: `${hours}:${minutes}`
        });
      } catch (error) {
        console.error("Error initializing session edit form:", error);
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת נתוני הפגישה",
          variant: "destructive",
        });
      }
    }
  }, [session, open, toast]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || '' }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'session_type_id') {
      setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    
    // Update session_date with new time
    if (date) {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      setFormData((prev) => ({ ...prev, session_date: newDate.toISOString() }));
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      
      // Preserve the selected time
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        const dateWithTime = new Date(newDate);
        dateWithTime.setHours(hours, minutes);
        setFormData((prev) => ({ ...prev, session_date: dateWithTime.toISOString() }));
      } else {
        setFormData((prev) => ({ ...prev, session_date: newDate.toISOString() }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!session || !date) {
      toast({
        title: "שגיאה",
        description: "חסרים נתונים נדרשים",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the combined date and time
      const combinedDate = new Date(date);
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        combinedDate.setHours(hours, minutes);
      }

      // Convert local date to UTC before saving to database
      const isoDate = convertLocalToUTC(combinedDate);
      
      console.log('Edit Session - Details:', {
        original: date.toString(),
        withTime: combinedDate.toString(),
        isoToSave: isoDate
      });

      // Only include fields that exist in the database table
      const supabase = supabaseClient();
      const { error } = await supabase
        .from('future_sessions')
        .update({
          session_date: isoDate,
          meeting_type: formData.meeting_type,
          session_type_id: formData.session_type_id,
          status: formData.status,
          zoom_link: formData.meeting_type === 'Zoom' ? formData.zoom_link : null,
        })
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "פגישה עודכנה בהצלחה",
        description: "נתוני הפגישה עודכנו בהצלחה",
      });

      if (onUpdated) onUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating future session:', error);
      toast({
        title: "שגיאה בעדכון פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">
            עריכת פגישה עתידית
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2" dir="rtl">
          <div className="space-y-2">
            <Label className="text-purple-700">תאריך ושעה</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "border-purple-200 justify-start text-right font-normal flex-1",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="ml-2 h-4 w-4 text-purple-600" />
                    {date ? format(date, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Input
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="max-w-[120px] border-purple-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">סוג פגישה</Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value) => handleSelectChange('meeting_type', value)}
            >
              <SelectTrigger className="border-purple-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Zoom">זום</SelectItem>
                <SelectItem value="Phone">טלפון</SelectItem>
                <SelectItem value="In-Person">פגישה פרונטית</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">סוג פגישה</Label>
            <Select
              value={formData.session_type_id?.toString() || ''}
              onValueChange={(value) => handleSelectChange('session_type_id', value)}
            >
              <SelectTrigger className="border-purple-200">
                <SelectValue placeholder="בחר סוג פגישה" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingSessionTypes ? (
                  <SelectItem value="" disabled>טוען...</SelectItem>
                ) : (
                  sessionTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} ({type.duration_minutes} דקות)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-700">סטטוס</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger className="border-purple-200">
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scheduled">מתוכנן</SelectItem>
                <SelectItem value="Completed">הושלם</SelectItem>
                <SelectItem value="Cancelled">בוטל</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.meeting_type === 'Zoom' && (
            <div className="space-y-2">
              <Label className="text-purple-700">קישור לזום</Label>
              <Input
                name="zoom_link"
                value={formData.zoom_link || ''}
                onChange={handleTextChange}
                className="border-purple-200"
                placeholder="הזן קישור לפגישת זום"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                מעדכן פגישה...
              </div>
            ) : 'שמור שינויים'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFutureSessionDialog;
