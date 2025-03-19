import { supabaseClient } from "@/lib/supabaseClient";
import { Article, ArticlePublication, ProfessionalContent } from "@/types/article";

/**
 * Interface for articles that are ready to be published
 */
interface PublishReadyArticle {
  id: number;
  title: string;
  content_markdown: string;
  category_id: number | null;
  contact_email: string | null;
  article_publications: ArticlePublication[];
}

/**
 * Interface for email subscriber
 */
interface EmailSubscriber {
  email: string;
}

/**
 * Interface for email log entry
 */
interface EmailLogEntry {
  article_id: number;
  email: string;
  status: 'sent' | 'failed';
  error_message?: string;
}

/**
 * Interface for email delivery stats
 */
export interface EmailDeliveryStats {
  articleId: number;
  totalSent: number;
  totalFailed: number;
}

/**
 * Interface for static link with updated fields
 */
interface StaticLink {
  id: number;
  name: string;
  fixed_text: string;
  url: string | null;
  position: number | null;
  list_type: 'all' | 'general' | 'newsletter' | 'whatsapp' | null;
  created_at: string;
}

/**
 * Service to handle article publications
 */
class PublicationService {
  private static instance: PublicationService;
  private timerId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkInterval = 60000; // Check every minute
  private accessToken?: string;
  private supabaseEdgeFunctionUrl: string = "https://uwqwlltrfvokjlaufguz.functions.supabase.co/send-email";
  private supabaseAnonKey: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8";

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): PublicationService {
    if (!PublicationService.instance) {
      PublicationService.instance = new PublicationService();
    }
    return PublicationService.instance;
  }

  /**
   * Start the publication service with the given access token
   */
  public start(accessToken?: string): void {
    this.accessToken = accessToken;
    
    if (this.isRunning) return;
    
    console.log("Publication service started");
    this.isRunning = true;
    
    // Check immediately on startup
    this.checkScheduledPublications();
    
    // Then set interval for future checks
    this.timerId = setInterval(() => {
      this.checkScheduledPublications();
    }, this.checkInterval);
  }

  /**
   * Stop the publication service
   */
  public stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    console.log("Publication service stopped");
  }

  /**
   * Check for articles that need to be published
   */
  private async checkScheduledPublications(): Promise<void> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;

      // Get current timestamp
      const now = new Date().toISOString();

      // Get all publications that are scheduled and not yet published
      const { data: scheduledPublications, error: publicationsError } = await supabaseClient
        .from('article_publications')
        .select(`
          id,
          content_id,
          publish_location,
          scheduled_date,
          professional_content:content_id (
            id,
            title,
            content_markdown,
            category_id,
            contact_email,
            published_at
          )
        `)
        .lte('scheduled_date', now)
        .is('published_date', null);

      if (publicationsError) {
        throw publicationsError;
      }

      if (!scheduledPublications || scheduledPublications.length === 0) {
        console.log("No publications scheduled for now");
        return;
      }

      console.log(`Found ${scheduledPublications.length} publications to process`);

      // Group by article to handle multiple publication locations for the same article
      const articlePublicationsMap = new Map<number, PublishReadyArticle>();
      
      for (const pub of scheduledPublications) {
        const articleId = pub.content_id;
        // Check if professional_content exists and is properly shaped
        const professionalContent = pub.professional_content as unknown as ProfessionalContent; 
        
        if (!professionalContent) {
          console.error(`Missing professional content for article ${articleId}`);
          continue;
        }
        
        if (!articlePublicationsMap.has(articleId)) {
          // Initialize with article data
          articlePublicationsMap.set(articleId, {
            id: articleId,
            title: professionalContent.title || "Untitled",
            content_markdown: professionalContent.content_markdown || "",
            category_id: professionalContent.category_id || null,
            contact_email: professionalContent.contact_email || null,
            article_publications: []
          });
        }
        
        // Add this publication to the article's publications
        const article = articlePublicationsMap.get(articleId);
        if (article) {
          article.article_publications.push({
            id: pub.id,
            content_id: pub.content_id,
            publish_location: pub.publish_location,
            scheduled_date: pub.scheduled_date,
            published_date: null
          });
        }
      }

      // Publish each article
      for (const [articleId, article] of articlePublicationsMap.entries()) {
        await this.publishArticle(article);
      }

    } catch (error) {
      console.error("Error checking scheduled publications:", error);
    }
  }

  /**
   * Publish an article to all scheduled locations
   */
  private async publishArticle(article: PublishReadyArticle): Promise<void> {
    const supabaseClient = this.accessToken 
      ? getSupabaseWithAuth(this.accessToken)
      : supabase;
    
    try {
      // First check if the article is already published on the website
      const { data: existingArticle } = await supabaseClient
        .from('professional_content')
        .select('published_at')
        .eq('id', article.id)
        .single();
      
      const needsWebsitePublishing = !existingArticle?.published_at;
      
      // Process each publication location
      for (const publication of article.article_publications) {
        try {
          switch (publication.publish_location) {
            case 'Website':
              if (needsWebsitePublishing) {
                await this.publishToWebsite(article.id);
              }
              break;
              
            case 'Email':
              await this.publishToEmail(article);
              break;
              
            case 'WhatsApp':
              await this.publishToWhatsApp(article);
              break;
              
            case 'Other':
              // Handle other publication types here
              break;
            
            default:
              console.log(`Unknown publication location: ${publication.publish_location}`);
          }
          
          // Mark this publication as published
          await this.markPublicationAsDone(publication.id);
          
        } catch (pubError) {
          console.error(`Error publishing article ${article.id} to ${publication.publish_location}:`, pubError);
          // Continue with other publications
        }
      }
      
    } catch (error) {
      console.error(`Error publishing article ${article.id}:`, error);
    }
  }

  /**
   * Publish article to the website by updating published_at
   */
  private async publishToWebsite(articleId: number): Promise<void> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      const { error } = await supabaseClient
        .from('professional_content')
        .update({ published_at: new Date().toISOString() })
        .eq('id', articleId);
      
      if (error) throw error;
      
      console.log(`Article ${articleId} published to website`);
      
    } catch (error) {
      console.error(`Error publishing article ${articleId} to website:`, error);
      throw error;
    }
  }

  /**
   * Fetch active email subscribers from the database
   * @returns Array of unique email addresses
   */
  private async fetchActiveSubscribers(): Promise<string[]> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      console.log("Fetching active subscribers from content_subscribers table");
      
      // Fetch only subscribed subscribers using the correct column name 'is_subscribed'
      const { data: subscribers, error } = await supabaseClient
        .from('content_subscribers')
        .select('email')
        .eq('is_subscribed', true);
      
      if (error) {
        console.error("Error fetching active email subscribers:", error);
        throw error;
      }
      
      if (!subscribers || subscribers.length === 0) {
        console.log("No active subscribers found in the database.");
        return [];
      }
      
      // Extract emails and remove duplicates
      const uniqueEmails = [...new Set(subscribers.map((sub: EmailSubscriber) => sub.email))];
      
      console.log(`Successfully fetched ${uniqueEmails.length} unique active subscribers.`);
      return uniqueEmails;
    } catch (error) {
      console.error("Error in fetchActiveSubscribers:", error);
      return [];
    }
  }

  /**
   * Remove failed email logs before inserting successful ones
   * @param articleId The article ID
   * @param emails Array of email addresses
   */
  private async cleanupFailedEmails(articleId: number, emails: string[]): Promise<void> {
    if (!emails || emails.length === 0) return;
    
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      console.log(`Cleaning up ${emails.length} failed email logs for article ${articleId}`);
      
      for (const email of emails) {
        const { error } = await supabaseClient
          .from('email_logs')
          .delete()
          .eq('article_id', articleId)
          .eq('email', email)
          .eq('status', 'failed');
        
        if (error) {
          console.error(`Error cleaning up failed email log for ${email}:`, error);
        }
      }
      
      console.log(`Cleanup completed for article ${articleId}`);
    } catch (error) {
      console.error(`Error in cleanupFailedEmails for article ${articleId}:`, error);
    }
  }

  /**
   * Log email sending status to email_logs table
   * @param logs Array of email log entries
   */
  private async logEmailResults(logs: EmailLogEntry[]): Promise<void> {
    if (!logs || logs.length === 0) return;
    
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      console.log(`Logging ${logs.length} email delivery results to email_logs table`);
      
      // Group logs by status for more efficient processing
      const successfulEmails = logs.filter(log => log.status === 'sent');
      const failedEmails = logs.filter(log => log.status === 'failed');
      
      // Clean up failed records for successfully sent emails
      if (successfulEmails.length > 0) {
        const articleId = successfulEmails[0].article_id;
        const emails = successfulEmails.map(log => log.email);
        await this.cleanupFailedEmails(articleId, emails);
      }
      
      const logsWithTimestamp = logs.map(log => ({
        ...log,
        sent_at: new Date().toISOString()
      }));
      
      const { error } = await supabaseClient
        .from('email_logs')
        .insert(logsWithTimestamp);
      
      if (error) {
        console.error("Error logging email results:", error);
        throw error;
      }
      
      // If we successfully sent all emails for an article, make sure the article is marked as published
      if (successfulEmails.length > 0 && failedEmails.length === 0) {
        const articleId = successfulEmails[0].article_id;
        
        // Check if there are any remaining failed emails for this article
        const { data: remainingFailedEmails, error: countError } = await supabaseClient
          .from('email_logs')
          .select('count')
          .eq('article_id', articleId)
          .eq('status', 'failed');
        
        if (!countError && (!remainingFailedEmails || remainingFailedEmails.length === 0)) {
          // No failed emails remain, ensure the article is marked as published
          await this.ensureArticleIsPublished(articleId);
        }
      }
      
      console.log(`Successfully logged ${logs.length} email results`);
    } catch (error) {
      console.error("Error in logEmailResults:", error);
    }
  }

  /**
   * Ensure that an article is marked as published
   */
  private async ensureArticleIsPublished(articleId: number): Promise<void> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      const { data, error } = await supabaseClient
        .from('professional_content')
        .select('published_at')
        .eq('id', articleId)
        .single();
      
      if (error) {
        console.error(`Error checking article ${articleId} publish status:`, error);
        return;
      }
      
      // If the article is not already published, mark it as published now
      if (!data.published_at) {
        const { error: updateError } = await supabaseClient
          .from('professional_content')
          .update({ published_at: new Date().toISOString() })
          .eq('id', articleId);
        
        if (updateError) {
          console.error(`Error updating article ${articleId} publish status:`, updateError);
        } else {
          console.log(`Article ${articleId} has been marked as published`);
        }
      }
    } catch (error) {
      console.error(`Error in ensureArticleIsPublished for article ${articleId}:`, error);
    }
  }

  /**
   * Fetch failed email recipients for an article
   * @param articleId The article ID
   * @returns Array of email addresses that failed
   */
  public async getFailedEmailRecipients(articleId: number): Promise<string[]> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      console.log(`Fetching failed email recipients for article ${articleId}`);
      
      const { data, error } = await supabaseClient
        .from('email_logs')
        .select('email')
        .eq('article_id', articleId)
        .eq('status', 'failed');
      
      if (error) {
        console.error("Error fetching failed recipients:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`No failed recipients found for article ${articleId}`);
        return [];
      }
      
      // Extract emails and remove duplicates
      const failedEmails = [...new Set(data.map(item => item.email))];
      console.log(`Found ${failedEmails.length} failed recipients for article ${articleId}`);
      
      return failedEmails;
    } catch (error) {
      console.error("Error in getFailedEmailRecipients:", error);
      return [];
    }
  }

  /**
   * Get email delivery statistics for an article
   * @param articleId The article ID
   * @returns Email delivery stats
   */
  public async getEmailDeliveryStats(articleId: number): Promise<EmailDeliveryStats | null> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      // First, check sent emails
      const { data: sentData, error: sentError } = await supabaseClient
        .from('email_logs')
        .select('count')
        .eq('article_id', articleId)
        .eq('status', 'sent')
        .limit(1)
        .single();
      
      if (sentError && sentError.code !== 'PGRST116') {
        // PGRST116 is 'no rows returned' error, which is fine
        console.error("Error fetching sent count:", sentError);
        throw sentError;
      }
      
      // Then, check failed emails
      const { data: failedData, error: failedError } = await supabaseClient
        .from('email_logs')
        .select('count')
        .eq('article_id', articleId)
        .eq('status', 'failed')
        .limit(1)
        .single();
      
      if (failedError && failedError.code !== 'PGRST116') {
        console.error("Error fetching failed count:", failedError);
        throw failedError;
      }
      
      const totalSent = sentData?.count || 0;
      const totalFailed = failedData?.count || 0;
      
      if (totalSent === 0 && totalFailed === 0) {
        return null; // No data available
      }
      
      return {
        articleId,
        totalSent,
        totalFailed
      };
    } catch (error) {
      console.error("Error in getEmailDeliveryStats:", error);
      return null;
    }
  }

  /**
   * Fetch static links from the database filtered by list_type
   * @returns Array of static links
   */
  private async fetchStaticLinks(): Promise<StaticLink[]> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      console.log("Fetching static links from static_links table");
      
      // Filter links where list_type is 'general' or 'all'
      const { data, error } = await supabaseClient
        .from('static_links')
        .select('*')
        .or('list_type.eq.general,list_type.eq.all');
      
      if (error) {
        console.error("Error fetching static links:", error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log("No static links found in the database.");
        return [];
      }
      
      console.log(`Successfully fetched ${data.length} static links.`);
      return data as StaticLink[];
    } catch (error) {
      console.error("Error in fetchStaticLinks:", error);
      return [];
    }
  }

  /**
   * Format URL to ensure it's valid
   * @param url URL string to format
   * @returns Properly formatted URL
   */
  private formatUrl(url: string | null): string | null {
    if (!url) return null;
    
    url = url.trim();
    
    // Check if it's an email address
    if (url.includes('@') && !url.startsWith('mailto:')) {
      return `mailto:${url}`;
    }
    
    // Check if it's a WhatsApp number
    if (url.includes('whatsapp') || url.startsWith('+') || 
        url.startsWith('972') || url.match(/^\d{10,15}$/)) {
      
      // Extract only numbers
      const phoneNumber = url.replace(/\D/g, '');
      
      // Make sure it starts with country code
      const formattedNumber = phoneNumber.startsWith('972') 
        ? phoneNumber 
        : `972${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
      
      return `https://wa.me/${formattedNumber}`;
    }
    
    // Add https:// if missing for regular URLs
    if (!url.startsWith('http://') && !url.startsWith('https://') && 
        !url.startsWith('mailto:') && !url.startsWith('#')) {
      return `https://${url}`;
    }
    
    return url;
  }

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
          <p style="text-align: center; margin: 10px 0;">
            <a href="${formattedUrl}" 
               style="font-family: 'Alef', sans-serif; font-weight: bold; color: #4A148C; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); display: inline-flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" style="margin-left: 5px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>${link.fixed_text}
            </a>
          </p>
        `;
      }
      
      // Regular link with URL
      if (formattedUrl && link.fixed_text) {
        return `
          <p style="text-align: center; margin: 10px 0;">
            <a href="${formattedUrl}" 
               style="font-family: 'Alef', sans-serif; font-weight: bold; color: #4A148C; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);">
              ${link.fixed_text}
            </a>
          </p>
        `;
      } else if (link.fixed_text) {
        // Display plain text as bold paragraph when no URL
        return `
          <p style="text-align: center; margin: 10px 0; font-family: 'Alef', sans-serif; font-weight: bold; color: #4A148C; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);">
            ${link.fixed_text}
          </p>
        `;
      }
      
      return '';
    }).filter(link => link !== '');
  }

  /**
   * Generate footer with minimal essential links
   * @param recipientEmail The recipient email for unsubscribe link
   * @param includeContactLink Whether to include contact link in footer
   * @returns HTML string with footer links
   */
  private async generateEmailFooter(recipientEmail: string, includeContactLink: boolean = false): Promise<string> {
    try {
      // Create footer links array with only essential links
      let footerLinks = [];
      
      // Add contact link only if requested
      if (includeContactLink) {
        footerLinks.push(`
          <p style="text-align: center; margin: 10px 0;">
            <a href="https://ruth-prissman-coach.lovable.app/contact" 
               style="font-family: 'Alef', sans-serif; font-weight: bold; color: #4A148C; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);">
              צור קשר
            </a>
          </p>
        `);
      }
      
      // Add dynamic unsubscribe link (always included)
      const unsubscribeUrl = `https://ruth-prissman-coach.lovable.app/unsubscribe?email=${encodeURIComponent(recipientEmail)}&list=general`;
      footerLinks.push(`
        <p style="text-align: center; margin: 10px 0;">
          <a href="${unsubscribeUrl}" 
             style="font-family: 'Alef', sans-serif; font-weight: bold; color: #4A148C; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);">
            להסרה מרשימת התפוצה
          </a>
        </p>
      `);
      
      return `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(74, 20, 140, 0.2);">
          ${footerLinks.join('')}
          <p style="font-size: 12px; color: #4A148C; margin-top: 20px; text-align: center; font-family: 'Heebo', sans-serif; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);">
            © ${new Date().getFullYear()} רות פריסמן - קוד הנפש. כל הזכויות שמורות.
          </p>
        </div>
      `;
    } catch (error) {
      console.error("Error generating email footer:", error);
      // Fallback footer if something goes wrong - only essential elements
      return `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(74, 20, 140, 0.2); text-align: center;">
          <p style="margin: 10px 0;">
            <a href="https://ruth-prissman-coach.lovable.app/unsubscribe?email=${encodeURIComponent(recipientEmail)}&list=general" 
               style="font-family: 'Alef', sans-serif; font-weight: bold; color: #4A148C; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);">
              להסרה מרשימת התפוצה
            </a>
          </p>
          <p style="font-size: 12px; color: #4A148C; margin-top: 20px; text-align: center; font-family: 'Heebo', sans-serif; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7);">
            © ${new Date().getFullYear()} רות פריסמן - קוד הנפש
          </p>
        </div>
      `;
    }
  }

  /**
   * Process dynamic content links
   * @param content The markdown content
   * @param articleTitle The article title for email subject
   * @returns Processed content with dynamic links
   */
  private async processContentLinks(content: string, articleTitle: string): Promise<string> {
    try {
      // Format and enhance content without adding links
      // This function now maintains content formatting but doesn't inject links
      
      let processedContent = content;
      
      // Apply any necessary content formatting (e.g., adding line breaks, styling)
      // But don't add any links that could cause duplication
      
      return processedContent;
    } catch (error) {
      console.error("Error processing content:", error);
      return content;
    }
  }

  /**
   * Minify HTML content for email
   * @param html The HTML content to minify
   * @returns Minified HTML string
   */
  private minifyHtml(html: string): string {
    if (!html) return '';
    
    try {
      // Basic HTML minification - remove extra spaces, comments, and line breaks
      return html
        // Remove HTML comments
        .replace(/<!--[\s\S]*?-->/g, '')
        // Remove extra whitespace between tags
        .replace(/>\s+</g, '><')
        // Remove whitespace at the beginning and end of lines
        .replace(/^\s+|\s+$/gm, '')
        // Normalize remaining whitespace
        .replace(/\s{2,}/g, ' ');
    } catch (error) {
      console.error("Error minifying HTML:", error);
      return html; // Return original if minification fails
    }
  }

  /**
   * Consolidate inline styles into a style block where possible
   * @param html The HTML content
   * @returns HTML with consolidated styles
   */
  private consolidateStyles(html: string): string {
    if (!html) return '';
    
    try {
      // This is a simplified implementation
      // In a production environment, a more robust parser would be used
      
      // For now, we'll just ensure that the import for Google Fonts is properly placed
      // and that the style tag is in the head section
      
      const hasStyleTag = html.includes('<style>');
      
      // Add basic style tag if none exists
      if (!hasStyleTag) {
        return html.replace('<head>', '<head><style>/* Consolidated styles */</style>');
      }
      
      return html;
    } catch (error) {
      console.error("Error consolidating styles:", error);
      return html; // Return original if consolidation fails
    }
  }

  /**
   * Optimize HTML for email delivery
   * @param html The HTML content to optimize
   * @returns Optimized HTML string
   */
  private optimizeEmailHtml(html: string): string {
    if (!html) return '';
    
    try {
      console.log("Optimizing email HTML content");
      
      // Step 1: Minify the HTML
      const minifiedHtml = this.minifyHtml(html);
      
      // Step 2: Consolidate styles
      const optimizedHtml = this.consolidateStyles(minifiedHtml);
      
      // Step 3: Check size and log warning if too large
      const sizeInKB = (new TextEncoder().encode(optimizedHtml).length / 1024).toFixed(2);
      console.log(`Email HTML size: ${sizeInKB}KB`);
      
      if (parseFloat(sizeInKB) > 90) {
        console.warn(`Email HTML is large (${sizeInKB}KB) and may be clipped by some email providers`);
      }
      
      return optimizedHtml;
    } catch (error) {
      console.error("Error optimizing email HTML:", error);
      return html; // Return original if optimization fails
    }
  }


