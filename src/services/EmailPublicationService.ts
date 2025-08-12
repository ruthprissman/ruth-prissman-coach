import { supabaseClient, getFreshSupabaseClient, executeWithRetry } from '@/lib/supabaseClient';
import { EmailDeliveryStats } from './PublicationService';
import { DatabaseService } from './DatabaseService';
import { EmailGenerator } from '../utils/EmailGenerator';
import { EmailDiagnostics } from '../utils/EmailDiagnostics';

/**
 * Service to handle email publication
 */
export class EmailPublicationService {
  private databaseService: DatabaseService;
  private emailGenerator: EmailGenerator;
  private emailDiagnostics: EmailDiagnostics;
  private supabaseEdgeFunctionUrl: string = "https://uwqwlltrfvokjlaufguz.functions.supabase.co/send-email";

  constructor() {
    this.databaseService = new DatabaseService();
    this.emailGenerator = new EmailGenerator();
    this.emailDiagnostics = new EmailDiagnostics();
  }

  /**
   * Get email delivery statistics for an article
   * @param articleId The article ID
   * @returns Email delivery stats
   */
  public async getEmailDeliveryStats(articleId: number): Promise<EmailDeliveryStats | null> {
    try {
      const totalSent = await this.databaseService.getEmailLogs(articleId, 'sent');
      const totalFailed = await this.databaseService.getEmailLogs(articleId, 'failed');
      
      if (totalSent.count === 0 && totalFailed.count === 0) {
        return null; // No data available
      }
      
      return {
        articleId,
        totalSent: totalSent.count,
        totalFailed: totalFailed.count
      };
    } catch (error) {
      console.error("Error in getEmailDeliveryStats:", error);
      return null;
    }
  }

  /**
   * Transform article title for email if it matches the pattern
   * @param title Original article title
   * @returns Transformed title for email or original if no match
   */
  private transformEmailTitle(title: string): string {
    // Regular expression to match "אימון בגישה טיפולית - קוד הנפש - שבוע X" pattern
    const titleRegex = /אימון בגישה טיפולית - קוד הנפש - שבוע (\d+)/;
    const match = title.match(titleRegex);
    
    if (match && match[1]) {
      // Extract the week number and create the new title format
      const weekNumber = match[1];
      const transformedTitle = `המשך המסע - קוד הנפש - שבוע ${weekNumber}`;
      
      // Log the transformation details for debugging
      console.log('[Email Publication] Title transformation:', {
        original: title,
        transformed: transformedTitle,
        weekNumber,
        pattern: titleRegex.toString()
      });
      
      return transformedTitle;
    }
    
    // If no match, return the original title
    console.log('[Email Publication] No title transformation needed for:', title);
    return title;
  }

