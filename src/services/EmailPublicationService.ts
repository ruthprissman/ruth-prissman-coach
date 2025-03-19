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
   * Send email publication for an article
   * @param article The article to publish via email
   * @returns Promise<boolean> Whether the email was sent successfully
   */
  public async sendEmailPublication(article: any): Promise<boolean> {
    console.log('[Email Publication] Starting email publication process for article ' + article.id + ': "' + article.title + '"');
    
    try {
      // Validate that the article has the required properties
      if (!article || !article.id) {
        console.error('[Email Publication] Invalid article object provided');
        return false;
      }
      
      // Ensure article has title and content
      if (!article.title || !article.content_markdown) {
        console.error('[Email Publication] Article is missing title or content: ' + JSON.stringify({
          id: article.id,
          hasTitle: !!article.title,
          hasContent: !!article.content_markdown
        }));
        return false;
      }
      
      // 1. Fetch all active email subscribers
      const subscribers = await this.databaseService.fetchActiveSubscribers();
      if (!subscribers || subscribers.length === 0) {
        console.log('[Email Publication] No active subscribers found for article ' + article.id);
        return false;
      }
      
      console.log('[Email Publication] Found ' + subscribers.length + ' active subscribers for article ' + article.id);
      
      // 2. Fetch any static links to include in the email
      const staticLinks = await this.databaseService.fetchStaticLinks();
      console.log('[Email Publication] Retrieved ' + (staticLinks?.length || 0) + ' static links for email template');
      
      // 3. Generate email HTML content
      const emailContent = this.emailGenerator.generateEmailContent({
        title: article.title || 'No Title',
        content: article.content_markdown || '',
        staticLinks: staticLinks || []
      });
      
      console.log('[Email Publication] Generated email content, length: ' + emailContent.length);
      
      // 4. Validate the generated email content
      const diagnosisResult = this.emailDiagnostics.diagnoseEmailContent(
        emailContent, 
        subscribers[0], // Use first email for diagnosis
        article.id
      );
      
      if (!diagnosisResult.isValid) {
        console.error('[Email Publication] Email content validation failed for article ' + article.id + ': ' + diagnosisResult.issues.join('; '));
        return false;
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
        return false;
      }
      
      console.log('[Email Publication] Authentication token obtained, length: ' + token.length);
      console.log('[Email Publication] Using Supabase Edge Function URL: ' + this.supabaseEdgeFunctionUrl);
      
      // For debugging only: Send to first 2 subscribers in development
      const recipientsToSend = process.env.NODE_ENV === 'development' 
        ? subscribers.slice(0, 2) 
        : subscribers;
      
      for (const recipientEmail of recipientsToSend) {
        try {
          console.log('[Email Publication] Preparing to send email to: ' + recipientEmail);
          
          // First clean up any previous failed attempts for this recipient
          await this.cleanupFailedEmails(article.id, [recipientEmail]);
          
          // Send the email using the Supabase Edge Function with retry capability
          console.log('[Email Publication] Sending API request to edge function for: ' + recipientEmail);
          
          await executeWithRetry(async () => {
            // Get a fresh token each time to ensure it's valid
            const freshClient = await getFreshSupabaseClient();
            const { data } = await freshClient.auth.getSession();
            const freshToken = data.session?.access_token;
            
            if (!freshToken) {
              throw new Error('No valid token available for edge function call');
            }
            
            const response = await fetch(this.supabaseEdgeFunctionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${freshToken}`
              },
              body: JSON.stringify({
                to: recipientEmail,
                subject: article.title,
                html: emailContent,
                articleId: article.id
              })
            });
            
            console.log('[Email Publication] Edge function response status: ' + response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed with status ${response.status}: ${errorText}`);
            }
            
            return response;
          });
          
          console.log('[Email Publication] Successfully sent email to: ' + recipientEmail);
          successfulEmails.push(recipientEmail);
        } catch (error: any) {
          console.error('[Email Publication] Error sending to ' + recipientEmail + ':', error);
          failedEmails.push(recipientEmail);
        }
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
      
      return successfulEmails.length > 0;
    } catch (error) {
      console.error('[Email Publication] Error in sendEmailPublication for article ' + (article?.id || 'unknown') + ':', error);
      return false;
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
