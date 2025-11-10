import { processEmailContent } from './contentFormatter';

/**
 * Generator for email HTML content
 */
export class EmailGenerator {
  /**
   * Generate email HTML content
   * 
   * @param options Options for email generation
   * @returns The generated HTML content
   */
  public async generateEmailContent(options: {
    title: string;
    content: string;
    staticLinks?: Array<{id: number, fixed_text: string, url: string}>;
    image_url?: string | null;
  }): Promise<string> {
    // Ensure all inputs are strings
    const safeTitle = String(options.title || '');
    const safeContent = String(options.content || '');
    
    console.log('[EmailGenerator] Starting to generate email with title:', safeTitle);
    console.log('[EmailGenerator] Content length:', safeContent.length);
    console.log('[EmailGenerator] Static links:', options.staticLinks?.length || 0);
    console.log('[EmailGenerator] DEBUGGING IMAGE URL:', options.image_url);
    console.log('[EmailGenerator] IMAGE URL TYPE:', typeof options.image_url);
    console.log('[EmailGenerator] IMAGE URL TRUTHY?:', !!options.image_url);
    
    // Check for potential problematic characters in the title
    const problematicCharsRegex = /[^\w\s\u0590-\u05FF\u200f\u200e\-:,.?!]/g;
    const problematicChars = safeTitle.match(problematicCharsRegex);
    if (problematicChars) {
      console.warn('[EmailGenerator] Warning: Title contains potentially problematic characters:', 
        problematicChars.join(', '), 
        'at positions:', 
        problematicChars.map(c => safeTitle.indexOf(c))
      );
    }
    
    // Safe title handling - ensure we have valid text
    const safeTitleForHtml = this.escapeHtml(safeTitle || 'No Title');
    
    // Using string concatenation instead of template literals to avoid issues
    let html = '<!DOCTYPE html>';
    html += '<html dir="rtl" lang="he">';
    html += '<head>';
    html += '<meta charset="UTF-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    html += '<title>' + safeTitleForHtml + '</title>';
    html += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
    html += '<!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge" /><!--<![endif]-->';
    html += '</head>';
    
    // Background image wrapper with local font stack
    html += '<body style="background-color: #f9f9f9; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; direction: rtl; text-align: center; font-family: \'Rubik\',\'Heebo\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif; line-height: 1.7; color: #4A148C;">';
    html += '<!--[if mso]>';
    html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="background-color: #f9f9f9;">';
    html += '<tr>';
    html += '<td style="background-image: url(\'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/email-background.jpg\'); background-repeat: no-repeat; background-size: cover; background-position: center; background-attachment: fixed; width: 100%; height: 100%;">';
    html += '<![endif]-->';
    
    // Non-Outlook version
    html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" background="https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/email-background.jpg" style="background-image: linear-gradient(0deg, rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url(\'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/email-background.jpg\'); background-repeat: no-repeat; background-size: cover; background-position: center; background-attachment: fixed; width: 100%; height: 100%; padding: 20px 0;">' + '<tr><td align="center" valign="top">';
    
    // Table-based structure for better email client compatibility
    html += '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">';
    html += '<tr><td align="center" valign="top">';
    
    // Container
    html += '<div class="container">';
    
    // Add article image if provided - at the top, before header
    if (options.image_url) {
      console.log('[EmailGenerator] Adding image to email HTML:', options.image_url);
      
      html += '<div style="text-align: center; margin: 20px 0;">';
      html += '<img src="' + this.escapeHtml(options.image_url) + '" alt="' + safeTitleForHtml + '" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);" />';
      html += '</div>';
      console.log('[EmailGenerator] Image added to HTML with URL:', options.image_url);
    } else {
      console.log('[EmailGenerator] No image_url provided, skipping image');
    }

    // Header with safely escaped title - inline styles with local fonts
    html += '<div style="padding: 20px; text-align: center;">';
    html += '<h1 style="font-family: \'Alef\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif; font-size: 32px; line-height: 1.25; color: #4A148C; margin: 0 0 12px 0; font-weight: 700; text-align: center;">' + safeTitleForHtml + '</h1>';
    html += '</div>';
    
    // Content - process content with inline styles and local fonts
    html += '<div style="padding: 30px 20px; text-align: center; direction: rtl; font-family: \'Rubik\',\'Heebo\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif; font-size: 16px; line-height: 1.7; color: #4A148C;">';
    const processedContent = this.processContentForEmail(processEmailContent(safeContent));
    html += processedContent;
    html += '</div>';
    
    // Add static links if provided - with inline styles
    if (options.staticLinks && options.staticLinks.length > 0) {
      html += '<div style="padding: 20px; background-color: transparent; margin-top: 20px;">';
      html += this.generateEmailLinks(options.staticLinks);
      html += '</div>';
    }
    
    // Footer with inline styles and local fonts
    html += '<div style="padding: 20px; text-align: center; background-color: #f5f5f5;">';
    html += '<p style="margin: 5px 0; font-size: 14px; color: #4A148C; font-family: \'Rubik\',\'Heebo\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif; text-align: center;">נשלח באמצעות מערכת הפרסום האוטומטית.</p>';
    html += '<p style="margin: 5px 0; font-size: 14px; color: #4A148C; font-family: \'Rubik\',\'Heebo\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif; text-align: center;">&copy; ' + new Date().getFullYear() + ' רות פריסמן. כל הזכויות שמורות.</p>';
    html += '</div>';
    
    html += '</div>'; // container
    
    html += '</td></tr>';
    html += '</table>';
    
    html += '</td></tr></table>';
    
    // Close Outlook conditional
    html += '<!--[if mso]>';
    html += '</td>';
    html += '</tr>';
    html += '</table>';
    html += '<![endif]-->';
    
    html += '</body>';
    html += '</html>';
    
    // Convert any Supabase images to base64 for better email compatibility
    const finalHtml = await this.convertImagesToBase64(html);
    
    // Log information about the generated HTML
    const contentSize = new Blob([finalHtml]).size / 1024;
    console.log(`[EmailGenerator] Generated HTML content size: ${contentSize.toFixed(2)} KB`);
    
    // Check for overly large content
    if (contentSize > 100) {
      console.warn('[EmailGenerator] Warning: Email content is quite large:', contentSize.toFixed(2), 'KB');
    }
    
    return finalHtml;
  }
  
  /**
   * Process content for email to preserve meaningful line breaks only
   * 
   * @param content The content to process
   * @returns Processed content with proper line breaks
   */
  private processContentForEmail(content: string): string {
    if (!content) return '';
    
    // First handle double line breaks (paragraph breaks) - these should become <br><br>
    let processedContent = content.replace(/\n\s*\n/g, '<br><br>');
    
    // Then handle single line breaks - these should become just a space (word wrap)
    processedContent = processedContent.replace(/\n/g, ' ');
    
    // Process links within the content
    const contentWithLinks = this.processLinksInParagraph(processedContent);
    
    return contentWithLinks;
  }
  
  /**
   * Process links within a paragraph
   * 
   * @param paragraph The paragraph content to process
   * @returns Processed paragraph with updated link styling
   */
  private processLinksInParagraph(paragraph: string): string {
    let processedParagraph = paragraph;
    
    // Replace markdown links with HTML links that use Heebo font
    processedParagraph = processedParagraph.replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, url) => {
      // Check if link text has punctuation and should break
      const hasPunctuation = /[,.?!;:]/.test(linkText);
      let processedLinkText = this.escapeHtml(linkText);
      
      if (hasPunctuation) {
        // Find the last punctuation mark and split there
        const punctuationMatch = processedLinkText.match(/^(.*[,.?!;:])(.*)$/);
        if (punctuationMatch && punctuationMatch[2].trim()) {
          processedLinkText = punctuationMatch[1] + '<br>' + punctuationMatch[2].trim();
        }
      }
      
      const safeUrl = this.escapeHtml(url);
      
      // Check if it's a WhatsApp link - use local font stack
      if (url.startsWith('https://wa.me/')) {
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; color: #4A148C; font-weight: bold; text-decoration: none; font-family: 'Rubik','Heebo','Noto Sans Hebrew','Arial Hebrew','Segoe UI',Arial,Tahoma,sans-serif;"><svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" style="margin-left: 5px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>${processedLinkText}</a>`;
      } else {
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color: #4A148C; font-weight: bold; text-decoration: none; font-family: 'Rubik','Heebo','Noto Sans Hebrew','Arial Hebrew','Segoe UI',Arial,Tahoma,sans-serif;">${processedLinkText}</a>`;
      }
    });
    
    return processedParagraph;
  }
  
