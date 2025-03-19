
/**
 * Helper class to generate email HTML content
 * Uses string concatenation instead of template literals to avoid issues
 */
export class EmailGenerator {
  /**
   * Format URL to ensure it's valid
   * @param url URL string to format
   * @returns Properly formatted URL
   */
  public formatUrl(url: string | null): string | null {
    if (!url) return null;
    
    url = url.trim();
    
    // Check if it's an email address
    if (url.includes('@') && !url.startsWith('mailto:')) {
      return 'mailto:' + url;
    }
    
    // Check if it's a WhatsApp number
    if (url.includes('whatsapp') || url.startsWith('+') || 
        url.startsWith('972') || url.match(/^\d{10,15}$/)) {
      
      // Extract only numbers
      const phoneNumber = url.replace(/\D/g, '');
      
      // Make sure it starts with country code
      const formattedNumber = phoneNumber.startsWith('972') 
        ? phoneNumber 
        : '972' + (phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber);
      
      return 'https://wa.me/' + formattedNumber;
    }
    
    // Add https:// if missing for regular URLs
    if (!url.startsWith('http://') && !url.startsWith('https://') && 
        !url.startsWith('mailto:') && !url.startsWith('#')) {
      return 'https://' + url;
    }
    
    return url;
  }

  /**
   * Generate email links in HTML with proper styling
   */
  public generateEmailLinks(staticLinks: any[]): string[] {
    return staticLinks.map(link => {
      const formattedUrl = this.formatUrl(link.url);
      
      // Special handling for WhatsApp link with icon
      if (link.name === 'whatsapp') {
        return '<p style="text-align: center; margin: 10px 0;"><a href="' + formattedUrl + 
               '" style="font-family: \'Alef\', sans-serif; font-weight: bold; color: #4A148C; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); display: inline-flex; align-items: center; justify-content: center;">' +
               '<svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" style="margin-left: 5px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>' +
               link.fixed_text + '</a></p>';
      }
      
      // Regular link
      return '<p style="text-align: center; margin: 10px 0;"><a href="' + formattedUrl + 
             '" style="font-family: \'Alef\', sans-serif; font-weight: bold; color: #4A148C; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);">' + 
             link.fixed_text + '</a></p>';
    });
  }

  /**
   * Generate email HTML for an article
   */
  public generateEmailHtml(title: string, content: string, staticLinks: any[]): string {
    // Create email HTML using string concatenation instead of template literals
    let emailHtml = '<!DOCTYPE html>\n<html dir="rtl" lang="he">\n<head>\n';
    emailHtml += '<meta charset="UTF-8">\n';
    emailHtml += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    emailHtml += '<title>' + title + '</title>\n';
    emailHtml += '<style>\n';
    emailHtml += 'body { font-family: \'Alef\', Arial, sans-serif; direction: rtl; text-align: right; line-height: 1.6; color: #333; }\n';
    emailHtml += '.container { max-width: 600px; margin: 0 auto; padding: 20px; }\n';
    emailHtml += '.header { border-bottom: 2px solid #4a5568; padding-bottom: 15px; margin-bottom: 20px; text-align: center; }\n';
    emailHtml += '.content { line-height: 1.6; margin-bottom: 20px; }\n';
    emailHtml += '.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px; text-align: center; }\n';
    emailHtml += '</style>\n';
    emailHtml += '</head>\n<body>\n<div class="container">\n';
    
    // Header
    emailHtml += '<div class="header">\n';
    emailHtml += '<h1 style="color: #2d3748; font-size: 24px; margin-bottom: 8px;">' + title + '</h1>\n';
    emailHtml += '<p style="color: #718096; font-size: 14px;">נשלח מאת: רות פריסמן</p>\n';
    emailHtml += '</div>\n';
    
    // Content
    emailHtml += '<div class="content">\n';
    emailHtml += this.formatContentForEmail(content);
    emailHtml += '</div>\n';
    
    // Links
    if (staticLinks && staticLinks.length > 0) {
      emailHtml += '<div class="links">\n';
      const linkHtmlArray = this.generateEmailLinks(staticLinks);
      emailHtml += linkHtmlArray.join('\n');
      emailHtml += '</div>\n';
    }
    
    // Footer
    emailHtml += '<div class="footer">\n';
    emailHtml += '<p>נשלח באמצעות מערכת הפרסום האוטומטית.</p>\n';
    emailHtml += '<p>© רות פריסמן ' + new Date().getFullYear() + '</p>\n';
    emailHtml += '</div>\n';
    
    // Close tags
    emailHtml += '</div>\n</body>\n</html>';
    
    return emailHtml;
  }

  /**
   * Format content for email
   */
  private formatContentForEmail(markdown: string): string {
    // Replace newlines with <br>
    let formatted = markdown.replace(/\n/g, '<br>');
    
    // Replace markdown headers
    formatted = formatted.replace(/^# (.*?)$/gm, '<h1 style="color: #2d3748; font-size: 22px;">$1</h1>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h2 style="color: #2d3748; font-size: 20px;">$1</h2>');
    formatted = formatted.replace(/^### (.*?)$/gm, '<h3 style="color: #2d3748; font-size: 18px;">$1</h3>');
    
    // Replace links
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #4299e1; text-decoration: none;">$1</a>');
    
    // Replace bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Add WhatsApp icon to all WhatsApp links
    formatted = formatted.replace(/<a href="(https:\/\/wa\.me\/.*?)"(.*?)>(.*?)<\/a>/g, 
      '<a href="$1"$2 style="display: inline-flex; align-items: center;"><svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" style="margin-left: 5px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>$3</a>');
    
    return formatted;
  }
}
