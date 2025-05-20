
/**
 * Utility functions for working with Google Calendar integration
 */

import { CalendarSlot, GoogleCalendarEvent } from "@/types/calendar";
import { toast } from "@/components/ui/use-toast";
import { supabaseClient } from "@/lib/supabaseClient";
import { FutureSession } from "@/types/session";

type CreateEventFunction = (
  summary: string,
  startDateTime: string,
  endDateTime: string,
  description?: string
) => Promise<string | null>;

/**
 * Add a future session from the database to Google Calendar
 * 
 * @param slot The calendar slot containing the future session data
 * @param createEventFn The function to create a Google Calendar event
 * @returns Promise<boolean> True if successful, false otherwise
 */
export async function addFutureSessionToGoogleCalendar(
  slot: CalendarSlot, 
  createEventFn: CreateEventFunction
): Promise<boolean> {
  try {
    console.log("Adding future session to Google Calendar:", slot);
    
    if (!slot.futureSession) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף פגישה ליומן, חסר מידע",
        variant: "destructive"
      });
      return false;
    }
    
    // Format the date and time for Google Calendar
    const sessionDate = new Date(slot.futureSession.session_date);
    const startDateTime = sessionDate.toISOString();
    
    // Calculate end time (assuming 90 minute sessions)
    const endDateTime = new Date(sessionDate.getTime() + (90 * 60000)).toISOString();
    
    // Create event summary - use notes if available, or a default "Patient Meeting"
    let summary = "פגישה עם לקוח";
    
    if (slot.notes) {
      // Keep the existing notes
      summary = slot.notes;
    } else if (slot.futureSession.patient_id) {
      // If we have a patient ID but no notes
      summary = "פגישה עם לקוח";
    }
    
    // Create a description that includes the meeting type
    const meetingType = slot.futureSession.meeting_type || "לא צוין";
    const description = `סוג פגישה: ${getMeetingTypeInHebrew(meetingType)}\nפגישה שהתווספה מלוח הפגישות`;
    
    // Create the event in Google Calendar
    const eventId = await createEventFn(summary, startDateTime, endDateTime, description);
    
    if (eventId) {
      toast({
        title: "הפגישה נוספה בהצלחה",
        description: "הפגישה נוספה ליומן Google שלך",
      });
      return true;
    } else {
      throw new Error("לא הצלחנו ליצור את האירוע ביומן");
    }
  } catch (error: any) {
    console.error("Error adding future session to Google Calendar:", error);
    toast({
      title: "שגיאה בהוספת הפגישה ליומן",
      description: error.message,
      variant: "destructive"
    });
    return false;
  }
}

/**
 * Extract client name from Google Calendar event title
 * 
 * @param title The meeting title from Google Calendar
 * @returns The extracted client name or null if not found
 */
export function extractClientNameFromTitle(title: string): string | null {
  if (!title) return null;
  
  console.log(`MEETING_COPY_LOG: Extracting client name from title: "${title}"`);
  
  // Pattern 1: "פגישה עם [שם]"
  let match = title.match(/פגישה עם\s+(.+?)($|\s*-)/i);
  console.log(`MEETING_COPY_LOG: Pattern 1 match:`, match ? match[1] : "No match");
  
  // Pattern 2: "פגישה - [שם]" or "פגישה- [שם]"
  if (!match) {
    match = title.match(/פגישה\s*-\s*(.+?)($|\s*-)/i);
    console.log(`MEETING_COPY_LOG: Pattern 2 match:`, match ? match[1] : "No match");
  }
  
  // Return the captured name if found
  const result = match ? match[1].trim() : null;
  console.log(`MEETING_COPY_LOG: Final extracted client name:`, result);
  return result;
}

/**
 * Copy selected professional meetings from Google Calendar to future sessions table
 * 
 * @param googleEvents Array of Google Calendar events
 * @param selectedEventIds Array of selected event IDs to copy
 * @param clientMapping Object mapping event IDs to client IDs
 * @returns Promise<{ added: number, skipped: number }> Count of added and skipped events
 */