  /**
   * Generate HTML for email links
   * 
   * @param links Array of link objects
   * @returns Formatted HTML for links
   */
  private generateEmailLinks(links: Array<{id: number, fixed_text: string, url: string}>): string {
    console.log('[EmailGenerator] Received staticLinks:', JSON.stringify(links, null, 2));
    
    if (!links || links.length === 0) {
      console.log('[EmailGenerator] No links provided or empty array');
      return '';
    }
    
    let linksHtml = '';
    console.log(`[EmailGenerator] Processing ${links.length} links`);
    
    for (const link of links) {
      try {
        console.log('[EmailGenerator] Processing link:', JSON.stringify(link, null, 2));
        
        // Skip empty links
        if (!link.fixed_text) {
          console.log('[EmailGenerator] Skipping link with empty text');
          continue;
        }
        
        // Check for punctuation marks that should trigger line breaks
        let linkText = this.escapeHtml(link.fixed_text);
        
        // Add line breaks after punctuation marks
        linkText = linkText.replace(/([,.?!;:])\s*/g, '$1<br>');
        
        // Start paragraph tag with inline styles using local fonts
        linksHtml += '<p style="font-family: \'Alef\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif; font-size: 16px; text-align: center; margin-bottom: 20px; color: #4A148C; font-weight: bold; direction: rtl; line-height: 1.6;">';
        
        // Check if it's a WhatsApp link
        if (link.url && link.url.startsWith('https://wa.me/')) {
          console.log('[EmailGenerator] Processing as WhatsApp link with icon');
          const safeUrl = this.escapeHtml(link.url);
          
          linksHtml += '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" ' +
                      'style="display: inline-flex; align-items: center; color: #4A148C; font-weight: bold; text-decoration: none; font-family: \'Alef\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif;">' +
                      '<svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" style="margin-left: 5px;">' +
                      '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>' +
                      '</svg>' + 
                      linkText + '</a>';
          console.log('[EmailGenerator] Generated WhatsApp link HTML');
        } 
        // Regular link with URL
        else if (link.url) {
          console.log('[EmailGenerator] Processing as regular link with URL:', link.url);
          const safeUrl = this.escapeHtml(link.url);
          
          linksHtml += '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" ' +
                      'style="color: #4A148C; font-weight: bold; text-decoration: none; font-family: \'Alef\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif;">' +
                      linkText + '</a>';
          console.log('[EmailGenerator] Generated regular link HTML');
        } 
        // Text only (no URL)
        else {
          console.log('[EmailGenerator] Processing as text-only (no URL)');
          linksHtml += '<strong style="color: #4A148C; font-family: \'Alef\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif; font-weight: bold;">' + 
                      linkText + '</strong>';
          console.log('[EmailGenerator] Generated text-only HTML');
        }
        
        // Close paragraph tag
        linksHtml += '</p>';
        console.log('[EmailGenerator] Completed HTML for this link');
      } catch (linkError) {
        console.error('[EmailGenerator] Error processing link:', linkError);
        // Continue with next link if one fails
      }
    }
    
    console.log('[EmailGenerator] Completed links array. Final HTML length:', linksHtml.length);
    return linksHtml;
  }
  
