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
 * Copy selected professional meetings from Google Calendar to future sessions table
 * 
 * @param googleEvents Array of Google Calendar events
 * @param selectedEventIds Array of selected event IDs to copy
 * @returns Promise<{ added: number, skipped: number }> Count of added and skipped events
 */
export async function copyProfessionalMeetingsToFutureSessions(
  googleEvents: GoogleCalendarEvent[],
  selectedEventIds?: string[]
): Promise<{ added: number, skipped: number }> {
  try {
    console.log("Starting to copy professional meetings from Google Calendar", googleEvents.length);
    
    const supabase = await supabaseClient();
    const stats = { added: 0, skipped: 0 };
    
    // Get existing future sessions to avoid duplicates
    const { data: existingSessions, error: fetchError } = await supabase
      .from('future_sessions')
      .select('session_date');
    
    if (fetchError) {
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
    
    console.log(`Found ${existingSessionDates.size} existing future sessions`);
    
    // Filter Google events that are professional meetings (contain "פגישה עם" in the title)
    // and are within the next two weeks
    const now = new Date();
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    
    let professionalMeetings = googleEvents.filter(event => {
      // Check if it's a professional meeting
      const isProfessionalMeeting = event.summary && 
        event.summary.includes("פגישה עם");
      
      // Check if it's within the next two weeks
      const eventDate = event.start?.dateTime ? new Date(event.start.dateTime) : null;
      const isWithinTwoWeeks = eventDate && 
        eventDate >= now && 
        eventDate <= twoWeeksLater;
      
      return isProfessionalMeeting && isWithinTwoWeeks;
    });
    
    // If we have selected event IDs, filter by them
    if (selectedEventIds && selectedEventIds.length > 0) {
      professionalMeetings = professionalMeetings.filter(meeting => 
        selectedEventIds.includes(meeting.id)
      );
    }
    
    console.log(`Found ${professionalMeetings.length} professional meetings within the next two weeks${selectedEventIds ? ' (filtered by selection)' : ''}`);
    
    // Process each professional meeting
    for (const meeting of professionalMeetings) {
      if (!meeting.start?.dateTime) {
        console.log("Skipping meeting without start time:", meeting.summary);
        stats.skipped++;
        continue;
      }
      
      const meetingDate = new Date(meeting.start.dateTime);
      const meetingDateStr = meetingDate.toISOString().split('T')[0];
      
      // Skip if we already have a session on this date
      // This is a simple check - you might want to make it more precise by checking time too
      if (existingSessionDates.has(meetingDateStr)) {
        console.log(`Skipping meeting on ${meetingDateStr} - session already exists`);
        stats.skipped++;
        continue;
      }
      
      // Create a new future session from the Google Calendar event
      const newSession: Partial<FutureSession> = {
        session_date: meeting.start.dateTime,
        meeting_type: 'In-Person', // Default to in-person
        status: 'Scheduled',
      };
      
      // Try to determine meeting type from description
      if (meeting.description) {
        if (meeting.description.includes('זום') || meeting.description.includes('Zoom')) {
          newSession.meeting_type = 'Zoom';
        } else if (meeting.description.includes('טלפון') || meeting.description.includes('Phone')) {
          newSession.meeting_type = 'Phone';
        }
      }
      
      // Insert the new session
      const { error: insertError } = await supabase
        .from('future_sessions')
        .insert(newSession);
      
      if (insertError) {
        console.error(`Error adding meeting to future sessions: ${insertError.message}`, meeting);
        stats.skipped++;
      } else {
        console.log(`Added meeting to future sessions: ${meeting.summary} on ${meetingDate.toLocaleDateString()}`);
        stats.added++;
      }
    }
    
    console.log("Finished copying professional meetings", stats);
    return stats;
  } catch (error: any) {
    console.error("Error copying professional meetings:", error);
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
