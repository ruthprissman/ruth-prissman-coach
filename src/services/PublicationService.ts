
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
    console.log("PublicationService started with token:", accessToken ? "Token provided" : "No token");
    this.accessToken = accessToken;
  }
  
  // Add missing stop method
  public stop(): void {
    console.log("PublicationService stopped");
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
      console.log(`Retrying failed emails for article ${articleId} with auth token:`, this.accessToken ? "Token present" : "No token");
      
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
      
      // Call the publish to email function with the article and specific recipient list
      console.log(`Retrying to send emails for article ${articleId} to ${failedLogs.length} failed recipients`);
      
      // Call our email sending function with explicit authorization
      await this.publishToEmail(publishReadyArticle, failedLogs.map(log => log.email));
      
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
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
        
      // Get active subscribers from database
      const { data, error } = await supabaseClient
        .from('subscribers')
        .select('email')
        .eq('active', true);
        
      if (error) {
        console.error('Error fetching subscribers:', error);
        return ['test@example.com']; // Fallback for testing
      }
      
      if (!data || data.length === 0) {
        console.log('No active subscribers found');
        return ['test@example.com']; // Fallback for testing
      }
      
      return data.map(sub => sub.email);
    } catch (error) {
      console.error('Error in fetchActiveSubscribers:', error);
      return ['test@example.com']; // Fallback for testing
    }
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
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      // Insert email logs into database
      const { error } = await supabaseClient
        .from('email_logs')
        .insert(logs);
        
      if (error) {
        console.error('Error logging email results:', error);
      }
      
      console.log('Email logs saved:', logs.length);
    } catch (error) {
      console.error('Error in logEmailResults:', error);
    }
  }
  
  public async publishToWebsite(contentId: number): Promise<void> {
    console.log(`Publishing article ${contentId} to website`);
    // Implementation for website publishing would go here
  }

  /**
   * Publish article to email subscribers
   */
  private async publishToEmail(article: PublishReadyArticle, specificRecipients?: string[]): Promise<void> {
    try {
      console.log(`Starting email publication process for article ${article.id}`);
      console.log(`Authorization token status: ${this.accessToken ? 'Present' : 'Missing'}`);
      
      // Use provided recipients or fetch subscribers
      const subscriberEmails = specificRecipients || await this.fetchActiveSubscribers();
      
      if (subscriberEmails.length === 0) {
        console.log("No active subscribers found. Skipping email sending.");
        return;
      }
      
      console.log(`Preparing to send email for article ${article.id} to ${subscriberEmails.length} recipients.`);
      
      // 2. Format the email content with HTML
      const truncatedContent = article.content_markdown.slice(0, 500) + 
        (article.content_markdown.length > 500 ? '...' : '');
      
      // Process content to add formatting
      const processedContent = await this.processContentLinks(truncatedContent, article.title);
      
      // Convert newlines to HTML breaks
      const formattedMarkdown = processedContent.replace(/\n/g, '<br/>');
      
      // Fetch static links for the email body
      const staticLinks = await this.fetchStaticLinks();
      const emailBodyLinks = this.generateEmailLinks(staticLinks);
      
      // Check if a contact link exists in the static links
      const hasContactLink = staticLinks.some(link => link.name === 'contact');
      
      // Create email logs array for batch insertion
      const emailLogs: EmailLogEntry[] = [];
      
      // Call Supabase Edge Function to send emails
      try {
        const supabaseClient = this.accessToken 
          ? getSupabaseWithAuth(this.accessToken) 
          : supabase;
        
        console.log("Sending request with Authorization:", this.accessToken ? "Bearer token provided" : "No token");
        
        // IMPORTANT: Add explicit Authorization header for edge function
        const { data, error } = await supabaseClient.functions.invoke('send-emails', {
          body: {
            article: {
              id: article.id,
              title: article.title,
              content: formattedMarkdown,
              readMoreUrl: `https://ruth-prissman-coach.lovable.app/articles/${article.id}`
            },
            recipients: subscriberEmails
          },
          headers: this.accessToken ? {
            Authorization: `Bearer ${this.accessToken}`
          } : {}
        });
        
        if (error) {
          console.error('Error calling send-emails function:', error);
          throw error;
        }
        
        console.log('Email sending response:', data);
        
        // Log successful sends
        for (const email of subscriberEmails) {
          emailLogs.push({
            article_id: article.id,
            email,
            status: 'sent'
          });
        }
      } catch (err: any) {
        console.error('Error sending emails via edge function:', err);
        
        // Log failed sends
        for (const email of subscriberEmails) {
          emailLogs.push({
            article_id: article.id,
            email,
            status: 'failed'
          });
        }
        
        // Rethrow the error to be caught by the caller
        throw new Error(`Failed to send emails: ${err.message || 'Unknown error'}`);
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
      console.log(`Retrying publication ${publicationId} with auth token:`, this.accessToken ? "Token present" : "No token");
      
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
      
      // Reset the publication status temporarily to indicate we're processing
      await supabaseClient
        .from('article_publications')
        .update({ published_date: null })
        .eq('id', publicationId);
      
      // Republish based on the location
      try {
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
        
        // Only mark as published if successful
        await this.markPublicationAsDone(publicationId);
        console.log(`Publication ${publicationId} successfully retried`);
        
      } catch (error) {
        // If there's an error during publication, we need to update the UI
        console.error(`Error publishing to ${publication.publish_location}:`, error);
        // We rethrow here so the PublishModal can show the error
        throw error;
      }
      
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
