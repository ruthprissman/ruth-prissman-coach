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
 * Service to handle article publications
 */
class PublicationService {
  private static instance: PublicationService;
  private timerId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkInterval = 60000; // Check every minute
  private accessToken?: string;
  // Edge Function URL (correct format that works with CURL)
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
      
      // Fetch only active subscribers
      const { data: subscribers, error } = await supabaseClient
        .from('content_subscribers')
        .select('email')
        .eq('is_active', true);
      
      if (error) {
        console.error("Error fetching active email subscribers:", error);
        throw error;
      }
      
      if (!subscribers || subscribers.length === 0) {
        console.log("No active subscribers found.");
        return [];
      }
      
      // Extract emails and remove duplicates
      const uniqueEmails = [...new Set(subscribers.map((sub: EmailSubscriber) => sub.email))];
      
      console.log(`Fetched ${uniqueEmails.length} unique active subscribers.`);
      return uniqueEmails;
    } catch (error) {
      console.error("Error in fetchActiveSubscribers:", error);
      return [];
    }
  }

  /**
   * Publish article to email subscribers
   */
  private async publishToEmail(article: PublishReadyArticle): Promise<void> {
    try {
      // 1. Fetch active email subscribers from the database
      const subscriberEmails = await this.fetchActiveSubscribers();
      
      if (subscriberEmails.length === 0) {
        console.log("No active subscribers found. Skipping email sending.");
        return;
      }
      
      console.log(`Preparing to send email for article ${article.id} to ${subscriberEmails.length} active subscribers.`);
      
      // 2. Format the email content with HTML
      const formattedMarkdown = article.content_markdown
        .replace(/\n/g, '<br/>') // Convert newlines to HTML breaks
        .slice(0, 500) + (article.content_markdown.length > 500 ? '...<br/><br/><a href="YOUR_WEBSITE_URL/articles/' + article.id + '">קרא עוד באתר</a>' : '');
      
      const emailContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.5; direction: rtl; }
              h1 { color: #333; }
              p { font-size: 16px; }
              .footer { margin-top: 20px; font-size: 12px; color: #888; }
            </style>
          </head>
          <body>
            <h1>${article.title}</h1>
            <p>${formattedMarkdown}</p>
            <div class="footer">
              <p>אם אינך רוצה לקבל עוד מיילים, <a href="YOUR_WEBSITE_URL/unsubscribe">לחץ כאן להסרה</a></p>
            </div>
          </body>
        </html>
      `;
      
      // 3. Send email via Supabase Edge Function with updated request format
      try {
        // Using the updated endpoint and request format 
        const response = await fetch(this.supabaseEdgeFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": this.supabaseAnonKey
          },
          body: JSON.stringify({
            emailList: subscriberEmails,
            subject: article.title,
            sender: { 
              email: "RuthPrissman@gmail.com", 
              name: "רות פריסמן - קוד הנפש" 
            },
            htmlContent: emailContent
          })
        });
        
        // Log detailed response information for debugging
        console.log("Edge Function response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to send email. Response:", errorText);
          throw new Error(`Failed to send email: ${errorText}`);
        }
        
        console.log(`Email sent successfully for article ${article.id} to ${subscriberEmails.length} subscribers`);
      } catch (fetchError) {
        console.error("Fetch error when calling Edge Function:", fetchError);
        throw fetchError;
      }
      
    } catch (error) {
      console.error(`Error publishing article ${article.id} to email:`, error);
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
      
      console.log("Publication completed successfully");
      
    } catch (error: any) {
      console.error(`Error retrying publication ${publicationId}:`, error);
      throw error;
    }
  }
}

export default PublicationService;
