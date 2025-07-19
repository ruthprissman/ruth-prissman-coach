/**
 * Content formatter utilities for handling article content
 */

/**
 * Processes content to replace lines with ^^^ with empty lines for spacing
 * @param content The content to process
 * @returns Processed content with ^^^ lines converted to spacing
 */
export const processContentSpacing = (content: string): string => {
  if (!content) return '';
  
  console.log('[ContentFormatter] Original content:', content);
  console.log('[ContentFormatter] Looking for ^^^ patterns');
  
  // Multiple strategies to catch ^^^ patterns
  let processedContent = content;
  
  // Strategy 1: Lines that contain only ^^^ (with optional whitespace)
  processedContent = processedContent.replace(/^[ \t]*\^\^\^[ \t]*$/gm, '');
  
  // Strategy 2: ^^^ anywhere in a line (even with text around it)
  processedContent = processedContent.replace(/\^\^\^/g, '\n\n');
  
  // Strategy 3: Handle multiple consecutive newlines
  processedContent = processedContent.replace(/\n{3,}/g, '\n\n');
  
  console.log('[ContentFormatter] Processed content:', processedContent);
  console.log('[ContentFormatter] Content changed:', content !== processedContent);
  
  return processedContent;
};

/**
 * Processes markdown content for display, handling ^^^ spacing markers
 * @param content The markdown content to process
 * @returns Processed content ready for display
 */
export const processMarkdownContent = (content: string): string => {
  if (!content) return '';
  
  console.log('[processMarkdownContent] Processing content');
  const result = processContentSpacing(content);
  console.log('[processMarkdownContent] Result after processing:', result);
  
  return result;
};

/**
 * Processes content for email generation, handling ^^^ spacing markers
 * @param content The content to process for email
 * @returns Processed content ready for email
 */
export const processEmailContent = (content: string): string => {
  if (!content) return '';
  
  console.log('[EmailContent] Processing email content');
  
  // First handle ^^^ markers using the same strategy as regular content
  let processedContent = processContentSpacing(content);
  
  // Then handle double line breaks (paragraph breaks) - these should become <br><br>
  processedContent = processedContent.replace(/\n\s*\n/g, '<br><br>');
  
  // Then handle single line breaks - these should become just a space (word wrap)
  processedContent = processedContent.replace(/\n/g, ' ');
  
  console.log('[EmailContent] Final email content:', processedContent);
  
  return processedContent;
};