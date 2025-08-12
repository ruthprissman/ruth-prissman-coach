
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
  image_url: string | null;
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
  private processingTimeoutId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkInterval = 60000; // Check every minute
  private accessToken?: string;
  private databaseService: DatabaseService;
  private emailService: EmailPublicationService;
  private isCurrentlyProcessing = false;
  private MAX_PROCESSING_TIME = 300000; // 5 minutes maximum processing time
  private lastProcessingStart: number | null = null;
  private lockIdentifier: string;

  private constructor() {
    this.databaseService = new DatabaseService();
    this.emailService = new EmailPublicationService();
    // Create unique identifier for this instance
    this.lockIdentifier = `pub-service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    // Only start if not already running
    if (this.isRunning) {
      console.log("[Publication Service] Already running, not starting again");
      return;
    }
    
    this.accessToken = accessToken;
    console.log("[Publication Service] Started");
    this.isRunning = true;
    
    // Force reset processing state when starting
    this.resetProcessingState();
    
    // Check after a delay on startup to avoid immediate checks during page load
    setTimeout(() => {
      if (this.isRunning) { // Double check we're still running
        this.checkScheduledPublications();
        
        // Then set interval for future checks
        this.timerId = setInterval(() => {
          if (this.isRunning) { // Check we're still running before executing
            this.checkScheduledPublications();
          } else {
            // Auto cleanup if no longer running
            this.clearTimers();
          }
        }, this.checkInterval);
      }
    }, 5000); // 5 second delay before first check
  }

  /**
   * Stop the publication service and cleanup all timers
   */
  public stop(): void {
    console.log("[Publication Service] Stopping");
    
    // Clear all timers
    this.clearTimers();
    
    // Reset state
    this.isRunning = false;
    this.resetProcessingState();
    
    console.log("[Publication Service] Stopped");
  }

  /**
   * Helper to clear all timers
   */
  private clearTimers(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    
    if (this.processingTimeoutId) {
      clearTimeout(this.processingTimeoutId);
      this.processingTimeoutId = null;
    }
  }

  /**
   * Reset the processing state for safety
   */
  private resetProcessingState(): void {
    this.isCurrentlyProcessing = false;
    this.lastProcessingStart = null;
    
    if (this.processingTimeoutId) {
      clearTimeout(this.processingTimeoutId);
      this.processingTimeoutId = null;
    }
    
    console.log("[Publication Service] Processing state reset");
  }

  /**
   * Check for articles that need to be published
   * Added isImmediate flag for manual checks vs. scheduled checks
   */
  private async checkScheduledPublications(isImmediate: boolean = false): Promise<void> {
    // Safety check - if service isn't running, don't process
    if (!this.isRunning) {
      console.log("[Publication Service] Service not running, skipping check");
      return;
    }
    
    // If already processing and this is not an immediate check, exit
    if (this.isCurrentlyProcessing && !isImmediate) {
      console.log("[Publication Service] Already processing publications, skipping this check");
      return;
    }
    
    // Set processing flag and setup safeguard timeout
    this.isCurrentlyProcessing = true;
    this.lastProcessingStart = Date.now();
    
    // Set timeout to automatically reset processing flag if it gets stuck
    if (this.processingTimeoutId) {
      clearTimeout(this.processingTimeoutId);
    }
    
    this.processingTimeoutId = setTimeout(() => {
      console.log("[Publication Service] Processing timeout reached, resetting processing flag");
      this.resetProcessingState();
    }, this.MAX_PROCESSING_TIME);
    
    try {
      // Get current timestamp in UTC for accurate comparison regardless of client timezone
      const nowISOString = new Date().toISOString();
      
      console.log(`[Publication Service] Checking for scheduled publications at: ${new Date().toISOString()} (ISO: ${nowISOString})`);

      // Get all publications that are scheduled and not yet published, with atomic locking
      const scheduledPublications = await this.databaseService.getScheduledPublications(nowISOString, this.lockIdentifier);

      if (!scheduledPublications || scheduledPublications.length === 0) {
        console.log("[Publication Service] No publications scheduled for now");
        return;
      }

      console.log(`[Publication Service] Found ${scheduledPublications.length} publications to process`);

      // Group by article to handle multiple publication locations for the same article
      const articlePublicationsMap = new Map<number, PublishReadyArticle>();
      
      for (const pub of scheduledPublications) {
        const articleId = pub.content_id;
        // Check if professional_content exists and is properly shaped
        const professionalContent = pub.professional_content as unknown as ProfessionalContent; 
        
        if (!professionalContent) {
          console.error(`[Publication Service] Missing professional content for article ${articleId}`);
          continue;
        }
        
        // Debug: Log the professional content to see what image fields are available
        console.log('[Publication Service] Professional content fields:', {
          id: articleId,
          availableFields: Object.keys(professionalContent),
          image_url: professionalContent.image_url,
          fullContent: JSON.stringify(professionalContent, null, 2)
        });

        if (!articlePublicationsMap.has(articleId)) {
          // Initialize with article data
          articlePublicationsMap.set(articleId, {
            id: articleId,
            title: professionalContent.title || "Untitled",
            content_markdown: professionalContent.content_markdown || "",
            category_id: professionalContent.category_id || null,
            contact_email: professionalContent.contact_email || null,
            image_url: professionalContent.image_url || null,
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

      console.log(`[Publication Service] Grouped into ${articlePublicationsMap.size} unique articles`);

      // Publish each article
      for (const [articleId, article] of articlePublicationsMap.entries()) {
        console.log(`[Publication Service] Publishing article ${articleId} to ${article.article_publications.length} locations`);
        await this.publishArticle(article);
      }

    } catch (error) {
      console.error("[Publication Service] Error checking scheduled publications:", error);
    } finally {
      // Important: Always reset processing flag when done
      this.resetProcessingState();
    }
  }

  /**
   * Manually trigger a check for publications
   * This can be called explicitly when needed (e.g., after an article is published)
   */
  public async manualCheckPublications(): Promise<void> {
    // Only check if service is running
    if (!this.isRunning) {
      console.log("[Publication Service] Service not running, can't check publications");
      return;
    }
    
    console.log("[Publication Service] Manual check for publications triggered");
    
    // If processing has been stuck for too long, reset it
    const now = Date.now();
    if (this.isCurrentlyProcessing && this.lastProcessingStart && (now - this.lastProcessingStart > this.MAX_PROCESSING_TIME)) {
      console.log("[Publication Service] Processing appears stuck, resetting state before manual check");
      this.resetProcessingState();
    }
    
    await this.checkScheduledPublications(true);
  }

  /**
   * Publish an article to all scheduled locations
   */
  private async publishArticle(article: PublishReadyArticle): Promise<void> {
    try {
      console.log(`[Publication Service] Starting publication process for article ${article.id}`);
      
      // First check if the article is already published on the website
      const existingArticle = await this.databaseService.getArticle(article.id);
      
      const needsWebsitePublishing = !existingArticle?.published_at;
      
      
      // Ensure we only execute each location once per article (avoid duplicates)
      const processedLocations = new Set<string>();
      
      // Process each publication location
      for (const publication of article.article_publications) {
        try {
          console.log(`[Publication Service] Publishing article ${article.id} to ${publication.publish_location}`);
          
          switch (publication.publish_location) {
            case 'Website':
              if (needsWebsitePublishing) {
                await this.publishToWebsite(article.id);
              }
              break;
              
            case 'Email':
              // If we already processed Email for this article, skip entirely
              if (processedLocations.has('Email')) {
                console.warn(`[Publication Service] Email already processed for article ${article.id}. Skipping duplicate and marking as completed.`);
                await this.markPublicationAsDone(publication.id as number);
                continue;
              }
              
              console.log(`[Publication Service] Starting email publication for article ${article.id}`);
              
              // Mark Email as processed IMMEDIATELY to prevent any duplicates
              processedLocations.add('Email');
              
              // Check if there are any undelivered recipients
              const undeliveredRecipients = await this.databaseService.getUndeliveredEmailRecipients(article.id);
              const emailPublications = article.article_publications.filter(p => p.publish_location === 'Email');
              
              if (undeliveredRecipients.length === 0) {
                // All subscribers have already received this email
                console.log(`[Publication Service] All subscribers have already received email for article ${article.id}`);
                
                // Check if this article is completely delivered
                const isCompletelyDelivered = await this.databaseService.isArticleCompletelyDelivered(article.id);
                if (isCompletelyDelivered) {
                  // Mark all email publications as completed since everyone received the email
                  for (const emailPub of emailPublications) {
                    await this.markPublicationAsDone(emailPub.id as number);
                  }
                  console.log(`[Publication Service] Email completely delivered to all subscribers, marked all email publications as completed for article ${article.id}`);
                }
                continue;
              }
              
              console.log(`[Publication Service] Found ${undeliveredRecipients.length} recipients who haven't received email for article ${article.id}`);
              
              // Only set undelivered recipients if no specific recipients were selected by user
              const userSelectedRecipients = (window as any).selectedEmailRecipients;
              if (!userSelectedRecipients || !Array.isArray(userSelectedRecipients) || userSelectedRecipients.length === 0) {
                // Set the recipients for this email send to only undelivered ones (retry logic)
                (window as any).selectedEmailRecipients = undeliveredRecipients;
                console.log(`[Publication Service] No user selection found, using undelivered recipients for retry:`, undeliveredRecipients.length);
              } else {
                console.log(`[Publication Service] User selected ${userSelectedRecipients.length} specific recipients, preserving selection`);
              }
              
              // Generate unique attempt ID for this delivery
              const attemptId = `${article.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              
              try {
                // Record that we're starting the email send
                for (const emailPub of emailPublications) {
                  await this.databaseService.recordEmailDeliveryAttempt(
                    article.id, 
                    emailPub.id as number, 
                    attemptId, 
                    'sending'
                  );
                }
                
                // Send the email and get detailed status
                const emailResult = await this.emailService.sendEmailPublication(article);
                
                if (emailResult.sent) {
                  console.log(`[Publication Service] Email sent successfully for article ${article.id}. Status: ${emailResult.status}, Delivered: ${emailResult.deliveredCount}/${emailResult.totalSubscribers}`);
                  
                  // Show appropriate success message based on delivery status
                  const { status, deliveredCount, totalSubscribers, undeliveredCount } = emailResult;
                  let message = '';
                  
                  switch (status) {
                    case 'all_sent':
                      message = `המייל נשלח בהצלחה לכל ${totalSubscribers} הנמענים`;
                      break;
                    case 'partial_sent':
                      message = `המייל נשלח ל-${deliveredCount} נמענים נוספים (סה"כ ${deliveredCount}/${totalSubscribers})`;
                      break;
                    case 'new_send':
                      message = `המייל נשלח בהצלחה ל-${deliveredCount} נמענים`;
                      break;
                  }
                  
                  if (message) {
                    console.log(`[Publication Service] ${message}`);
                  }
                  
                  // Record successful delivery
                  for (const emailPub of emailPublications) {
                    await this.databaseService.recordEmailDeliveryAttempt(
                      article.id, 
                      emailPub.id as number, 
                      attemptId, 
                      'success'
                    );
                  }
                  
                  // Only mark as completed if all subscribers received the email
                  if (status === 'all_sent') {
                    for (const emailPub of emailPublications) {
                      await this.markPublicationAsDone(emailPub.id as number);
                    }
                    console.log(`[Publication Service] All email publications marked as completed for article ${article.id}`);
                  } else {
                    console.log(`[Publication Service] Email partially sent for article ${article.id}, keeping publication open for retry`);
                  }
                } else {
                  console.error(`[Publication Service] Email sending failed for article ${article.id}. Status: ${emailResult.status}`);
                  
                  // Record failed delivery and release locks
                  for (const emailPub of emailPublications) {
                    await this.databaseService.recordEmailDeliveryAttempt(
                      article.id, 
                      emailPub.id as number, 
                      attemptId, 
                      'failed',
                      undefined,
                      'Email sending failed'
                    );
                    await this.databaseService.releaseLock(emailPub.id as number);
                  }
                  throw new Error(`Email sending failed: ${emailResult.status}`);
                }
              } catch (emailError) {
                console.error(`[Publication Service] Failed to send email for article ${article.id}:`, emailError);
                
                // Record failed delivery and release locks
                for (const emailPub of emailPublications) {
                  await this.databaseService.recordEmailDeliveryAttempt(
                    article.id, 
                    emailPub.id as number, 
                    attemptId, 
                    'failed',
                    undefined,
                    emailError.message
                  );
                  await this.databaseService.releaseLock(emailPub.id as number);
                }
              }
              
              // Skip the generic marking below since we handle it specifically here
              continue;
              
            case 'WhatsApp':
              await this.publishToWhatsApp(article);
              break;
              
            case 'Other':
              // Handle other publication types here
              break;
            
            default:
              console.log("[Publication Service] Unknown publication location: " + publication.publish_location);
          }
          
          // Mark this publication as published (for non-Email publications)
          await this.markPublicationAsDone(publication.id as number);
          console.log(`[Publication Service] Successfully published article ${article.id} to ${publication.publish_location}`);
          
        } catch (pubError) {
          console.error(`[Publication Service] Error publishing article ${article.id} to ${publication.publish_location}:`, pubError);
          // Release lock on failed publication
          try {
            await this.databaseService.releaseLock(publication.id as number);
          } catch (lockError) {
            console.error(`[Publication Service] Error releasing lock for publication ${publication.id}:`, lockError);
          }
          // Continue with other publications
        }
      }
      
    } catch (error) {
      console.error(`[Publication Service] Error publishing article ${article.id}:`, error);
      // Release locks on all publications for this article
      for (const publication of article.article_publications) {
        try {
          await this.databaseService.releaseLock(publication.id as number);
        } catch (lockError) {
          console.error(`[Publication Service] Error releasing lock for publication ${publication.id}:`, lockError);
        }
      }
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
    console.log('[Publication Service] Starting email publication workflow for article ' + article.id);
    
    try {
      // Now we call the actual email sending service that handles the email generation and sending
      console.log('[Publication Service] Calling EmailPublicationService.sendEmailPublication');
      const result = await this.emailService.sendEmailPublication(article);
      
      if (result) {
        console.log('[Publication Service] Successfully sent emails for article ' + article.id);
      } else {
        console.warn('[Publication Service] Failed to send emails for article ' + article.id);
      }
    } catch (error) {
      console.error('[Publication Service] Error in publishToEmail for article ' + article.id + ':', error);
      throw error; // Re-throw to be caught by publishArticle
    }
    
    console.log('[Publication Service] Email publication workflow completed for article ' + article.id);
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
      console.log(`[Publication Service] Retrying publication ${publicationId}`);
      const instance = PublicationService.getInstance();
      const dbService = instance.databaseService;
      
      // Get the publication details
      const publication = await dbService.getPublication(publicationId);
      
      if (!publication) {
        throw new Error(`Publication ${publicationId} not found`);
      }
      
      console.log(`[Publication Service] Found publication for article ${publication.content_id}, location: ${publication.publish_location}`);
      
      // Reset the publication's published date so it can be retried
      await dbService.resetPublicationDate(publicationId);
      
      console.log(`[Publication Service] Publication ${publicationId} has been reset for retry`);
      
      // Force an immediate check for publications
      await instance.manualCheckPublications();
      
    } catch (error) {
      console.error(`[Publication Service] Error retrying publication ${publicationId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export default PublicationService.getInstance();
