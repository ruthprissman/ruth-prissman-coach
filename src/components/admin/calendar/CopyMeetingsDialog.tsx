import React, { useState, useEffect } from 'react';
import { GoogleCalendarEvent } from '@/types/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { extractClientNameFromTitle } from '@/utils/googleCalendarUtils';
import { Patient } from '@/types/patient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabaseClient } from '@/lib/supabaseClient';
import { AlertCircle } from 'lucide-react';

interface CopyMeetingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  googleEvents: GoogleCalendarEvent[];
  onCopySelected: (selectedEventIds: string[], clientMapping: Record<string, number | null>) => Promise<any>;
  isLoading: boolean;
}

interface MeetingWithClientInfo {
  event: GoogleCalendarEvent;
  clientName: string | null;
  clientId: number | null;
  identified: boolean;
}

export function CopyMeetingsDialog({
  open,
  onOpenChange,
  googleEvents,
  onCopySelected,
  isLoading
}: CopyMeetingsDialogProps) {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [professionalMeetings, setProfessionalMeetings] = useState<MeetingWithClientInfo[]>([]);
  const [clientMapping, setClientMapping] = useState<Record<string, number | null>>({});
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState<boolean>(false);
  const [copyResult, setCopyResult] = useState<{
    added: number,
    skipped: number,
    reasons?: Record<string, string[]>
  } | null>(null);
  
  // Load all patients for dropdown selection
  useEffect(() => {
    if (open) {
      fetchPatients();
      // Reset copy result when dialog is opened
      setCopyResult(null);
    }
  }, [open]);

  const fetchPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const supabase = await supabaseClient();
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, email, notes, session_price')
        .order('name');
      
      if (error) throw error;
      
      // Ensure we have the required Patient properties by casting with defaults
      const patientsWithDefaults = (data || []).map(patient => ({
        id: patient.id,
        name: patient.name,
        phone: patient.phone || null,
        email: patient.email || null,
        notes: patient.notes || null,
        session_price: patient.session_price || null
      })) as Patient[];
      
      setPatients(patientsWithDefaults);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "שגיאה בטעינת רשימת לקוחות",
        description: "לא ניתן היה לטעון את רשימת הלקוחות",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPatients(false);
    }
  };
  
  // Filter professional meetings and try to identify clients
  useEffect(() => {
    const now = new Date();
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    console.log(`DIALOG_LOG: Starting to filter ${googleEvents.length} Google events for professional meetings`);
    
    // Filter Google events that are professional meetings (contain "פגישה עם" in the title)
    // and are within the next two weeks
    const filteredMeetings = googleEvents.filter(event => {
      // Check if it's a professional meeting
      const isProfessionalMeeting = event.summary && 
        (event.summary.includes("פגישה עם") || event.summary.includes("פגישה -"));
      
      // Check if it's within the next two weeks
      const eventDate = event.start?.dateTime ? new Date(event.start.dateTime) : null;
      const isWithinTwoWeeks = eventDate && 
        eventDate >= now && 
        eventDate <= twoWeeksLater;
      
      const result = isProfessionalMeeting && isWithinTwoWeeks;
      if (isProfessionalMeeting) {
        console.log(`DIALOG_LOG: Event "${event.summary}" on ${eventDate?.toLocaleString()} - Is professional: ${isProfessionalMeeting}, Within period: ${isWithinTwoWeeks}, INCLUDE: ${result}`);
      }
      
      return result;
    });
    
    console.log(`DIALOG_LOG: Found ${filteredMeetings.length} professional meetings`);
    
    // Try to identify clients in the meetings
    const meetingsWithClientInfo = filteredMeetings.map(meeting => {
      const clientName = extractClientNameFromTitle(meeting.summary || '');
      console.log(`DIALOG_LOG: Meeting "${meeting.summary}" - Extracted client name: "${clientName}"`);
      
      return {
        event: meeting,
        clientName,
        clientId: null, // Will be populated later
        identified: !!clientName
      };
    });
    
    setProfessionalMeetings(meetingsWithClientInfo);
    
    // By default, select all meetings
    const allIds = meetingsWithClientInfo.map(meeting => meeting.event.id);
    console.log(`DIALOG_LOG: Setting ${allIds.length} events as selected by default`);
    setSelectedEventIds(allIds);
  }, [googleEvents]);

  // Match client names to patients when patients are loaded
  useEffect(() => {
    if (patients.length > 0 && professionalMeetings.length > 0) {
      console.log(`DIALOG_LOG: Matching ${professionalMeetings.length} meetings to ${patients.length} patients`);
      
      const newMapping: Record<string, number | null> = {};
      const updatedMeetings = professionalMeetings.map(meeting => {
        if (meeting.clientName) {
          // Try to find an exact match first
          const exactMatch = patients.find(patient => 
            patient.name && patient.name.trim().toLowerCase() === meeting.clientName?.trim().toLowerCase()
          );
          
          // If no exact match, try to find a partial match
          const partialMatch = !exactMatch ? patients.find(patient => 
            patient.name && meeting.clientName && 
            (patient.name.includes(meeting.clientName) || meeting.clientName.includes(patient.name))
          ) : null;
          
          const matchedPatient = exactMatch || partialMatch;
          if (matchedPatient) {
            console.log(`DIALOG_LOG: Found match for "${meeting.clientName}" - ${matchedPatient.name} (ID: ${matchedPatient.id})`);
            newMapping[meeting.event.id] = matchedPatient.id;
            return {
              ...meeting,
              clientId: matchedPatient.id
            };
          } else {
            console.log(`DIALOG_LOG: No match found for "${meeting.clientName}"`);
          }
        }
        
        newMapping[meeting.event.id] = null;
        return meeting;
      });
      
      console.log(`DIALOG_LOG: Initial client mapping created:`, newMapping);
      setProfessionalMeetings(updatedMeetings);
      setClientMapping(newMapping);
    }
  }, [patients, professionalMeetings.length]);

  const handleToggleEvent = (eventId: string) => {
    setSelectedEventIds(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  const handleToggleAll = () => {
    if (selectedEventIds.length === professionalMeetings.length) {
      // Deselect all
      setSelectedEventIds([]);
    } else {
      // Select all
      setSelectedEventIds(professionalMeetings.map(meeting => meeting.event.id));
    }
  };

  const handleClientChange = (eventId: string, clientId: string) => {
    const numericClientId = clientId === "no_client" ? null : parseInt(clientId, 10);
    console.log(`DIALOG_LOG: Changed client for event ID ${eventId} to ${numericClientId === null ? 'null' : numericClientId}`);
    
    setClientMapping(prev => ({
      ...prev,
      [eventId]: numericClientId
    }));
    
    // Update the meeting in the state as well
    setProfessionalMeetings(prev => 
      prev.map(meeting => 
        meeting.event.id === eventId
          ? { ...meeting, clientId: numericClientId }
          : meeting
      )
    );
  };

  const handleCopySelected = async () => {
    if (selectedEventIds.length === 0) {
      toast({
        title: "לא נבחרו פגישות",
        description: "יש לבחור לפחות פגישה אחת להעתקה",
        variant: "destructive"
      });
      return;
    }
    
    // Filter client mapping to only include selected events
    const selectedMapping: Record<string, number | null> = {};
    selectedEventIds.forEach(id => {
      selectedMapping[id] = clientMapping[id];
    });
    
    console.log(`DIALOG_LOG: Sending ${selectedEventIds.length} selected events for copying`);
    console.log(`DIALOG_LOG: Selected event IDs:`, selectedEventIds);
    console.log(`DIALOG_LOG: Final client mapping:`, selectedMapping);
    
    try {
      // Execute the copy and store the extended result
      const result = await onCopySelected(selectedEventIds, selectedMapping);
      
      // If the result includes detailed reasons, we'll update our state
      if (result && typeof result === 'object') {
        setCopyResult(result);
      }
    } catch (error) {
      console.error("DIALOG_LOG: Error copying meetings:", error);
      // Keep dialog open to show errors
      return;
    }
    
    // Close dialog only if there were no errors
    onOpenChange(false);
  };

  // Render skip reasons if available
  const renderSkipReasons = () => {
    if (!copyResult?.reasons || Object.keys(copyResult.reasons).length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
        <div className="flex items-center gap-2 mb-2 text-orange-700">
          <AlertCircle className="h-4 w-4" />
          <h4 className="font-semibold">פגישות שדולגו ({copyResult.skipped}):</h4>
        </div>
        <ul className="text-xs text-orange-800 space-y-1 pr-5">
          {Object.entries(copyResult.reasons).map(([eventId, reasons]) => (
            <li key={eventId} className="list-disc">
              {reasons.map((reason, idx) => (
                <div key={`${eventId}-${idx}`}>{reason}</div>
              ))}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">העתקת פגישות מקצועיות מיומן Google</DialogTitle>
          <DialogDescription>
            פגישות שכוללות "פגישה עם" בכותרת בטווח של השבועיים הקרובים. סמן את הפגישות שתרצה להעתקה לטבלת פגישות עתידיות וניתן לבחור לקוח מתאים לכל פגישה.
          </DialogDescription>
        </DialogHeader>
        
        {copyResult && (
          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700">
              הועתקו {copyResult.added} פגישות בהצלחה, {copyResult.skipped} פגישות דולגו.
            </p>
            {renderSkipReasons()}
          </div>
        )}
        
        <div className="py-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-500">נמצאו {professionalMeetings.length} פגישות</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToggleAll}
            >
              {selectedEventIds.length === professionalMeetings.length ? 'בטל בחירה של הכל' : 'בחר הכל'}
            </Button>
          </div>
          
          <Separator className="my-2" />
          
          {professionalMeetings.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              לא נמצאו פגישות מקצועיות בטווח התאריכים
            </div>
          ) : (
            <div className="space-y-3">
              {professionalMeetings.map(meeting => {
                const meetingDate = meeting.event.start?.dateTime ? new Date(meeting.event.start.dateTime) : null;
                const formattedDate = meetingDate ? format(meetingDate, 'dd/MM/yyyy') : 'תאריך לא ידוע';
                const formattedTime = meetingDate ? format(meetingDate, 'HH:mm') : '';
                const isSelected = selectedEventIds.includes(meeting.event.id);
                
                return (
                  <div key={meeting.event.id} className={`flex flex-col p-2 ${isSelected ? 'bg-gray-50' : 'bg-gray-100'} rounded-md`}>
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center h-5 ml-4">
                        <Checkbox 
                          id={`meeting-${meeting.event.id}`} 
                          checked={selectedEventIds.includes(meeting.event.id)}
                          onCheckedChange={() => handleToggleEvent(meeting.event.id)}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{meeting.event.summary}</div>
                        <div className="text-sm text-gray-500">
                          {formattedDate} | {formattedTime}
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="mt-1 pl-9">
                        <div className="text-sm text-gray-700 mb-1">
                          לקוח: {meeting.clientName || "לא זוהה לקוח מהכותרת"}
                        </div>
                        
                        <Select
                          value={clientMapping[meeting.event.id]?.toString() || "no_client"}
                          onValueChange={(value) => handleClientChange(meeting.event.id, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="בחר לקוח" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no_client">ללא לקוח</SelectItem>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button 
            onClick={handleCopySelected} 
            disabled={selectedEventIds.length === 0 || isLoading || isLoadingPatients}
          >
            העתק {selectedEventIds.length} פגישות
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
