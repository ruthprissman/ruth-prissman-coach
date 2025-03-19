
import { supabaseClient } from '@/lib/supabaseClient';
import { ArticlePublication, ProfessionalContent } from "@/types/article";
import { EmailPublicationService } from './EmailPublicationService';
import { DatabaseService } from './DatabaseService';

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
 * Interface for email delivery stats
 */
export interface EmailDeliveryStats {
  articleId: number;
  totalSent: number;
  totalFailed: number;
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
  private databaseService: DatabaseService;
  private emailService: EmailPublicationService;

  private constructor() {
    this.databaseService = new DatabaseService();
    this.emailService = new EmailPublicationService();
  }

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
      // Get current timestamp
      const now = new Date().toISOString();

      // Get all publications that are scheduled and not yet published
      const scheduledPublications = await this.databaseService.getScheduledPublications(now);

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
    try {
      // First check if the article is already published on the website
      const existingArticle = await this.databaseService.getArticle(article.id);
      
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
              console.log("Unknown publication location: " + publication.publish_location);
          }
          
          // Mark this publication as published
          await this.markPublicationAsDone(publication.id as number);
          
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
      await this.databaseService.updateArticlePublishedDate(articleId);
      console.log(`Article ${articleId} published to website`);
    } catch (error) {
      console.error(`Error publishing article ${articleId} to website:`, error);
      throw error;
    }
  }

  /**
   * Mark a publication as completed
   */
  private async markPublicationAsDone(publicationId: number): Promise<void> {
    try {
      await this.databaseService.markPublicationAsCompleted(publicationId);
      console.log(`Publication ${publicationId} marked as completed`);
    } catch (error) {
      console.error(`Error marking publication ${publicationId} as done:`, error);
      throw error;
    }
  }

  /**
   * Publish article to email subscribers
   */
  private async publishToEmail(article: PublishReadyArticle): Promise<void> {
    // Add diagnostic logging before returning
    console.log('[Email Diagnostics] Starting email publication for article ' + article.id + ': "' + article.title + '"');
    console.log('[Email Diagnostics] Article has markdown content of length: ' + article.content_markdown.length + ' characters');
    
    // For now, just log that the feature isn't implemented yet
    console.log('[Email Diagnostics] Email publication not yet implemented for article ' + article.id);
    console.log('[Email Diagnostics] Email publication workflow completed for article ' + article.id);
  }

  /**
   * Publish article to WhatsApp
   */
  private async publishToWhatsApp(article: PublishReadyArticle): Promise<void> {
    console.log(`WhatsApp publication not implemented for article ${article.id}`);
    // Implementation would go here
  }

  /**
   * Get email delivery statistics for an article
   * @param articleId The article ID
   * @returns Email delivery stats
   */
  public async getEmailDeliveryStats(articleId: number): Promise<EmailDeliveryStats | null> {
    return this.emailService.getEmailDeliveryStats(articleId);
  }
  
  /**
   * Add the retry failed emails method that's being called from ArticlesList
   * @param articleId The article ID to retry failed emails for
   * @returns Number of emails that were retried
   */
  public async retryFailedEmails(articleId: number): Promise<number> {
    return this.emailService.retryFailedEmails(articleId);
  }
  
  /**
   * Instance method for retry publication which calls the static method
   * This is added to solve the method access error in other components
   */
  public async retryPublication(publicationId: number): Promise<void> {
    return PublicationService.retryPublication(publicationId);
  }

  /**
   * Retry a failed publication
   * @param publicationId The publication ID to retry
   */
  public static async retryPublication(publicationId: number): Promise<void> {
    try {
      const instance = PublicationService.getInstance();
      const dbService = instance.databaseService;
      
      // Get the publication details
      const publication = await dbService.getPublication(publicationId);
      
      if (!publication) {
        throw new Error(`Publication ${publicationId} not found`);
      }
      
      // Reset the publication's published date so it can be retried
      await dbService.resetPublicationDate(publicationId);
      
      console.log(`Publication ${publicationId} has been reset for retry`);
      
      // Force an immediate check for publications
      instance.checkScheduledPublications();
      
    } catch (error) {
      console.error(`Error retrying publication ${publicationId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export default PublicationService.getInstance();
