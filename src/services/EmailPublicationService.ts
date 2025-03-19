
import { supabaseClient } from '@/lib/supabaseClient';
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
    } catch (error) {
      console.error("Error in ensureArticleIsPublished for article " + articleId + ":", error);
    }
  }
}
