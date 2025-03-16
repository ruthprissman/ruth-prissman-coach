
import React, { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewFutureSessionFormData } from '@/types/session';
import { supabase } from '@/lib/supabase';

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  patientName?: string;
  onCreated?: () => void;
  onSessionCreated?: () => void;
}

const NewFutureSessionDialog: React.FC<NewFutureSessionDialogProps> = ({
  open,
  onOpenChange,
  patientId,
  patientName,
  onCreated,
  onSessionCreated,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  
  const [formData, setFormData] = useState<NewFutureSessionFormData>({
    session_date: new Date(),
    meeting_type: 'Zoom',
    status: 'Scheduled',
    zoom_link: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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

      const { error } = await supabase
        .from('future_sessions')
        .insert({
          patient_id: patientId,
          session_date: combinedDate.toISOString(),
          meeting_type: formData.meeting_type,
          status: 'Scheduled', // Always set to Scheduled for new sessions
          zoom_link: formData.zoom_link || null,
        });

      if (error) throw error;

      toast({
        title: "פגישה עתידית נוצרה בהצלחה",
        description: "הפגישה נוספה ללוח הפגישות",
      });

      if (onCreated) onCreated();
      if (onSessionCreated) onSessionCreated();
      resetForm();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-purple-800">
            {patientName 
              ? `יצירת פגישה עתידית חדשה עבור ${patientName}` 
              : "יצירת פגישה עתידית חדשה"}
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

export default NewFutureSessionDialog;
