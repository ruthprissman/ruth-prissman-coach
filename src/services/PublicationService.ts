
  /**
   * Generate email links in HTML with proper styling
   * @param staticLinks Array of static links
   * @returns Array of formatted HTML links
   */
  private generateEmailLinks(staticLinks: StaticLink[]): string[] {
    return staticLinks.map(link => {
      const formattedUrl = this.formatUrl(link.url);
      
      // Special handling for WhatsApp link with icon
      if (link.name === 'whatsapp') {
        return `
          <p style="text-align: center; margin: 15px 0;">
            <a href="${formattedUrl}" 
               style="font-family: 'Alef', sans-serif; font-weight: bold; color: #4A148C; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">
              ${link.fixed_text}
              <span style="margin-right: 8px; display: inline-block;">
                <img src="https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/whatsapp-icon.png" 
                     alt="WhatsApp" width="24" height="24" style="vertical-align: middle; border: none;" />
              </span>
            </a>
          </p>
        `;
      }
      
      // Regular link with URL
      if (formattedUrl && link.fixed_text) {
        return `
          <p style="text-align: center; margin: 15px 0;">
            <a href="${formattedUrl}" 
               style="font-family: 'Alef', sans-serif; font-weight: bold; color: #4A148C; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); font-size: 18px;">
              ${link.fixed_text}
            </a>
          </p>
        `;
      } else if (link.fixed_text) {
        // Display plain text as bold paragraph when no URL
        return `
          <p style="text-align: center; margin: 15px 0; font-family: 'Alef', sans-serif; font-weight: bold; color: #4A148C; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); font-size: 18px;">
            ${link.fixed_text}
          </p>
        `;
      }
      
      return '';
    }).filter(link => link !== '');
  }