export async function copyProfessionalMeetingsToFutureSessions(
  googleEvents: GoogleCalendarEvent[],
  selectedEventIds?: string[],
  clientMapping?: Record<string, number | null>
): Promise<{ added: number, skipped: number }> {
  try {
    console.log("MEETING_COPY_LOG: ====== STARTING COPY PROCESS ======");
    console.log(`MEETING_COPY_LOG: Total Google events received: ${googleEvents.length}`);
    console.log(`MEETING_COPY_LOG: Selected events count: ${selectedEventIds?.length || 'all'}`);
    console.log(`MEETING_COPY_LOG: Client mapping received:`, clientMapping || 'none');
    
    const supabase = await supabaseClient();
    const stats = { added: 0, skipped: 0 };
    
    // Get existing future sessions to avoid duplicates
    console.log("MEETING_COPY_LOG: Fetching existing future sessions...");
    const { data: existingSessions, error: fetchError } = await supabase
      .from('future_sessions')
      .select('session_date');
    
    if (fetchError) {
      console.error("MEETING_COPY_LOG: Error fetching existing sessions:", fetchError);
      throw new Error(`שגיאה בטעינת פגישות קיימות: ${fetchError.message}`);
    }
    
    // Convert existing session dates to a format we can compare with
    const existingSessionDates = new Set(
      existingSessions?.map(session => {
        // Create a date object and strip the time portion for comparison
        const dateOnly = new Date(session.session_date);
        dateOnly.setHours(0, 0, 0, 0);
        return dateOnly.toISOString().split('T')[0];
      }) || []
    );
    
    console.log(`MEETING_COPY_LOG: Found ${existingSessionDates.size} existing future sessions`);
    console.log("MEETING_COPY_LOG: Existing dates:", Array.from(existingSessionDates));
    
    // Filter Google events that are professional meetings (contain "פגישה עם" in the title)
    // and are within the next two weeks
    const now = new Date();
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    console.log("MEETING_COPY_LOG: Filtering professional meetings...");
    let professionalMeetings = googleEvents.filter(event => {
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
        console.log(`MEETING_COPY_LOG: Event "${event.summary}" on ${eventDate?.toLocaleString()} - Is professional: ${isProfessionalMeeting}, Within period: ${isWithinTwoWeeks}, INCLUDE: ${result}`);
      }
      
      return result;
    });
    
    // If we have selected event IDs, filter by them
    if (selectedEventIds && selectedEventIds.length > 0) {
      console.log(`MEETING_COPY_LOG: Further filtering by ${selectedEventIds.length} selected event IDs`);
      const beforeCount = professionalMeetings.length;
      
      professionalMeetings = professionalMeetings.filter(meeting => 
        selectedEventIds.includes(meeting.id)
      );
      
      console.log(`MEETING_COPY_LOG: After filtering by selected IDs: ${professionalMeetings.length} meetings (removed ${beforeCount - professionalMeetings.length})`);
      console.log("MEETING_COPY_LOG: Selected event IDs:", selectedEventIds);
    }
    
    console.log(`MEETING_COPY_LOG: Found ${professionalMeetings.length} professional meetings to process`);
    
    // Process each professional meeting
    for (const meeting of professionalMeetings) {
      console.log(`MEETING_COPY_LOG: ---- Processing meeting: "${meeting.summary}" (ID: ${meeting.id}) ----`);
      
      if (!meeting.start?.dateTime) {
        console.log(`MEETING_COPY_LOG: SKIPPING - Meeting without start time: "${meeting.summary}"`);
        stats.skipped++;
        continue;
      }
      
      const meetingDate = new Date(meeting.start.dateTime);
      const meetingDateStr = meetingDate.toISOString().split('T')[0];
      
      console.log(`MEETING_COPY_LOG: Meeting date: ${meetingDate.toLocaleString()}, date key: ${meetingDateStr}`);
      
      // Skip if we already have a session on this date
      // This is a simple check - you might want to make it more precise by checking time too
      if (existingSessionDates.has(meetingDateStr)) {
        console.log(`MEETING_COPY_LOG: SKIPPING - Session already exists on date ${meetingDateStr}`);
        stats.skipped++;
        continue;
      }
      
      // Create a new future session from the Google Calendar event
      const newSession: Partial<FutureSession> = {
        session_date: meeting.start.dateTime,
        meeting_type: 'In-Person', // Default to in-person
        status: 'Scheduled',
      };
      
      console.log(`MEETING_COPY_LOG: Created new session object for ${meetingDate.toLocaleString()}`);
      
      // Add patient_id if we have a client mapping
      if (clientMapping && meeting.id in clientMapping) {
        // Use the mapped client ID (could be null)
        newSession.patient_id = clientMapping[meeting.id];
        console.log(`MEETING_COPY_LOG: Using mapped client ID: ${newSession.patient_id} for meeting ID: ${meeting.id}`);
      } else {
        // Legacy fallback: Try to extract client name and search for patient
        const clientName = extractClientNameFromTitle(meeting.summary || '');
        
        if (clientName) {
          console.log(`MEETING_COPY_LOG: No direct mapping, trying to find patient by extracted name: "${clientName}"`);
          // Try to find the patient in the database
          const { data: matchingPatients, error: patientError } = await supabase
            .from('patients')
            .select('id, name')
            .ilike('name', `%${clientName}%`)
            .limit(1);
          
          if (patientError) {
            console.log(`MEETING_COPY_LOG: Error finding patient:`, patientError);
          }
          
          if (!patientError && matchingPatients && matchingPatients.length > 0) {
            newSession.patient_id = matchingPatients[0].id;
            console.log(`MEETING_COPY_LOG: Patient match found for "${clientName}": ${matchingPatients[0].name} (ID: ${matchingPatients[0].id})`);
          } else {
            console.log(`MEETING_COPY_LOG: No patient found for name "${clientName}"`);
          }
        } else {
          console.log(`MEETING_COPY_LOG: Could not extract client name from title: "${meeting.summary}"`);
        }
      }
      
      // Try to determine meeting type from description
      if (meeting.description) {
        console.log(`MEETING_COPY_LOG: Checking description for meeting type hints: "${meeting.description.substring(0, 50)}..."`);
        if (meeting.description.includes('זום') || meeting.description.includes('Zoom')) {
          newSession.meeting_type = 'Zoom';
          console.log(`MEETING_COPY_LOG: Set meeting type to Zoom based on description`);
        } else if (meeting.description.includes('טלפון') || meeting.description.includes('Phone')) {
          newSession.meeting_type = 'Phone';
          console.log(`MEETING_COPY_LOG: Set meeting type to Phone based on description`);
        }
      }
      
      console.log(`MEETING_COPY_LOG: Final session object before insert:`, {
        session_date: newSession.session_date,
        meeting_type: newSession.meeting_type,
        status: newSession.status,
        patient_id: newSession.patient_id
      });
      
      // Insert the new session
      console.log(`MEETING_COPY_LOG: Attempting to insert session into future_sessions table...`);
      const { error: insertError, data: insertedData } = await supabase
        .from('future_sessions')
        .insert(newSession)
        .select();
      
      if (insertError) {
        console.error(`MEETING_COPY_LOG: ERROR INSERTING - ${insertError.message}`, insertError);
        console.error(`MEETING_COPY_LOG: Failed session data:`, newSession);
        stats.skipped++;
      } else {
        console.log(`MEETING_COPY_LOG: SUCCESS - Added meeting to future sessions: "${meeting.summary}" on ${meetingDate.toLocaleDateString()}${
          newSession.patient_id ? ` with patient ID: ${newSession.patient_id}` : ' without patient ID'
        }`);
        console.log(`MEETING_COPY_LOG: Inserted row:`, insertedData);
        stats.added++;
      }
    }
    
    console.log(`MEETING_COPY_LOG: ====== FINISHED COPY PROCESS ======`);
    console.log(`MEETING_COPY_LOG: Final stats - Added: ${stats.added}, Skipped: ${stats.skipped}`);
    return stats;
  } catch (error: any) {
    console.error("MEETING_COPY_LOG: CRITICAL ERROR:", error);
    toast({
      title: "שגיאה בהעתקת פגישות",
      description: error.message,
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Convert meeting type to Hebrew
 */
function getMeetingTypeInHebrew(type: string): string {
  const types: Record<string, string> = {
    'Zoom': 'זום',
    'Phone': 'טלפון',
    'In-Person': 'פגישה פרונטלית',
    'Private': 'זמן פרטי'
  };
  return types[type] || type;
}
