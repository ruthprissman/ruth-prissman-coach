
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { usePatients } from '@/hooks/usePatients';
import { useSessionTypes, getDefaultSessionType, getSessionTypeDuration } from '@/hooks/useSessionTypes';
import { useQueryClient } from '@tanstack/react-query';
import AddPatientDialog from '@/components/admin/AddPatientDialog';
import { Patient } from '@/types/patient';
import { supabaseClient } from '@/lib/supabaseClient';

interface GoogleCalendarEventFormProps {
  onCreateEvent?: (summary: string, startDateTime: string, endDateTime: string, description?: string) => Promise<string | null>;
}

export function GoogleCalendarEventForm({ onCreateEvent }: GoogleCalendarEventFormProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    meetingType: 'טלפון',
    sessionTypeId: getDefaultSessionType().id.toString(), // New field with default
    meetingWith: '',
    customMeetingWith: '',
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    description: ''
  });

  const { data: patients = [], isLoading: isLoadingPatients } = usePatients();
  const { data: sessionTypes = [], isLoading: isLoadingSessionTypes } = useSessionTypes();
  const queryClient = useQueryClient();

  // Auto-generate title and end time based on selections
  useEffect(() => {
    let newSubject = '';
    let newEndTime = '';

    if (formData.meetingType && formData.meetingType !== 'אחר') {
      if (formData.meetingWith) {
        const selectedPatient = patients.find(p => p.id.toString() === formData.meetingWith);
        if (selectedPatient) {
          newSubject = `פגישה עם ${selectedPatient.name}`;
          
          // Auto-calculate end time based on session type duration
          if (formData.startTime && formData.sessionTypeId) {
            const [hours, minutes] = formData.startTime.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            const duration = getSessionTypeDuration(parseInt(formData.sessionTypeId), sessionTypes);
            const endMinutes = startMinutes + duration;
            const endHours = Math.floor(endMinutes / 60);
            const remainingMinutes = endMinutes % 60;
            newEndTime = `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
          }
        }
      }
    } else if (formData.meetingType === 'אחר' && formData.customMeetingWith) {
      newSubject = formData.customMeetingWith;
    }

    setFormData(prev => ({
      ...prev,
      subject: newSubject,
      ...(newEndTime && formData.meetingType !== 'אחר' ? { endTime: newEndTime } : {})
    }));
  }, [formData.meetingType, formData.meetingWith, formData.customMeetingWith, formData.startTime, formData.sessionTypeId, patients, sessionTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 FORM_DEBUG: Form submission started with data:', formData);
    
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.meetingType) {
      console.log('📝 FORM_DEBUG: Validation failed - missing required fields');
      toast({
        title: 'שגיאה',
        description: 'יש למלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    if (formData.meetingType !== 'אחר' && !formData.meetingWith) {
      console.log('📝 FORM_DEBUG: Validation failed - missing client selection');
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לקוח עבור הפגישה',
        variant: 'destructive',
      });
      return;
    }

    if (formData.meetingType === 'אחר' && !formData.customMeetingWith) {
      console.log('📝 FORM_DEBUG: Validation failed - missing custom meeting description');
      toast({
        title: 'שגיאה',
        description: 'יש להזין תיאור עבור זמן פרטי',
        variant: 'destructive',
      });
      return;
    }

    if (!onCreateEvent) {
      console.log('📝 FORM_DEBUG: No onCreateEvent function provided');
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
      
      // Create description based on meeting type and session type
      let description = formData.description;
      if (formData.meetingType !== 'אחר') {
        const selectedSessionType = sessionTypes.find(type => type.id.toString() === formData.sessionTypeId);
        const sessionTypeText = selectedSessionType ? selectedSessionType.name : 'פגישה רגילה';
        description = `סוג פגישה: ${formData.meetingType}\nסוג טיפול: ${sessionTypeText}\n${formData.description || ''}`.trim();
      }
      
      console.log('📝 FORM_DEBUG: Calling onCreateEvent with:', {
        title: formData.subject,
        startDateTime,
        endDateTime,
        description
      });
      
      const eventId = await onCreateEvent(
        formData.subject,
        startDateTime,
        endDateTime,
        description
      );
      
      console.log('📝 FORM_DEBUG: Event creation result:', eventId);
      
      if (eventId) {
        console.log('📝 FORM_DEBUG: Event created successfully, resetting form');
        // Reset form
        setFormData({
          meetingType: 'טלפון',
          sessionTypeId: getDefaultSessionType().id.toString(), // Reset to default
          meetingWith: '',
          customMeetingWith: '',
          subject: '',
          date: '',
          startTime: '',
          endTime: '',
          description: ''
        });
      }
    } catch (error: any) {
      console.error('📝 FORM_DEBUG: Error creating event:', error);
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

  const handleAddPatient = async (patientData: Omit<Patient, 'id'>): Promise<boolean> => {
    try {
      const supabase = supabaseClient();
      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (error) throw error;

      // Refresh the patients list
      await queryClient.invalidateQueries({ queryKey: ['patients'] });

      // Auto-select the newly created patient
      setFormData(prev => ({
        ...prev,
        meetingWith: data.id.toString()
      }));

      toast({
        title: 'לקוח נוסף בהצלחה',
        description: 'הלקוח החדש נוסף למערכת ונבחר אוטומטיט',
      });

      return true;
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast({
        title: 'שגיאה בהוספת לקוח',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get today's date for the date input minimum
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
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
              <Label htmlFor="meetingType">סוג פגישה *</Label>
              <Select value={formData.meetingType} onValueChange={(value) => handleInputChange('meetingType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג פגישה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="זום">זום</SelectItem>
                  <SelectItem value="טלפון">טלפון</SelectItem>
                  <SelectItem value="פגישה פרונטלית">פגישה פרונטלית</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.meetingType !== 'אחר' && (
              <>
                <div>
                  <Label htmlFor="sessionType">סוג טיפול *</Label>
                  <Select 
                    value={formData.sessionTypeId} 
                    onValueChange={(value) => handleInputChange('sessionTypeId', value)}
                    disabled={isLoadingSessionTypes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingSessionTypes ? "טוען סוגי טיפול..." : "בחר סוג טיפול"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionTypes.map((sessionType) => (
                        <SelectItem key={sessionType.id} value={sessionType.id.toString()}>
                          {sessionType.name} ({sessionType.duration_minutes} דקות)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="meetingWith">פגישה עם *</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.meetingWith} 
                      onValueChange={(value) => handleInputChange('meetingWith', value)}
                      disabled={isLoadingPatients}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoadingPatients ? "טוען לקוחות..." : "בחר לקוח"} />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAddPatientDialogOpen(true)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {formData.meetingType === 'אחר' && (
              <div>
                <Label htmlFor="customMeetingWith">נושא פגישה *</Label>
                <Input
                  id="customMeetingWith"
                  value={formData.customMeetingWith}
                  onChange={(e) => handleInputChange('customMeetingWith', e.target.value)}
                  placeholder="הנושא יתמלא אוטומטי לפי הבחירות"
                  required
                />
              </div>
            )}
            
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
                  readOnly={formData.meetingType !== 'אחר' && Boolean(formData.meetingWith)}
                  className={formData.meetingType !== 'אחר' && formData.meetingWith ? 'bg-gray-50' : ''}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">הערות נוספות (אופציונלי)</Label>
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

      <AddPatientDialog
        isOpen={addPatientDialogOpen}
        onClose={() => setAddPatientDialogOpen(false)}
        onAddPatient={handleAddPatient}
      />
    </>
  );
}
