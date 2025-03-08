import { supabase, getSupabaseWithAuth } from "@/lib/supabase";
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
 * Interface for static link
 */
interface StaticLink {
  name: string;
  text: string;
  url: string | null;
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
   * Fetch static links from the database
   * @returns Array of static links
   */
  private async fetchStaticLinks(): Promise<StaticLink[]> {
    try {
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      console.log("Fetching static links from static_links table");
      
      const { data, error } = await supabaseClient
        .from('static_links')
        .select('name, text, url');
      
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
   * Generate footer with static links
   * @param recipientEmail The recipient email for unsubscribe link
   * @returns HTML string with footer links
   */
  private async generateEmailFooter(recipientEmail: string): Promise<string> {
    try {
      const staticLinks = await this.fetchStaticLinks();
      let footerLinks = [];
      
      // Add default links if not in the static_links table
      const contactLink = staticLinks.find(link => link.name === 'contact');
      footerLinks.push(contactLink && contactLink.url 
        ? `<a href="${contactLink.url}" style="color: #3273dc; text-decoration: underline; margin: 0 10px;">${contactLink.text || 'צור קשר'}</a>` 
        : `<a href="/contact" style="color: #3273dc; text-decoration: underline; margin: 0 10px;">צור קשר</a>`);
      
      const whatsappLink = staticLinks.find(link => link.name === 'whatsapp');
      footerLinks.push(whatsappLink && whatsappLink.url 
        ? `<a href="${whatsappLink.url}" style="color: #3273dc; text-decoration: underline; margin: 0 10px;">${whatsappLink.text || 'שלח לי הודעה בוואטסאפ'}</a>` 
        : `<a href="https://wa.me/972XXXXXXXXX" style="color: #3273dc; text-decoration: underline; margin: 0 10px;">שלח לי הודעה בוואטסאפ</a>`);
      
      // Add unsubscribe link with dynamic email parameter
      const unsubscribeUrl = `https://yourwebsite.com/unsubscribe?email=${encodeURIComponent(recipientEmail)}&list=newsletter`;
      footerLinks.push(`<a href="${unsubscribeUrl}" style="color: #3273dc; text-decoration: underline; margin: 0 10px;">להסרה מרשימת התפוצה</a>`);
      
      // Add any other static links
      staticLinks.forEach(link => {
        if (!['contact', 'whatsapp', 'unsubscribe', 'email'].includes(link.name) && link.url) {
          footerLinks.push(`<a href="${link.url}" style="color: #3273dc; text-decoration: underline; margin: 0 10px;">${link.text}</a>`);
        } else if (!['contact', 'whatsapp', 'unsubscribe', 'email'].includes(link.name) && !link.url && link.text) {
          footerLinks.push(`<strong style="margin: 0 10px;">${link.text}</strong>`);
        }
      });
      
      return `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center;">
          <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
            ${footerLinks.join(' | ')}
          </div>
          <div style="font-size: 12px; color: #999; margin-top: 10px;">
            © ${new Date().getFullYear()} רות פריסמן - קוד הנפש. כל הזכויות שמורות.
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error generating email footer:", error);
      // Fallback footer if something goes wrong
      return `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center;">
          <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
            <a href="/contact" style="color: #3273dc; text-decoration: underline; margin: 0 10px;">צור קשר</a> | 
            <a href="https://yourwebsite.com/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="color: #3273dc; text-decoration: underline; margin: 0 10px;">להסרה מרשימת התפוצה</a>
          </div>
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
      const staticLinks = await this.fetchStaticLinks();
      const emailLink = staticLinks.find(link => link.name === 'email');
      
      let processedContent = content;
      
      // Replace "כתבי לי" with email link
      if (emailLink && emailLink.url) {
        const emailRegex = /כתבי לי/g;
        const encodedSubject = encodeURIComponent(`שאלה על ${articleTitle}`);
        const emailHtml = `<a href="mailto:${emailLink.url}?subject=${encodedSubject}" style="color: #3273dc; text-decoration: underline;">כתבי לי</a>`;
        processedContent = processedContent.replace(emailRegex, emailHtml);
      }
      
      return processedContent;
    } catch (error) {
      console.error("Error processing content links:", error);
      return content;
    }
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
      
      // Process content to add dynamic links
      const processedContent = await this.processContentLinks(truncatedContent, article.title);
      
      // Convert newlines to HTML breaks
      const formattedMarkdown = processedContent.replace(/\n/g, '<br/>');
      
      // Create email logs array for batch insertion
      const emailLogs: EmailLogEntry[] = [];
      
      // Send individual emails to each subscriber
      for (const recipientEmail of subscriberEmails) {
        try {
          // Generate footer with personalized unsubscribe link
          const emailFooter = await this.generateEmailFooter(recipientEmail);
          
          const readMoreUrl = `https://yourwebsite.com/articles/${article.id}`;
          
          const emailContent = `
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${article.title}</title>
                <style>
                  @media only screen and (max-width: 620px) {
                    .email-container {
                      width: 100% !important;
                    }
                    .content {
                      padding: 10px !important;
                    }
                    h1 {
                      font-size: 22px !important;
                    }
                    p, a {
                      font-size: 16px !important;
                    }
                  }
                </style>
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; direction: rtl; background-color: #f5f5f5;">
                <div style="background-image: url('https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/sign/site_imgs/email-background.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat; width: 100%; min-height: 100%;">
                  <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: rgba(255, 255, 255, 0.95); border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px; overflow: hidden;">
                    <div style="background-color: #4a6da7; padding: 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${article.title}</h1>
                    </div>
                    <div class="content" style="padding: 20px 30px;">
                      <p style="font-size: 16px; color: #333; margin-bottom: 20px; text-align: right;">${formattedMarkdown}</p>
                      
                      ${article.content_markdown.length > 500 ? 
                        `<div style="text-align: center; margin: 30px 0;">
                          <a href="${readMoreUrl}" style="background-color: #4a6da7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">קרא עוד באתר</a>
                        </div>` : ''}
                      
                      ${emailFooter}
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

          // 3. Send email via Supabase Edge Function
          console.log(`Sending email to ${recipientEmail}`);
          
          const response = await fetch(this.supabaseEdgeFunctionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": this.supabaseAnonKey
            },
            body: JSON.stringify({
              emailList: [recipientEmail],
              subject: article.title,
              sender: { 
                email: "RuthPrissman@gmail.com", 
                name: "רות פריסמן - קוד הנפש" 
              },
              htmlContent: emailContent
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to send email to ${recipientEmail}. Response:`, errorText);
            
            // Log failed email
            emailLogs.push({
              article_id: article.id,
              email: recipientEmail,
              status: 'failed',
              error_message: `Edge function error: ${errorText}`
            });
          } else {
            // Log successful email
            emailLogs.push({
              article_id: article.id,
              email: recipientEmail,
              status: 'sent'
            });
            console.log(`Email sent successfully to ${recipientEmail}`);
          }
        } catch (emailError) {
          console.error(`Error sending email to ${recipientEmail}:`, emailError);
          
          // Log failed email
          emailLogs.push({
            article_id: article.id,
            email: recipientEmail,
            status: 'failed',
            error_message: emailError instanceof Error ? emailError.message : String(emailError)
          });
        }
      }
      
      // Log the email sending results to the database
      await this.logEmailResults(emailLogs);
      
      console.log(`Email publication process completed for article ${article.id}`);
      
    } catch (error) {
      console.error(`Error publishing article ${article.id} to email:`, error);
      throw error;
    }
  }

  /**
   * Retry sending emails to failed recipients
   * @param articleId The article ID to retry
   */
  public async retryFailedEmails(articleId: number): Promise<number> {
    try {
      console.log(`Retrying failed emails for article ${articleId}`);
      
      // Fetch article details
      const supabaseClient = this.accessToken 
        ? getSupabaseWithAuth(this.accessToken)
        : supabase;
      
      const { data: article, error: articleError } = await supabaseClient
        .from('professional_content')
        .select('*')
        .eq('id', articleId)
        .single();
      
      if (articleError) {
        console.error(`Error fetching article ${articleId}:`, articleError);
        throw articleError;
      }
      
      if (!article) {
        throw new Error(`Article ${articleId} not found`);
      }
      
      // Get failed email recipients
      const failedEmails = await this.getFailedEmailRecipients(articleId);
      
      if (failedEmails.length === 0) {
        console.log(`No failed emails to retry for article ${articleId}`);
        return 0;
      }
      
      // Create minimal article object for email publishing
      const emailArticle: PublishReadyArticle = {
        id: article.id,
        title: article.title,
        content_markdown: article.content_markdown,
        category_id: article.category_id,
        contact_email: article.contact_email,
        article_publications: []
      };
      
      // Process content to add dynamic links
      const processedContent = await this.processContentLinks(
        article.content_markdown.slice(0, 500) + 
          (article.content_markdown.length > 500 ? '...' : ''),
        article.title
      );
      
      // Convert newlines to HTML breaks
      const formattedMarkdown = processedContent.replace(/\n/g, '<br/>');
      
      // Email logs array for batch insertion
      const emailLogs: EmailLogEntry[] = [];
      
      // Send individual emails to each failed recipient
      for (const recipientEmail of failedEmails) {
        try {
          // Generate footer with personalized unsubscribe link
          const emailFooter = await this.generateEmailFooter(recipientEmail);
          
          const readMoreUrl = `https://yourwebsite.com/articles/${article.id}`;
          
          const emailContent = `
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${article.title}</title>
                <style>
                  @media only screen and (max-width: 620px) {
                    .email-container {
                      width: 100% !important;
                    }
                    .content {
                      padding: 10px !important;
                    }
                    h1 {
                      font-size: 22px !important;
                    }
                    p, a {
                      font-size: 16px !important;
                    }
                  }
                </style>
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; direction: rtl; background-color: #f5f5f5;">
                <div style="background-image: url('https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/sign/site_imgs/email-background.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat; width: 100%; min-height: 100%;">
                  <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: rgba(255, 255, 255, 0.95); border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px; overflow: hidden;">
                    <div style="background-color: #4a6da7; padding: 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${article.title}</h1>
                    </div>
                    <div class="content" style="padding: 20px 30px;">
                      <p style="font-size: 16px; color: #333; margin-bottom: 20px; text-align: right;">${formattedMarkdown}</p>
                      
                      ${article.content_markdown.length > 500 ? 
                        `<div style="text-align: center; margin: 30px 0;">
                          <a href="${readMoreUrl}" style="background-color: #4a6da7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">קרא עוד באתר</a>
                        </div>` : ''}
                      
                      ${emailFooter}
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

          console.log(`Retrying email to ${recipientEmail}`);
          
          const response = await fetch(this.supabaseEdgeFunctionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": this.supabaseAnonKey
            },
            body: JSON.stringify({
              emailList: [recipientEmail],
              subject: article.title,
              sender: { 
                email: "RuthPrissman@gmail.com", 
                name: "רות פריסמן - קוד הנפש" 
              },
              htmlContent: emailContent
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to retry email to ${recipientEmail}. Response:`, errorText);
            
            // Log failed email
            emailLogs.push({
              article_id: article.id,
              email: recipientEmail,
              status: 'failed',
              error_message: `Retry failed: ${errorText}`
            });
          } else {
            // Log successful email
            emailLogs.push({
              article_id: article.id,
              email: recipientEmail,
              status: 'sent'
            });
            console.log(`Email retry successful for ${recipientEmail}`);
          }
        } catch (emailError) {
          console.error(`Error retrying email to ${recipientEmail}:`, emailError);
          
          // Log failed email
          emailLogs.push({
            article_id: article.id,
            email: recipientEmail,
            status: 'failed',
            error_message: emailError instanceof Error ? emailError.message : String(emailError)
          });
        }
      }
      
      // Log the email sending results to the database
      await this.logEmailResults(emailLogs);
      
      // If all emails were sent successfully, ensure the article is marked as published
      if (emailLogs.every(log => log.status === 'sent')) {
        await this.ensureArticleIsPublished(article.id);
      }
      
      console.log(`Successfully retried sending emails to ${failedEmails.length} recipients`);
      return failedEmails.length;
    } catch (error) {
      console.error(`Error in retryFailedEmails for article ${articleId}:`, error);
      throw error;
    }
  }

  /**
   * Publish article to WhatsApp
   */
  private async publishToWhatsApp(article: PublishReadyArticle): Promise<void> {
    try {
      // For now, just log that we would send a WhatsApp message
      // In a real implementation, we would:
      // 1. Generate the WhatsApp message with title and summary
      // 2. Add a link to the full article
      // 3. Send via WhatsApp Business API
      
      const summary = article.content_markdown
        .replace(/[*#_~`]/g, '') // Remove markdown
        .slice(0, 300) + (article.content_markdown.length > 300 ? '...' : '');
      
      console.log(`Article ${article.id} would be sent to WhatsApp:`);
      console.log(`Title: ${article.title}`);
      console.log(`Summary: ${summary}`);
      
      // TODO: Implement WhatsApp sending
      
    } catch (error) {
      console.error(`Error publishing article ${article.id} to WhatsApp:`, error);
      throw error;
    }
  }

  /**
   * Mark a publication as done by updating published_date
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
      
      console.log(`Publication ${publicationId} marked as done`);
      
    } catch (error) {
      console.error(`Error marking publication ${publicationId} as done:`, error);
      throw error;
    }
  }

  /**
   * Manually retry a failed publication
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
        .eq('id', publicationId)
        .single();
      
      if (pubError) throw pubError;
      if (!publication) throw new Error('Publication not found');

      // Ensure professional_content is properly typed
      const professionalContent = publication.professional_content as unknown as ProfessionalContent;
      if (!professionalContent) throw new Error('Professional content not found');
      
      // Create article object
      const article: PublishReadyArticle = {
        id: publication.content_id,
        title: professionalContent.title || "Untitled",
        content_markdown: professionalContent.content_markdown || "",
        category_id: professionalContent.category_id || null,
        contact_email: professionalContent.contact_email || null,
        article_publications: [{
          id: publication.id,
          content_id: publication.content_id,
          publish_location: publication.publish_location,
          scheduled_date: publication.scheduled_date,
          published_date: null
        }]
      };
      
      // Publish based on the publication location
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
          
        case 'Other':
          // Handle other publication types
          break;
        
        default:
          throw new Error(`Unknown publication location: ${publication.publish_location}`);
      }
      
      // Mark as published
      await this.markPublicationAsDone(publicationId);
      
      // Also ensure the article itself is marked as published
      await this.ensureArticleIsPublished(article.id);
      
      console.log("Publication completed successfully");
      
    } catch (error: any) {
      console.error(`Error retrying publication ${publicationId}:`, error);
      throw error;
    }
  }
}

export default PublicationService;

