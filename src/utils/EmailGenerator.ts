import { marked } from 'marked';
import DOMPurify from 'dompurify';

export class EmailGenerator {
  /**
   * Generate HTML email content from article data
   * @param article The article data
   * @returns HTML email content
   */
  public async generateEmailContent(article: {
    title: string;
    content: string;
    staticLinks?: Array<{
      id: number;
      name: string;
      url: string | null;
      fixed_text: string | null;
      list_type: string | null;
    }>;
  }): Promise<string> {
    // Process the markdown content
    const htmlContent = await this.markdownToHtml(article.content);
    
    // Generate the links section
    const linksSection = this.generateLinksSection(article.staticLinks || []);
    
    // Check if there are any hardcoded email addresses in the template
    const emailTemplate = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${article.title}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f4f4f4; 
            margin: 0; 
            padding: 0; 
            direction: rtl;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1); 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px; 
            border-bottom: 2px solid #e0e0e0; 
          }
          .title { 
            color: #2c3e50; 
            font-size: 24px; 
            margin-bottom: 10px; 
          }
          .content { 
            font-size: 16px; 
            line-height: 1.8; 
            margin-bottom: 30px; 
          }
          .footer { 
            text-align: center; 
            padding-top: 20px; 
            border-top: 1px solid #e0e0e0; 
            font-size: 14px; 
            color: #666; 
          }
          .footer a { 
            color: #3498db; 
            text-decoration: none; 
          }
          .links-section { 
            margin: 20px 0; 
            padding: 15px; 
            background-color: #f8f9fa; 
            border-radius: 5px; 
          }
          .links-section h3 { 
            color: #2c3e50; 
            margin-bottom: 10px; 
          }
          .links-section ul { 
            list-style-type: none; 
            padding: 0; 
          }
          .links-section li { 
            margin: 5px 0; 
          }
          .links-section a { 
            color: #3498db; 
            text-decoration: none; 
          }
          .unsubscribe { 
            margin-top: 20px; 
            font-size: 12px; 
            color: #999; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">${article.title}</h1>
            <p style="color: #666;">מאת: רות פריסמן - קוד הנפש</p>
          </div>
          
          <div class="content">
            ${htmlContent}
          </div>
          
          ${linksSection}
          
          <div class="footer">
            <p>ברכה והערכה,<br>רות פריסמן</p>
            <p>
              <a href="mailto:ruth@ruthprissman.co.il">ruth@ruthprissman.co.il</a> | 
              <a href="https://ruthprissman.co.il">ruthprissman.co.il</a>
            </p>
            
            <div class="unsubscribe">
              <p>אם אינך מעוניינת לקבל עוד מיילים, 
                <a href="https://ruthprissman.co.il/unsubscribe">לחצי כאן להסרה מהרשימה</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return emailTemplate;
  }

  /**
   * Convert markdown content to HTML
   * @param markdown Markdown content
   * @returns HTML content
   */
  private async markdownToHtml(markdown: string): Promise<string> {
    // Use marked to convert markdown to HTML
    const html = await marked(markdown, { breaks: true });

    // Sanitize the HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(html);
    
    return sanitizedHtml;
  }

  /**
   * Generate links section HTML
   * @param staticLinks Array of static links
   * @returns HTML for the links section
   */
  private generateLinksSection(staticLinks: Array<{
    id: number;
    name: string;
    url: string | null;
    fixed_text: string | null;
    list_type: string | null;
  }>): string {
    if (!staticLinks || staticLinks.length === 0) {
      return '';
    }

    let linksHtml = '<div class="links-section">';
    linksHtml += '<h3>קישורים מומלצים:</h3>';
    linksHtml += '<ul>';

    for (const link of staticLinks) {
      if (link.url) {
        linksHtml += `<li><a href="${link.url}">${link.name}</a></li>`;
      } else if (link.fixed_text) {
        linksHtml += `<li>${link.fixed_text}</li>`;
      }
    }

    linksHtml += '</ul>';
    linksHtml += '</div>';

    return linksHtml;
  }
}
