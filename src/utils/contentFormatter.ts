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
  
  // Replace lines that contain only ^^^ (with optional whitespace) with empty lines
  // This creates paragraph breaks where ^^^ markers appear
  const processedContent = content.replace(/^[ \t]*\^\^\^[ \t]*$/gm, '');
  
  return processedContent;
};

/**
 * Processes markdown content for display, handling ^^^ spacing markers
 * @param content The markdown content to process
 * @returns Processed content ready for display
 */
export const processMarkdownContent = (content: string): string => {
  if (!content) return '';
  
  return processContentSpacing(content);
};

/**
 * Processes content for email generation, handling ^^^ spacing markers
 * @param content The content to process for email
 * @returns Processed content ready for email
 */
export const processEmailContent = (content: string): string => {
  if (!content) return '';
  
  // First handle ^^^ markers by removing them and creating empty lines
  let processedContent = content.replace(/^[ \t]*\^\^\^[ \t]*$/gm, '\n');
  
  // Then handle double line breaks (paragraph breaks) - these should become <br><br>
  processedContent = processedContent.replace(/\n\s*\n/g, '<br><br>');
  
  // Then handle single line breaks - these should become just a space (word wrap)
  processedContent = processedContent.replace(/\n/g, ' ');
  
  return processedContent;
};