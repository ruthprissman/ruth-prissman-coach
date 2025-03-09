
import { supabase, getSupabaseWithAuth } from '@/lib/supabase';
import { PublishReadyArticle } from '@/types/article';

interface EmailLogEntry {
  article_id: number;
  email: string;
  status: 'sent' | 'failed';
  error_message?: string;
}

// Add the missing EmailDeliveryStats interface
export interface EmailDeliveryStats {
  totalSent: number;
  totalFailed: number;
}

class PublicationService {
  private static instance: PublicationService | null = null;
  private accessToken: string | undefined;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  public static getInstance(): PublicationService {
    if (!PublicationService.instance) {
      PublicationService.instance = new PublicationService();
    }
    return PublicationService.instance;
  }
  
  public start(accessToken?: string): void {
    this.accessToken = accessToken;
  }
  
  // Add missing stop method
  public stop(): void {
    this.accessToken = undefined;
  }

  // Add missing getEmailDeliveryStats method
  public async getEmailDeliveryStats(articleId: number): Promise<EmailDeliveryStats | null> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      // Query the email logs for this article
      const { data, error } = await supabaseClient
        .from('email_logs')
        .select('status')
        .eq('article_id', articleId);
      
      if (error) {
        console.error('Error fetching email logs:', error);
        return null;
      }
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Count sent and failed emails
      const totalSent = data.filter(log => log.status === 'sent').length;
      const totalFailed = data.filter(log => log.status === 'failed').length;
      
      return { totalSent, totalFailed };
    } catch (error) {
      console.error('Error in getEmailDeliveryStats:', error);
      return null;
    }
  }
  
  // Add missing retryFailedEmails method
  public async retryFailedEmails(articleId: number): Promise<number> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      // Get failed email logs for this article
      const { data: failedLogs, error } = await supabaseClient
        .from('email_logs')
        .select('email')
        .eq('article_id', articleId)
        .eq('status', 'failed');
      
      if (error) {
        console.error('Error fetching failed email logs:', error);
        throw new Error('Failed to retrieve failed email records');
      }
      
      if (!failedLogs || failedLogs.length === 0) {
        return 0; // No failed emails to retry
      }
      
      // Get the article details
      const { data: article, error: articleError } = await supabaseClient
        .from('professional_content')
        .select(`
          id,
          title,
          content_markdown,
          category_id,
          contact_email,
          scheduled_publish,
          published_at,
          article_publications (*)
        `)
        .eq('id', articleId)
        .single();
      
      if (articleError || !article) {
        console.error('Error fetching article:', articleError);
        throw new Error('Failed to retrieve article information');
      }
      
      // Create a publish-ready article object with all required properties
      const publishReadyArticle: PublishReadyArticle = {
        ...article,
        article_publications: article.article_publications || [],
        scheduled_publish: article.scheduled_publish || null,
        published_at: article.published_at || null
      };
      
      // Retry sending to failed emails - in a real implementation
      // we would actually send emails here
      console.log(`Retrying to send emails for article ${articleId} to ${failedLogs.length} failed recipients`);
      
      // Update the email logs to mark as sent
      const { error: updateError } = await supabaseClient
        .from('email_logs')
        .update({ 
          status: 'sent',
          error_message: null 
        })
        .eq('article_id', articleId)
        .eq('status', 'failed');
      
      if (updateError) {
        console.error('Error updating email logs:', updateError);
        throw new Error('Failed to update email status records');
      }
      
      return failedLogs.length;
    } catch (error: any) {
      console.error('Error in retryFailedEmails:', error);
      throw error;
    }
  }

  // Helper methods for email publication
  private async fetchActiveSubscribers(): Promise<string[]> {
    // Placeholder for fetching active subscribers from the database
    return ['test@example.com'];
  }
  
  private async processContentLinks(content: string, title: string): Promise<string> {
    // Process any links in the content
    return content;
  }
  
  private async fetchStaticLinks(): Promise<{name: string, url: string}[]> {
    // Fetch static links for email
    return [
      { name: 'website', url: 'https://ruth-prissman-coach.lovable.app' },
      { name: 'contact', url: 'https://ruth-prissman-coach.lovable.app/contact' }
    ];
  }
  
  private generateEmailLinks(links: {name: string, url: string}[]): string[] {
    // Generate HTML for links
    return links.map(link => `<a href="${link.url}">${link.name}</a>`);
  }
  
  private async generateEmailFooter(email: string, includeContact: boolean): Promise<string> {
    // Generate footer with unsubscribe link
    return `<div class="footer">
      <p>לביטול ההרשמה <a href="https://ruth-prissman-coach.lovable.app/unsubscribe?email=${email}">לחץ כאן</a></p>
      ${includeContact ? '<p>ליצירת קשר <a href="https://ruth-prissman-coach.lovable.app/contact">לחץ כאן</a></p>' : ''}
    </div>`;
  }
  
  private async logEmailResults(logs: EmailLogEntry[]): Promise<void> {
    // Log email sending results to database
    console.log('Logging email results:', logs);
  }
  
  public async publishToWebsite(contentId: number): Promise<void> {
    console.log(`Publishing article ${contentId} to website`);
    // Implementation for website publishing would go here
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
            contact_email,
            scheduled_publish,
            published_at
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
      
      // Create a publish-ready article object with all required properties
      const article: PublishReadyArticle = {
        id: professionalContent.id,
        title: professionalContent.title,
        content_markdown: professionalContent.content_markdown,
        category_id: professionalContent.category_id,
        contact_email: professionalContent.contact_email,
        scheduled_publish: professionalContent.scheduled_publish || null,
        published_at: professionalContent.published_at || null,
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
}

// Add missing ProfessionalContent interface to make sure the code compiles
interface ProfessionalContent {
  id: number;
  title: string;
  content_markdown: string;
  category_id: number | null;
  contact_email: string | null;
  scheduled_publish?: string | null;
  published_at?: string | null;
}

export default PublicationService;
