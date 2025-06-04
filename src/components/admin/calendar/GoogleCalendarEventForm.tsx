
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface GoogleCalendarEventFormProps {
  onCreateEvent?: (summary: string, startDateTime: string, endDateTime: string, description?: string) => Promise<string | null>;
}

export function GoogleCalendarEventForm({ onCreateEvent }: GoogleCalendarEventFormProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    if (!onCreateEvent) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן ליצור אירוע כעת',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Create datetime strings
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;
      
      const eventId = await onCreateEvent(
        formData.title,
        startDateTime,
        endDateTime,
        formData.description
      );
      
      if (eventId) {
        // Reset form
        setFormData({
          title: '',
          date: '',
          startTime: '',
          endTime: '',
          description: ''
        });
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: 'שגיאה ביצירת האירוע',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get today's date for the date input minimum
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          יצירת אירוע ביומן Google
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">כותרת האירוע *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="למשל: פגישה עם לקוח"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="date">תאריך *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              min={today}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startTime">שעת התחלה *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">שעת סיום *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">תיאור (אופציונלי)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="פרטים נוספים על האירוע..."
              rows={3}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isCreating || !onCreateEvent}
          >
            <Clock className="h-4 w-4 mr-2" />
            {isCreating ? 'יוצר אירוע...' : 'צור אירוע ביומן'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
