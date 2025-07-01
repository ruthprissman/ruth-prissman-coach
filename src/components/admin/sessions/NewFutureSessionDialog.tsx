import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { NewFutureSessionFormData } from '@/types/session';
import { supabaseClient } from '@/lib/supabaseClient';
import { formatDateInIsraelTimeZone, convertLocalToUTC } from '@/utils/dateUtils';
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

interface NewFutureSessionDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  patientId: number;
  sessionPrice?: number;
  onSessionCreated?: () => void;
}

const NewFutureSessionDialog: React.FC<NewFutureSessionDialogProps> = ({
  isOpen,
  onClose,
  patientId,
  sessionPrice,
  onSessionCreated,
}) => {
  const { toast } = useToast();
  const { data: sessionTypes, isLoading: isLoadingSessionTypes } = useSessionTypes();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  
  const [formData, setFormData] = useState<NewFutureSessionFormData>({
    session_date: new Date(),
    meeting_type: 'Zoom',
    session_type_id: null,
    status: 'Scheduled',
    zoom_link: '',
  });

  // Calculate session price based on session type - for display purposes
  const getDisplayPrice = (sessionTypeId?: number | null): number => {
    if (!sessionPrice) return 0;
    
    if (sessionTypeId && sessionTypes) {
      const sessionType = sessionTypes.find(type => type.id === sessionTypeId);
      if (sessionType && sessionType.code === 'seft') {
        return sessionPrice * 3; // SEFT sessions cost 3x the regular price
      }
    }
    
    return sessionPrice;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      setFormData((prev) => ({ ...prev, session_date: newDate }));
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      
      // Preserve the selected time
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        newDate.setHours(hours, minutes);
      }
      
      setFormData((prev) => ({ ...prev, session_date: newDate }));
    }
  };

  const resetForm = () => {
    setFormData({
      session_date: new Date(),
      meeting_type: 'Zoom',
      session_type_id: null,
      status: 'Scheduled',
      zoom_link: '',
    });
    setDate(new Date());
    setTime('12:00');
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!date) {
      toast({
        title: "שגיאה",
        description: "יש לבחור תאריך",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Format the combined date and time for database
      const combinedDate = date;
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        combinedDate.setHours(hours, minutes);
      }

      // Convert to UTC before saving to database
      const isoDate = convertLocalToUTC(combinedDate);
      
      console.log('Creating new session with date:', {
        original: combinedDate.toString(),
        iso: isoDate
      });

      const supabase = supabaseClient();
      const { error } = await supabase
        .from('future_sessions')
        .insert({
          patient_id: patientId,
          session_date: isoDate,
          meeting_type: formData.meeting_type,
          session_type_id: formData.session_type_id,
          status: 'Scheduled',
          zoom_link: formData.zoom_link || null,
        });

      if (error) throw error;

      toast({
        title: "פגישה עתידית נוצרה בהצלחה",
        description: "הפגישה נוספה ללוח הפגישות",
      });

      if (onSessionCreated) onSessionCreated();
      resetForm();
      onClose(false);
    } catch (error: any) {
      console.error('Error creating future session:', error);
      toast({
        title: "שגיאה ביצירת פגישה",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">
            הוספת פגישה עתידית
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2" dir="rtl">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-purple-700">תאריך ושעה</Label>
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
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <Input
                id="time"
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="max-w-[120px] border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_type" className="text-purple-700">סוג פגישה</Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value) => handleSelectChange('meeting_type', value)}
            >
              <SelectTrigger className="border-purple-200 focus-visible:ring-purple-500">
                <SelectValue placeholder="בחר סוג פגישה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Zoom">זום</SelectItem>
                <SelectItem value="Phone">טלפון</SelectItem>
                <SelectItem value="In-Person">פגישה פרונטית</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_type" className="text-purple-700">סוג פגישה</Label>
            <Select
              value={formData.session_type_id ? formData.session_type_id.toString() : undefined}
              onValueChange={(value) => setFormData(prev => ({ ...prev, session_type_id: value ? Number(value) : null }))}
            >
              <SelectTrigger className="border-purple-200 focus-visible:ring-purple-500">
                <SelectValue placeholder="בחר סוג פגישה" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingSessionTypes ? (
                  <div className="py-2 px-4 text-sm text-muted-foreground">טוען...</div>
                ) : (
                  sessionTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} ({type.duration_minutes} דקות)
                      {type.code === 'seft' && sessionPrice && ` - ₪${sessionPrice * 3}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {formData.session_type_id && (
              <div className="text-sm text-muted-foreground">
                מחיר פגישה: ₪{getDisplayPrice(formData.session_type_id)}
                {sessionTypes?.find(type => type.id === formData.session_type_id)?.code === 'seft' && 
                  ' (פי 3 מהמחיר הרגיל)'}
              </div>
            )}
          </div>

          {formData.meeting_type === 'Zoom' && (
            <div className="space-y-2">
              <Label htmlFor="zoom_link" className="text-purple-700">קישור לזום</Label>
              <Input
                id="zoom_link"
                name="zoom_link"
                value={formData.zoom_link || ''}
                onChange={handleInputChange}
                className="border-purple-200 focus-visible:ring-purple-500"
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
            {isSubmitting ? 'יוצר פגישה...' : 'צור פגישה'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewFutureSessionDialog;
