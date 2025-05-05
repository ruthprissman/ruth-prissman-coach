
/**
 * Utility functions for working with Google Calendar integration
 */

import { CalendarSlot } from "@/types/calendar";
import { toast } from "@/components/ui/use-toast";

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

