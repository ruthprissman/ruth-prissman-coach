
import { supabaseClient } from '@/lib/supabaseClient';
import { ArticlePublication } from '@/types/article';
import { FutureSession } from '@/types/session';

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
  
  /**
   * Create a new future session
   */
  public async createFutureSession(sessionData: Partial<FutureSession>): Promise<FutureSession> {
    console.log(`MEETING_SAVE_DEBUG: Creating future session with data:`, sessionData);
    
    if (!sessionData.patient_id) {
      console.error(`MEETING_SAVE_DEBUG: Patient ID is required but missing`);
      throw new Error("Patient ID is required");
    }
    
    if (!sessionData.session_date) {
      console.error(`MEETING_SAVE_DEBUG: Session date is required but missing`);
      throw new Error("Session date is required");
    }
    
    try {
      const client = await supabaseClient();
      
      console.log(`MEETING_SAVE_DEBUG: Supabase client initialized for session creation`);

      // First check if we have an auth session
      const { data: session } = await client.auth.getSession();
      console.log(`MEETING_SAVE_DEBUG: Auth session check:`, !!session?.session ? "Session exists" : "No session");
      
      if (!session?.session) {
        console.error(`MEETING_SAVE_DEBUG: No authenticated session found`);
        throw new Error("Authentication required");
      }
      
      // Log session details for debugging
      console.log(`MEETING_SAVE_DEBUG: Session user:`, session.session.user.email);
      console.log(`MEETING_SAVE_DEBUG: Session expiry:`, new Date(session.session.expires_at * 1000).toISOString());
      
      // Proceed with insert if authenticated
      const { data, error, status } = await client
        .from('future_sessions')
        .insert({
          ...sessionData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      console.log(`MEETING_SAVE_DEBUG: Future session creation status: ${status}`);
      
      if (error) {
        console.error(`MEETING_SAVE_DEBUG: Error creating future session:`, error);
        throw error;
      }
      
      if (!data) {
        console.error(`MEETING_SAVE_DEBUG: No data returned from insert operation`);
        throw new Error("Failed to create future session: No data returned");
      }
      
      console.log(`MEETING_SAVE_DEBUG: Future session created successfully:`, data);
      
      return data as FutureSession;
    } catch (err) {
      console.error(`MEETING_SAVE_DEBUG: Exception in createFutureSession:`, err);
      throw err;
    }
  }
  
  /**
   * Check if user is authenticated
   */
  public async checkAuthentication(): Promise<boolean> {
    try {
      console.log(`MEETING_SAVE_DEBUG: Checking authentication status`);
      const client = await supabaseClient();
      const { data, error } = await client.auth.getUser();
      
      if (error) {
        console.error(`MEETING_SAVE_DEBUG: Auth error:`, error);
        return false;
      }
      
      const isAuthenticated = !!data.user;
      console.log(`MEETING_SAVE_DEBUG: Authentication check result: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
      
      if (isAuthenticated) {
        console.log(`MEETING_SAVE_DEBUG: Authenticated as:`, data.user.email);
      }
      
      return isAuthenticated;
    } catch (err) {
      console.error(`MEETING_SAVE_DEBUG: Error checking auth:`, err);
      return false;
    }
  }
}
