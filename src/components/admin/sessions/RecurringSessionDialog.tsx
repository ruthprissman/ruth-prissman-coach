
import React, { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Calendar, Clock, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

interface RecurringSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: number;
  patientName?: string;
  onCreated?: () => void;
}

const RecurringSessionDialog: React.FC<RecurringSessionDialogProps> = ({
  open,
  onOpenChange,
  patientId,
  patientName,
  onCreated,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('12:00');
  const [meetingType, setMeetingType] = useState<string>('Zoom');
  const [recurringCount, setRecurringCount] = useState<number>(4);
  const [zoomLink, setZoomLink] = useState<string>('');

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  };

  const handleRecurringCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setRecurringCount(isNaN(value) ? 0 : value);
  };

  const resetForm = () => {
    setStartDate(new Date());
    setTime('12:00');
    setMeetingType('Zoom');
    setRecurringCount(4);
    setZoomLink('');
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!startDate) {
      toast({
        title: "שגיאה",
        description: "יש לבחור תאריך התחלה",
        variant: "destructive",
      });
      return;
    }

    if (recurringCount <= 0 || recurringCount > 52) {
      toast({
        title: "שגיאה",
        description: "מספר החזרות חייב להיות בין 1 ל-52",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = time.split(':').map(Number);
      
      const sessions = [];
      for (let i = 0; i < recurringCount; i++) {
        const sessionDate = new Date(startDate);
        sessionDate.setDate(sessionDate.getDate() + (i * 7)); // Weekly sessions
        sessionDate.setHours(hours, minutes);

        sessions.push({
          patient_id: patientId,
          session_date: sessionDate.toISOString(),
          meeting_type: meetingType,
          status: 'Scheduled',
          zoom_link: meetingType === 'Zoom' ? zoomLink : null,
        });
      }

      const { error } = await supabase
        .from('future_sessions')
        .insert(sessions);

      if (error) throw error;

      toast({
        title: "פגישות חוזרות נוצרו בהצלחה",
        description: `נוצרו ${recurringCount} פגישות בלוח הזמנים`,
      });

      if (onCreated) onCreated();
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating recurring sessions:', error);
      toast({
        title: "שגיאה ביצירת פגישות חוזרות",
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
              ? `יצירת פגישות חוזרות עבור ${patientName}` 
              : "יצירת פגישות חוזרות"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2" dir="rtl">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-purple-700">תאריך התחלה</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "border-purple-200 justify-start text-right font-normal w-full",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="ml-2 h-4 w-4 text-purple-600" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך התחלה"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-purple-700">שעה קבועה</Label>
            <div className="flex items-center">
              <Clock className="ml-2 h-4 w-4 text-purple-600" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurringCount" className="text-purple-700">כמות חזרות</Label>
            <div className="flex items-center">
              <Repeat className="ml-2 h-4 w-4 text-purple-600" />
              <Input
                id="recurringCount"
                type="number"
                min="1"
                max="52"
                value={recurringCount}
                onChange={handleRecurringCountChange}
                className="border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              *פגישות שבועיות. בין 1 עד 52 פגישות.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_type" className="text-purple-700">סוג פגישה</Label>
            <Select
              value={meetingType}
              onValueChange={setMeetingType}
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

          {meetingType === 'Zoom' && (
            <div className="space-y-2">
              <Label htmlFor="zoom_link" className="text-purple-700">קישור לזום</Label>
              <Input
                id="zoom_link"
                value={zoomLink}
                onChange={(e) => setZoomLink(e.target.value)}
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
            {isSubmitting ? 'יוצר פגישות...' : 'צור פגישות חוזרות'}
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

export default RecurringSessionDialog;
