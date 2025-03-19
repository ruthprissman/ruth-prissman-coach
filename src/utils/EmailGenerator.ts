
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
  public generateEmailContent(options: {
    title: string;
    content: string;
    staticLinks?: Array<{id: number, title: string, url: string}>;
  }): string {
    // Using string concatenation instead of template literals to avoid issues
    let html = '<!DOCTYPE html>';
    html += '<html dir="rtl" lang="he">';
    html += '<head>';
    html += '<meta charset="UTF-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    html += '<title>' + this.escapeHtml(options.title) + '</title>';
    html += '<style>  @import url("https://fonts.googleapis.com/css2?family=Alef:wght@400;700&family=Heebo:wght@300;400;500;700&display=swap");';
    html += 'body { font-family: "Heebo", sans-serif;  line-height: 1.8;color: #4A148C;text-align: center;background-color: transparent;}';
    html += 'h1, h2, h3, h4, a, .title {font-family: "Alef", sans-serif;font-weight: 700;}'
    html += 'p {margin-bottom: 16px;text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);text-align: center !important;}';
    html += 'a {color: #4A148C;font-weight: bold;text-decoration: none;text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);font-family: "Alef", sans-serif;}';
    html += '.content-wrapper {padding: 30px 20px;background-color: transparent;text-align: center;}';
    html += '.title {color: #4A148C;margin: 0;font-size: 28px;font-weight: 700;font-family: "Alef", sans-serif;text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);padding: 20px;text-align: center;}';
    html += '.content {font-size: 16px;margin-bottom: 20px;line-height: 1.8;font-family: "Heebo", sans-serif;text-align: center !important;}';
    html += '.cta-button {background-color: #4A148C;color: white;padding: 12px 24px;text-decoration: none;border-radius: 4px;font-weight: bold;display: inline-block;margin: 20px 0;text-shadow: none;font-family: "Alef", sans-serif;}';
    html += '.link-section {margin: 30px 0; text-align: center; }';
    html += '.footer-link {display: block;margin: 10px 0;text-align: center;font-family: "Alef", sans-serif; font-weight: bold;color: #4A148C;text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);  }';
    html += '.copyright { font-size: 12px; margin-top: 20px; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);  font-family: Heebo", sans-serif;text-align: center; }';
    html += '@media only screen and (max-width: 620px) {.email-container { width: 100% !important; }.content-wrapper { padding: 15px 10px !important; .title { font-size: 22px !important; }.content, p, a {  font-size: 16px !important; }}';
    html += '</style>';
    html += '</head>';
    html += '<body>';
    html += '<div class="container">';
    
    // Header
    html += '<div class="header">';
    html += '<h1>' + this.escapeHtml(options.title) + '</h1>';
    html += '</div>';
    
    // Content
    html += '<div class="content">';
    html += options.content;//this.formatMarkdown(options.content);
    html += '</div>';
    
    // Add static links if provided
    if (options.staticLinks && options.staticLinks.length > 0) {
     // html += '<div class="links">';
    //  html += '<h3>קישורים מומלצים:</h3>';
    //  html += '<ul>';
      
      for (const link of options.staticLinks) {
        html += '<li><a href="' + this.escapeHtml(link.url) + '" target="_blank" rel="noopener noreferrer">' 
              + this.escapeHtml(link.title) + '</a></li>';
      }
      
      html += '</ul>';
      html += '</div>';
    }
    
    // Footer
    html += '<div class="footer">';
    html += '<p>נשלח באמצעות מערכת הפרסום האוטומטית.</p>';
    html += '<p>&copy; ' + new Date().getFullYear() + ' רות פריסמן. כל הזכויות שמורות.</p>';
    html += '</div>';
    
    html += '</div>'; // container
    html += '</body>';
    html += '</html>';
    
    return html;
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
    
    // Replace links
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Special handling for WhatsApp links
    formatted = formatted.replace(/<a href="(https:\/\/wa\.me\/.*?)"(.*?)>(.*?)<\/a>/g, 
      '<a href="$1"$2 style="display: inline-flex; align-items: center;"><svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" style="margin-left: 5px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>$3</a>');
    
    return formatted;
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
