import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { he } from 'date-fns/locale';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { fromZonedTime } from 'date-fns-tz';
import { CalendarIcon, Clock } from 'lucide-react';

interface EmailScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledDate: Date) => void;
  onSendNow: () => void;
  title: string;
}

const EmailScheduleModal = ({ isOpen, onClose, onSchedule, onSendNow, title }: EmailScheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('12:00');

  const handleSchedule = () => {
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Check if the scheduled time is in the past
      if (scheduledDateTime <= new Date()) {
        toast({
          title: "שגיאה",
          description: "לא ניתן לתזמן שליחה בעבר",
          variant: "destructive",
        });
        return;
      }

      // Convert to UTC for storage
      const utcDateTime = fromZonedTime(scheduledDateTime, 'Asia/Jerusalem');
      onSchedule(utcDateTime);
      onClose();
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת התזמון",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">תזמון שליחת מייל</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <h3 className="font-medium text-lg mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm">
              בחר מתי לשלוח את המייל או שלח מיד
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-right flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4" />
                תאריך
              </Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={he}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />
            </div>

            <div>
              <Label htmlFor="time" className="text-right flex items-center gap-2">
                <Clock className="h-4 w-4" />
                שעה
              </Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="text-right"
              />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground text-right">
                <strong>מועד שליחה:</strong>{' '}
                {format(selectedDate, 'dd/MM/yyyy', { locale: he })} בשעה {selectedTime}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button variant="outline" onClick={onSendNow}>
            שלח עכשיו
          </Button>
          <Button onClick={handleSchedule}>
            תזמן שליחה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailScheduleModal;