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

/**
 * Publish article to email subscribers
 */
private async publishToEmail(article: PublishReadyArticle): Promise<void> {
  try {
    console.log(`Starting email publication process for article ${article.id}`);
    
    // 1. Fetch active email subscribers from the database
    const subscriberEmails = await this.fetchActiveSubscribers();
    
    if (subscriberEmails.length === 0) {
      console.log("No active subscribers found. Skipping email sending.");
      return;
    }
    
    console.log(`Preparing to send email for article ${article.id} to ${subscriberEmails.length} active subscribers.`);
    
    // 2. Format the email content with HTML
    const truncatedContent = article.content_markdown.slice(0, 500) + 
      (article.content_markdown.length > 500 ? '...' : '');
    
    // Process content to add formatting
    const processedContent = await this.processContentLinks(truncatedContent, article.title);
    
    // Convert newlines to HTML breaks
    const formattedMarkdown = processedContent.replace(/\n/g, '<br/>');
    
    // Fetch static links for the email body - ONLY PLACE we fetch static links
    const staticLinks = await this.fetchStaticLinks();
    const emailBodyLinks = this.generateEmailLinks(staticLinks);
    
    // Check if a contact link exists in the static links
    const hasContactLink = staticLinks.some(link => link.name === 'contact');
    
    // Create email logs array for batch insertion
    const emailLogs: EmailLogEntry[] = [];
    
    // Send individual emails to each subscriber
    for (const recipientEmail of subscriberEmails) {
      try {
        // Generate footer with personalized unsubscribe link and contact link only if needed
        const emailFooter = await this.generateEmailFooter(recipientEmail, !hasContactLink);
        
        const readMoreUrl = `https://ruth-prissman-coach.lovable.app/articles/${article.id}`;
        
        const emailContent = `
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${article.title}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Alef:wght@400;700&family=Heebo:wght@300;400;500;700&display=swap');
                
                body {
                  font-family: 'Heebo', sans-serif;
                  line-height: 1.8;
                  color: #4A148C;
                  text-align: center;
                  background-color: transparent;
                }
                
                h1, h2, h3, h4, a, .title {
                  font-family: 'Alef', sans-serif;
                  font-weight: 700;
                }
                
                p {
                  margin-bottom: 16px;
                  text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);
                }
                
                a {
                  color: #4A148C;
                  font-weight: bold;
                  text-decoration: none;
                  text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);
                  font-family: 'Alef', sans-serif;
                  font-size: 18px;
                }
                
                .content-wrapper {
                  padding: 30px 20px;
                  background-color: transparent;
                }
                
                .title {
                  color: #4A148C;
                  margin: 0;
                  font-size: 28px;
                  font-weight: 700;
                  font-family: 'Alef', sans-serif;
                  text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);
                  padding: 20px;
                  text-align: center;
                }
                
                .content {
                  font-size: 16px;
                  margin-bottom: 20px;
                  line-height: 1.8;
                  font-family: 'Heebo', sans-serif;
                }
                
                .cta-button {
                  background-color: #4A148C;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 4px;
                  font-weight: bold;
                  display: inline-block;
                  margin: 20px 0;
                  text-shadow: none;
                  font-family: 'Alef', sans-serif;
                  font-size: 18px;
                }
                
                .link-section {
                  margin: 30px 0;
                }
                
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid rgba(74, 20, 140, 0.2);
                }
              </style>
            </head>
            <body>
              <div class="content-wrapper">
                <h1 class="title">${article.title}</h1>
                
                <div class="content" dir="rtl">
                  ${formattedMarkdown}
                </div>
                
                <a href="${readMoreUrl}" class="cta-button">
                  להמשך קריאה
                </a>
                
                <div class="link-section">
                  ${emailBodyLinks.join('')}
                </div>
                
                ${emailFooter}
              </div>
            </body>
          </html>
        `;
        
        // Implementation for sending email via edge function would go here
        // For now, just log a success
        console.log(`Email prepared for ${recipientEmail}`);
        
        // Add successful email to logs
        emailLogs.push({
          article_id: article.id,
          email: recipientEmail,
          status: 'sent'
        });
        
      } catch (emailError: any) {
        console.error(`Error preparing email for ${recipientEmail}:`, emailError);
        
        // Add failed email to logs
        emailLogs.push({
          article_id: article.id,
          email: recipientEmail,
          status: 'failed',
          error_message: emailError.message || 'Unknown error preparing email'
        });
      }
    }
    
    // Log all email results to database
    await this.logEmailResults(emailLogs);
    
    console.log(`Email publication process completed for article ${article.id}`);
    
  } catch (error) {
    console.error(`Error in publishToEmail for article ${article.id}:`, error);
    throw error;
  }
}
