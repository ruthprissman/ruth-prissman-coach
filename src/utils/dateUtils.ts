
/**
 * Converts a JavaScript Date to a Hebrew date string
 * @param date JavaScript Date object
 * @returns Hebrew date string (e.g., "כ"ד תשרי תשפ"ה")
 */
export const convertToHebrewDate = (date: Date): string => {
  try {
    // Format the date to Hebrew using Intl.DateTimeFormat with the Hebrew calendar
    const options: Intl.DateTimeFormatOptions = {
      calendar: 'hebrew',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    
    // Get Hebrew date string
    let hebrewDate = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', options).format(date);
    
    // Clean up the format to match the desired output format: כ"ד תשרי תשפ"ה
    // Replace the day number with day number + quotation mark
    hebrewDate = hebrewDate.replace(/(\d+)/, '$1"');
    
    return hebrewDate;
  } catch (error) {
    console.error('Error converting to Hebrew date:', error);
    return '';
  }
};