  /**
   * Send email publication for an article with delivery status information
   * @param article The article to publish via email
   * @returns Promise<{sent: boolean, status: 'all_sent' | 'partial_sent' | 'new_send' | 'no_subscribers', deliveredCount: number, totalSubscribers: number, undeliveredCount: number}> Email send status
   */
  public async sendEmailPublication(article: any): Promise<{sent: boolean, status: 'all_sent' | 'partial_sent' | 'new_send' | 'no_subscribers', deliveredCount: number, totalSubscribers: number, undeliveredCount: number}> {
    console.log('[Email Publication] Starting email publication process for article ' + article.id + ': "' + article.title + '"');
    
    try {
      // Validate that the article has the required properties
      if (!article || !article.id) {
        console.error('[Email Publication] Invalid article object provided');
        return {sent: false, status: 'no_subscribers', deliveredCount: 0, totalSubscribers: 0, undeliveredCount: 0};
      }
      
      // Ensure article has title and content
      if (!article.title || !article.content_markdown) {
        console.error('[Email Publication] Article is missing title or content: ' + JSON.stringify({
          id: article.id,
          hasTitle: !!article.title,
          hasContent: !!article.content_markdown
        }));
        return {sent: false, status: 'no_subscribers', deliveredCount: 0, totalSubscribers: 0, undeliveredCount: 0};
      }

      // Get delivery status information first
      const totalSubscribers = (await this.databaseService.fetchActiveSubscribers()).length;
      const successfulRecipients = await this.databaseService.getSuccessfulEmailRecipients(article.id);
      const deliveredCount = successfulRecipients.length;
      
      // 1. Check if specific recipients were selected from the preview modal or retry operation
      const selectedRecipients = (window as any).selectedEmailRecipients;
      let subscribers: string[]; // Array of email strings
      
      if (selectedRecipients && Array.isArray(selectedRecipients) && selectedRecipients.length > 0) {
        console.log('[Email Publication] Using specific recipients:', selectedRecipients.length);
        subscribers = selectedRecipients; // These are already email strings
        // Clear the selection after use
        delete (window as any).selectedEmailRecipients;
      } else {
        // Check if this article has any previous email delivery attempts
        const undeliveredRecipients = await this.databaseService.getUndeliveredEmailRecipients(article.id);
        
        if (undeliveredRecipients.length > 0) {
          // This is a retry scenario - only send to those who didn't receive it yet
          console.log('[Email Publication] Retry detected - sending only to undelivered recipients:', undeliveredRecipients.length);
          subscribers = undeliveredRecipients;
        } else {
          // First time or all subscribers already received - get all active subscribers
          const allSubscribers = await this.databaseService.fetchActiveSubscribers();
          if (!allSubscribers || allSubscribers.length === 0) {
            console.log('[Email Publication] No active subscribers found for article ' + article.id);
            return {sent: false, status: 'no_subscribers', deliveredCount: 0, totalSubscribers: 0, undeliveredCount: 0};
          }
          
          // Check if everyone already received this email
          const isCompletelyDelivered = await this.databaseService.isArticleCompletelyDelivered(article.id);
          if (isCompletelyDelivered) {
            console.log('[Email Publication] All subscribers have already received this email for article ' + article.id);
            return {sent: true, status: 'all_sent', deliveredCount, totalSubscribers, undeliveredCount: 0}; // Return success since everyone got it
          }
          
          subscribers = allSubscribers;
          console.log('[Email Publication] Using all active subscribers');
        }
      }
      
      const undeliveredCount = totalSubscribers - deliveredCount;
      
      console.log('[Email Publication] Found ' + subscribers.length + ' subscribers for article ' + article.id);
      
      // 2. Fetch any static links to include in the email
      const staticLinks = await this.databaseService.fetchStaticLinks();
      console.log('[Email Publication] Retrieved ' + (staticLinks?.length || 0) + ' static links for email template');
      
      // Transform the title for email if needed
      const originalTitle = article.title;
      const emailTitle = this.transformEmailTitle(originalTitle);
      
      console.log('[Email Publication] Title preparation:', {
        originalTitle,
        emailTitle,
        isTitleTransformed: emailTitle !== originalTitle,
        titleLength: emailTitle.length,
        titleContainsSpecialChars: /[^\w\s\u0590-\u05FF\u200f\u200e\-:,.?!]/g.test(emailTitle)
      });
      
      // 3. Generate email HTML content with transformed title
      console.log('[Email Publication] About to generate email with image_url:', article.image_url);
      const emailContent = await this.emailGenerator.generateEmailContent({
        title: emailTitle || 'No Title', // Use transformed title
        content: article.content_markdown || '',
        staticLinks: staticLinks || [],
        image_url: article.image_url
      });
      console.log('[Email Publication] Email content generated, checking for img tag:', emailContent.includes('<img'));
      
      // Log email content size and first/last 100 characters for debugging
      console.log('[Email Publication] Generated email content stats:', {
        lengthInBytes: new Blob([emailContent]).size,
        lengthInChars: emailContent.length,
        firstChars: emailContent.substring(0, 100) + '...',
        lastChars: '...' + emailContent.substring(emailContent.length - 100)
      });
      
      // 4. Validate the generated email content
      const diagnosisResult = this.emailDiagnostics.diagnoseEmailContent(
        emailContent, 
        subscribers[0], // Use first email for diagnosis
        article.id
      );
      
      if (!diagnosisResult.isValid) {
        console.error('[Email Publication] Email content validation failed for article ' + article.id + ': ' + diagnosisResult.issues.join('; '));
        return {sent: false, status: 'no_subscribers', deliveredCount, totalSubscribers, undeliveredCount};
      }
      
      console.log('[Email Publication] Email content validated successfully');
      
      // 5. Generate content integrity hash for verification
      const beforeSendHash = this.emailDiagnostics.logContentIntegrityHash(emailContent, 'before-send', article.id);
      console.log('[Email Publication] Content integrity hash generated: ' + beforeSendHash);
      
      // 6. Prepare for batch sending (could be improved with actual batching)
      const successfulEmails: string[] = [];
      const failedEmails: string[] = [];
      
      // 7. Send emails via Supabase Edge Function using the fresh client
      console.log('[Email Publication] Starting to send emails to ' + subscribers.length + ' subscribers');
      
      // Get a fresh client with guaranteed new token
      const freshClient = await getFreshSupabaseClient();
      
      // Get the current user session from the client
      const { data } = await freshClient.auth.getSession();
      const token = data.session?.access_token || '';
      
      if (!token) {
        console.error('[Email Publication] No authentication token available, cannot send emails');
        return {sent: false, status: 'no_subscribers', deliveredCount, totalSubscribers, undeliveredCount};
      }
      
      console.log('[Email Publication] Authentication token obtained, length: ' + token.length);
      console.log('[Email Publication] Using Supabase Edge Function URL: ' + this.supabaseEdgeFunctionUrl);
      
      // For debugging only: Send to first 2 subscribers in development
      const recipientsToSend = process.env.NODE_ENV === 'development' 
        ? subscribers.slice(0, 2) 
        : subscribers;
      
      console.log('[Email Publication] Sending single email to ' + recipientsToSend.length + ' recipients');
      
      try {
        // Clean up any previous failed attempts for all recipients
        await this.cleanupFailedEmails(article.id, recipientsToSend);
        
        // Send the email using the Supabase Edge Function with retry capability
        console.log('[Email Publication] Sending API request to edge function with full recipient list');
        
        await executeWithRetry(async () => {
          // Get a fresh token
          const freshClient = await getFreshSupabaseClient();
          const { data } = await freshClient.auth.getSession();
          const freshToken = data.session?.access_token;
          
          if (!freshToken) {
            throw new Error('No valid token available for edge function call');
          }
          
          // Enhanced error handling and response processing
          try {
            // Log the request being made
            console.log('[Email Publication] Making fetch request to:', this.supabaseEdgeFunctionUrl);
            
            const response = await fetch(this.supabaseEdgeFunctionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${freshToken}`
              },
              body: JSON.stringify({
                emailList: recipientsToSend, // Send all recipients at once
                subject: emailTitle, 
                articleId: article.id, // Add articleId for email_logs tracking
                sender: { 
                  email: "ruth@ruthprissman.co.il", 
                  name: "רות פריסמן" 
                },
                htmlContent: emailContent
              })
            });
            
            // Log complete response information
            console.log('[Email Publication] Edge function response:', {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              type: response.type,
              url: response.url,
              redirected: response.redirected
            });
            
            // Handle response status
            if (!response.ok) {
              // Safely read the response body only once
              let errorBody = '';
              try {
                errorBody = await response.text();
              } catch (textError) {
                errorBody = 'Could not read response body: ' + String(textError);
              }
              
              console.error(`[Email Publication] Failed API response: ${response.status}, Body: ${errorBody}`);
              throw new Error(`Failed with status ${response.status}: ${errorBody}`);
            }
            
            // For successful responses, don't read the body unless needed
            // Just return a success indicator instead of the response object
            return {
              success: true,
              status: response.status
            };
            
          } catch (fetchError: any) {
            console.error('[Email Publication] Fetch error details:', fetchError.message);
            throw fetchError;
          }
        });
        
        console.log('[Email Publication] Successfully sent email to all ' + recipientsToSend.length + ' recipients');
        successfulEmails.push(...recipientsToSend);
      } catch (error: any) {
        console.error('[Email Publication] Error sending to all recipients:', error);
        failedEmails.push(...recipientsToSend);
      }
      
      // 8. Log email sending results
      console.log('[Email Publication] Email sending completed. Successful: ' + successfulEmails.length + ', Failed: ' + failedEmails.length);
      
      // 9. Store email logs
      const logs = [
        ...successfulEmails.map(email => ({
          article_id: article.id,
          email,
          status: 'sent' as const
        })),
        ...failedEmails.map(email => ({
          article_id: article.id,
          email,
          status: 'failed' as const
        }))
      ];
      
      await this.databaseService.logEmailResults(logs);
      console.log('[Email Publication] Email logs stored in database');
      
      // 10. Mark the article as published if needed
      await this.ensureArticleIsPublished(article.id);
      
      // 11. Determine final status and return detailed information
      const finalDeliveredCount = deliveredCount + successfulEmails.length;
      const finalUndeliveredCount = totalSubscribers - finalDeliveredCount;
      
      let status: 'all_sent' | 'partial_sent' | 'new_send' | 'no_subscribers';
      if (finalDeliveredCount === 0) {
        status = 'no_subscribers';
      } else if (finalDeliveredCount === totalSubscribers) {
        status = 'all_sent';
      } else if (deliveredCount > 0) {
        status = 'partial_sent';
      } else {
        status = 'new_send';
      }
      
      return {
        sent: successfulEmails.length > 0,
        status,
        deliveredCount: finalDeliveredCount,
        totalSubscribers,
        undeliveredCount: finalUndeliveredCount
      };
    } catch (error) {
      console.error('[Email Publication] Error in sendEmailPublication for article ' + (article?.id || 'unknown') + ':', error);
      return {sent: false, status: 'no_subscribers', deliveredCount: 0, totalSubscribers: 0, undeliveredCount: 0};
    }
  }

  /**
   * Retry sending emails to failed recipients
   * @param articleId The article ID to retry failed emails for
   * @returns Number of emails that were retried
   */
  public async retryFailedEmails(articleId: number): Promise<number> {
    try {
      // Get failed email recipients
      const failedEmails = await this.databaseService.getFailedEmailRecipients(articleId);
      
      if (failedEmails.length === 0) {
        return 0; // No emails to retry
      }
      
      // Implementation would retry sending emails to those recipients
      console.log("Would retry " + failedEmails.length + " failed emails for article " + articleId);
      
      // For now, just return the count of emails that would be retried
      return failedEmails.length;
    } catch (error) {
      console.error("Error retrying failed emails for article " + articleId + ":", error);
      throw error;
    }
  }

  /**
   * Cleanup failed email logs before inserting successful ones
   */
  private async cleanupFailedEmails(articleId: number, emails: string[]): Promise<void> {
    if (!emails || emails.length === 0) return;
    
    try {
      const client = supabaseClient();
      
      console.log("Cleaning up " + emails.length + " failed email logs for article " + articleId);
      
      for (const email of emails) {
        const { error } = await client
          .from('email_logs')
          .delete()
          .eq('article_id', articleId)
          .eq('email', email)
          .eq('status', 'failed');
        
        if (error) {
          console.error("Error cleaning up failed email log for " + email + ":", error);
        }
      }
      
      console.log("Cleanup completed for article " + articleId);
    } catch (error) {
      console.error("Error in cleanupFailedEmails for article " + articleId + ":", error);
    }
  }

  /**
   * Ensure that an article is marked as published
   */
  private async ensureArticleIsPublished(articleId: number): Promise<void> {
    try {
      // Use executeWithRetry to handle token expiration
      await executeWithRetry(async () => {
        const client = supabaseClient();
        
        const { data, error } = await client
          .from('professional_content')
          .select('published_at')
          .eq('id', articleId)
          .single();
        
        if (error) {
          console.error("Error checking article " + articleId + " publish status:", error);
          return;
        }
        
        // If the article is not already published, mark it as published now
        if (!data.published_at) {
          const { error: updateError } = await client
            .from('professional_content')
            .update({ published_at: new Date().toISOString() })
            .eq('id', articleId);
          
          if (updateError) {
            console.error("Error updating article " + articleId + " publish status:", updateError);
          } else {
            console.log("Article " + articleId + " has been marked as published");
          }
        }
      });
    } catch (error) {
      console.error("Error in ensureArticleIsPublished for article " + articleId + ":", error);
    }
  }
}
