
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
    return "👤";
  }

  // Fallback: check for keywords in any meeting
  if (str.includes('seft') || str.includes('ספט')) return "⚡";
  if (str.includes('intake') || str.includes('אינטייק')) return "📝";
  if (str.includes('פגישה')) return "👤";

  return undefined;
}
