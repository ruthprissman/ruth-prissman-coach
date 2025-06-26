
/**
 * Utility to detect meeting icon based on summary/description/type.
 * Works for any string and is language-agnostic.
 */
export function getMeetingIcon(summaryOrType: string = ""): string | undefined {
  const str = summaryOrType.trim().toLowerCase();

  // Check if this is a "פגישה עם..." type meeting
  if (str.startsWith('פגישה עם')) {
    if (str.includes('seft') || str.includes('ספט')) return "⚡";
    if (str.includes('intake') || str.includes('אינטייק')) return "📝";
    return "⭐"; // Gold star icon
  }

  // Fallback: check for keywords in any meeting
  if (str.includes('seft') || str.includes('ספט')) return "⚡";
  if (str.includes('intake') || str.includes('אינטייק')) return "📝";
  if (str.includes('פגישה')) return "⭐"; // Gold star icon

  return undefined;
}

/**
 * Get meeting icon based on numeric session type ID.
 * Maps session_type_id to appropriate icons.
 */
export function getMeetingIconByTypeId(sessionTypeId: number | null | undefined): string {
  if (sessionTypeId === 1) return '⭐'; // regular
  if (sessionTypeId === 2) return '📝'; // intake
  if (sessionTypeId === 3) return '⚡'; // seft
  return '⭐'; // default fallback
}
