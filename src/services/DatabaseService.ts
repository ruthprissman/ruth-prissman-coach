
import { supabaseClient } from '@/lib/supabaseClient';
import { ArticlePublication } from '@/types/article';

/**
 * Database Service to handle Supabase interactions
 */
export class DatabaseService {
  /**
   * Get all scheduled publications that haven't been published yet
   */
  public async getScheduledPublications(currentDate: string): Promise<any[]> {
    const client = supabaseClient();

    // Get all publications that are scheduled and not yet published
    const { data: scheduledPublications, error: publicationsError } = await client
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
      .lte('scheduled_date', currentDate)
      .is('published_date', null);

    if (publicationsError) {
      throw publicationsError;
    }

    return scheduledPublications || [];
  }

  /**
   * Get article by ID
   */
  public async getArticle(articleId: number): Promise<any> {
    const client = supabaseClient();
    
    const { data, error } = await client
      .from('professional_content')
      .select('published_at')
      .eq('id', articleId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  }

  /**
   * Update article published date
   */
  public async updateArticlePublishedDate(articleId: number): Promise<void> {
    const client = supabaseClient();
    
    const { error } = await client
      .from('professional_content')
      .update({ published_at: new Date().toISOString() })
      .eq('id', articleId);
    
    if (error) {
      throw error;
    }
  }

  /**
   * Mark publication as completed
   */
  public async markPublicationAsCompleted(publicationId: number): Promise<void> {
    const client = supabaseClient();
    
    const { error } = await client
      .from('article_publications')
      .update({ published_date: new Date().toISOString() })
      .eq('id', publicationId);
    
    if (error) {
      throw error;
    }
  }

  /**
   * Get publication by ID
   */
  public async getPublication(publicationId: number): Promise<ArticlePublication | null> {
    const client = supabaseClient();
    
    const { data, error } = await client
      .from('article_publications')
      .select('*')
      .eq('id', publicationId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as ArticlePublication;
  }

  /**
   * Reset publication date for retry
   */
  public async resetPublicationDate(publicationId: number): Promise<void> {
    const client = supabaseClient();
    
    const { error } = await client
      .from('article_publications')
      .update({ published_date: null })
      .eq('id', publicationId);
    
    if (error) {
      throw error;
    }
  }

  /**
   * Get email logs for an article
   */
  public async getEmailLogs(articleId: number, status: 'sent' | 'failed'): Promise<{ count: number }> {
    const client = supabaseClient();
    
    const { data, error } = await client
      .from('email_logs')
      .select('count')
      .eq('article_id', articleId)
      .eq('status', status)
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows returned' error
      throw error;
    }
    
    return data || { count: 0 };
  }

  /**
   * Get failed email recipients for an article
   */
  public async getFailedEmailRecipients(articleId: number): Promise<string[]> {
    const client = supabaseClient();
    
    const { data, error } = await client
      .from('email_logs')
      .select('email')
      .eq('article_id', articleId)
      .eq('status', 'failed');
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Extract emails and remove duplicates
    const failedEmails = [...new Set(data.map((item: any) => item.email))] as string[];
    return failedEmails;
  }

  /**
   * Fetch active email subscribers from the database
   */
  public async fetchActiveSubscribers(): Promise<string[]> {
    const client = supabaseClient();
    
    const { data, error } = await client
      .from('content_subscribers')
      .select('email')
      .eq('is_subscribed', true);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Extract emails and remove duplicates
    const uniqueEmails = [...new Set(data.map((sub: { email: string }) => sub.email))] as string[];
    return uniqueEmails;
  }

  /**
   * Fetch static links from the database
   */
  public async fetchStaticLinks(): Promise<any[]> {
    const client = supabaseClient();
    
    const { data, error } = await client
      .from('static_links')
      .select('*')
      .or('list_type.eq.general,list_type.eq.all');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  }

  /**
   * Log email results
   */
  public async logEmailResults(logs: any[]): Promise<void> {
    if (!logs || logs.length === 0) return;
    
    const client = supabaseClient();
    
    const logsWithTimestamp = logs.map(log => ({
      ...log,
      sent_at: new Date().toISOString()
    }));
    
    const { error } = await client
      .from('email_logs')
      .insert(logsWithTimestamp);
    
    if (error) {
      throw error;
    }
  }
}
