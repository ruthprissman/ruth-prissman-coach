
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

/**
 * Publish article to WhatsApp
 * Note: This is a placeholder method, actual implementation TBD
 */
private async publishToWhatsApp(article: PublishReadyArticle): Promise<void> {
  // Placeholder for WhatsApp publication logic
  console.log(`WhatsApp publication for article ${article.id} not yet implemented`);
}

/**
 * Mark a publication as complete
 */
private async markPublicationAsDone(publicationId: number): Promise<void> {
  try {
    const supabaseClient = this.accessToken 
      ? getSupabaseWithAuth(this.accessToken)
      : supabase;
    
    const { error } = await supabaseClient
      .from('article_publications')
      .update({ published_date: new Date().toISOString() })
      .eq('id', publicationId);
    
    if (error) throw error;
    
    console.log(`Publication ${publicationId} marked as published`);
  } catch (error) {
    console.error(`Error marking publication ${publicationId} as done:`, error);
    throw error;
  }
}

/**
 * Retry a failed publication
 */
public async retryPublication(publicationId: number): Promise<void> {
  try {
    const supabaseClient = this.accessToken 
      ? getSupabaseWithAuth(this.accessToken)
      : supabase;
    
    // Get the publication details
    const { data: publication, error: pubError } = await supabaseClient
      .from('article_publications')
      .select(`
        *,
        professional_content:content_id (
          id,
          title,
          content_markdown,
          category_id,
          contact_email
        )
      `)
      .eq('id', publicationId)
      .single();
    
    if (pubError || !publication) {
      throw pubError || new Error(`Publication ${publicationId} not found`);
    }
    
    const professionalContent = publication.professional_content as unknown as ProfessionalContent;
    
    if (!professionalContent) {
      throw new Error(`Missing content for publication ${publicationId}`);
    }
    
    // Create a publish-ready article object
    const article: PublishReadyArticle = {
      id: professionalContent.id,
      title: professionalContent.title,
      content_markdown: professionalContent.content_markdown,
      category_id: professionalContent.category_id,
      contact_email: professionalContent.contact_email,
      article_publications: [publication]
    };
    
    // Reset the publication status
    await supabaseClient
      .from('article_publications')
      .update({ published_date: null })
      .eq('id', publicationId);
    
    // Republish based on the location
    switch (publication.publish_location) {
      case 'Website':
        await this.publishToWebsite(article.id);
        break;
        
      case 'Email':
        await this.publishToEmail(article);
        break;
        
      case 'WhatsApp':
        await this.publishToWhatsApp(article);
        break;
        
      default:
        throw new Error(`Unknown publication location: ${publication.publish_location}`);
    }
    
    // Mark as published
    await this.markPublicationAsDone(publicationId);
    
    console.log(`Publication ${publicationId} successfully retried`);
    
  } catch (error) {
    console.error(`Error retrying publication ${publicationId}:`, error);
    throw error;
  }
}