  /**
   * Format markdown to HTML
   * 
   * @param markdown Markdown content
   * @returns Formatted HTML
   */
  private formatMarkdown(markdown: string): string {
    if (!markdown) return '';
    
    let formatted = markdown;
    
    // Replace newlines with <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Replace headers
    formatted = formatted.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // Replace bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace links with local font stack
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="font-family: \'Rubik\',\'Heebo\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif; color: #4A148C; font-weight: bold; text-decoration: none;">$1</a>');
    
    // Special handling for WhatsApp links with local fonts
    formatted = formatted.replace(/<a href="(https:\/\/wa\.me\/.*?)"(.*?)>(.*?)<\/a>/g, 
      '<a href="$1"$2 style="display: inline-flex; align-items: center; font-family: \'Rubik\',\'Heebo\',\'Noto Sans Hebrew\',\'Arial Hebrew\',\'Segoe UI\',Arial,Tahoma,sans-serif; color: #4A148C; font-weight: bold; text-decoration: none;"><svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" style="margin-left: 5px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>$3</a>');
    
    return formatted;
  }
  
  /**
   * Convert Supabase image URLs to base64 for better email compatibility
   * Handles both img src and CSS background-image URLs
   * 
   * @param html HTML content with potential image URLs
   * @returns HTML with base64 images
   */
  private async convertImagesToBase64(html: string): Promise<string> {
    console.log('[EmailGenerator] Starting image conversion process...');
    console.log('[EmailGenerator] HTML length:', html.length);
    console.log('[EmailGenerator] Looking for Supabase URLs in HTML...');
    
    // More flexible regex that captures any Supabase storage URL
    const supabaseImageRegex = /https:\/\/uwqwlltrfvokjlaufguz\.supabase\.co\/storage\/v1\/object\/public\/[^"'\s)]+/gi;
    const matches = html.match(supabaseImageRegex);
    
    console.log('[EmailGenerator] Regex matches found:', matches);
    
    if (!matches || matches.length === 0) {
      console.log('[EmailGenerator] No Supabase images found in HTML content');
      // Let's also check for any Supabase URLs at all
      const anySupabaseUrl = html.match(/uwqwlltrfvokjlaufguz\.supabase\.co/gi);
      console.log('[EmailGenerator] Any Supabase URLs found:', anySupabaseUrl?.length || 0);
      return html;
    }

    console.log('[EmailGenerator] Found Supabase images to convert:', matches);
    
    let processedHtml = html;
    
    for (const imageUrl of matches) {
      try {
        // Skip background images as they are usually too large and cause stack overflow
        if (imageUrl.includes('email-background') || imageUrl.includes('background')) {
          console.log('[EmailGenerator] Skipping background image conversion:', imageUrl);
          continue;
        }
        
        console.log('[EmailGenerator] Converting image to base64:', imageUrl);
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          console.warn(`[EmailGenerator] Failed to fetch image: ${imageUrl}`, response.status, response.statusText);
          continue;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Get content type
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const base64DataUrl = `data:${contentType};base64,${base64}`;
        
        // Replace the URL in HTML - handles both img src and CSS background-image
        const escapedUrl = imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        processedHtml = processedHtml.replace(new RegExp(escapedUrl, 'g'), base64DataUrl);
        
        console.log(`[EmailGenerator] Successfully converted image: ${imageUrl} -> base64 (${base64.length} chars)`);
      } catch (error) {
        console.error(`[EmailGenerator] Error converting image ${imageUrl}:`, error);
      }
    }
    
    // Add additional debugging
    const hasImageTag = processedHtml.includes('<img');
    const hasBackgroundImage = processedHtml.includes('background-image:');
    const hasBase64 = processedHtml.includes('data:image');
    
    console.log('[EmailGenerator] Image conversion results:', {
      hasImageTag,
      hasBackgroundImage, 
      hasBase64,
      originalMatches: matches.length,
      processedHtmlLength: processedHtml.length
    });
    
    return processedHtml;
  }

  /**
   * Escape HTML special characters
   * 
   * @param text Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string | null | undefined): string {
    // Handle undefined or null values
    if (text === null || text === undefined) {
      return '';
    }
    
    // Convert to string if needed (in case it's a number or other type)
    const str = String(text);
    
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Create a singleton instance and export the function
const emailGenerator = new EmailGenerator();

export const generateEmailContent = async (article: { title: string; content_markdown: string; image_url?: string | null }, staticLinks?: Array<{id: number, fixed_text: string, url: string}>) => {
 
  return await emailGenerator.generateEmailContent({
    title: article.title,
    content: article.content_markdown,
    staticLinks: staticLinks,
    image_url: article.image_url
  });
};
