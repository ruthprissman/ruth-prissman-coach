
/**
 * Utility to detect meeting icon based on summary/description/type.
 * Works for any string and is language-agnostic.
 */
export function getMeetingIcon(summaryOrType: string = ""): string | undefined {
  const str = summaryOrType.trim().toLowerCase();

  console.log(`[ICON_DEBUG] getMeetingIcon: input="${summaryOrType}" -> normalized="${str}"`);

  // Check if this starts with SEFT lightning icon
  if (summaryOrType.startsWith('⚡')) {
    console.log(`[ICON_DEBUG] getMeetingIcon: Found lightning icon at start -> SEFT`);
    return "⚡";
  }

  // Check if this is a "פגישה עם..." type meeting
  if (str.startsWith('פגישה עם')) {
    if (str.includes('3') || str.includes('ספט') || str.includes('seft')) {
      console.log(`[ICON_DEBUG] getMeetingIcon: Found SEFT indicators in "פגישה עם" -> SEFT`);
      return "⚡";
    }
    if (str.includes('2') || str.includes('אינטייק') || str.includes('intake')) {
      console.log(`[ICON_DEBUG] getMeetingIcon: Found intake indicators -> intake`);
      return "📝";
    }
    console.log(`[ICON_DEBUG] getMeetingIcon: Regular "פגישה עם" -> regular`);
    return "⭐"; // Gold star icon
  }

  // Check for SEFT indicators anywhere in the text
  if (str.includes('⚡') || str.includes('3') || str.includes('ספט') || str.includes('seft')) {
    console.log(`[ICON_DEBUG] getMeetingIcon: Found SEFT indicators anywhere -> SEFT`);
    return "⚡";
  }
  
  // Check for intake indicators
  if (str.includes('2') || str.includes('אינטייק') || str.includes('intake')) {
    console.log(`[ICON_DEBUG] getMeetingIcon: Found intake indicators -> intake`);
    return "📝";
  }
  
  // Check if it's any kind of meeting (contains "פגישה" or "עם")
  if (str.includes('פגישה') || str.includes('עם')) {
    console.log(`[ICON_DEBUG] getMeetingIcon: Found general meeting indicators -> regular`);
    return "⭐"; // Gold star icon
  }

  console.log(`[ICON_DEBUG] getMeetingIcon: No specific indicators found -> undefined`);
  return undefined;
}

/**
 * Get meeting icon based on numeric session type ID.
 * Maps session_type_id to appropriate icons.
 */
export function getMeetingIconByTypeId(sessionTypeId: number | null | undefined): string {
  console.log(`[ICON_DEBUG] getMeetingIconByTypeId: sessionTypeId=${sessionTypeId}`);
  
  if (sessionTypeId === 1) {
    console.log(`[ICON_DEBUG] getMeetingIconByTypeId: Type 1 -> regular`);
    return '⭐'; // regular
  }
  if (sessionTypeId === 2) {
    console.log(`[ICON_DEBUG] getMeetingIconByTypeId: Type 2 -> intake`);
    return '📝'; // intake
  }
  if (sessionTypeId === 3) {
    console.log(`[ICON_DEBUG] getMeetingIconByTypeId: Type 3 -> SEFT`);
    return '⚡'; // seft
  }
  
  console.log(`[ICON_DEBUG] getMeetingIconByTypeId: Unknown type -> default regular`);
  return '⭐'; // default fallback
}

/**
 * Determine if a session is SEFT based on summary text
 */
export function isSeftSession(summary: string = ""): boolean {
  const str = summary.trim().toLowerCase();
  
  // Check if starts with SEFT lightning icon
  if (summary.startsWith('⚡')) {
    console.log(`[ICON_DEBUG] isSeftSession: Starts with ⚡ -> true`);
    return true;
  }
  
  // Check for SEFT indicators
  const isSeft = str.includes('⚡') || str.includes('3') || str.includes('ספט') || str.includes('seft');
  console.log(`[ICON_DEBUG] isSeftSession: summary="${summary}" -> ${isSeft}`);
  
  return isSeft;
}

/**
 * Determine if a session is a patient meeting based on summary text
 */
export function isPatientMeeting(summary: string = ""): boolean {
  const str = summary.trim().toLowerCase();
  
  // Check if starts with any session type icon followed by meeting text
  const startsWithIcon = summary.startsWith('⚡') || summary.startsWith('📝') || summary.startsWith('⭐');
  const hasPatientMeetingText = str.includes('פגישה עם') || str.includes('עם');
  
  // Traditional "פגישה עם" format
  const isTraditionalFormat = str.startsWith('פגישה עם');
  
  const isPatient = isTraditionalFormat || (startsWithIcon && hasPatientMeetingText);
  console.log(`[ICON_DEBUG] isPatientMeeting: summary="${summary}" -> ${isPatient} (traditional=${isTraditionalFormat}, icon=${startsWithIcon}, text=${hasPatientMeetingText})`);
  
  return isPatient;
}
