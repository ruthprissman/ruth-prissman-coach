import { supabaseClient } from '@/lib/supabaseClient';
import { ArticlePublication } from '@/types/article';
import { FutureSession } from '@/types/session';

/**
 * Database Service to handle Supabase interactions
 */
export class DatabaseService {
  /**
   * Get all scheduled publications that haven't been published yet with atomic locking
   */
  public async getScheduledPublications(currentDate: string, lockIdentifier?: string): Promise<any[]> {
    const client = supabaseClient();

    // If no lock identifier provided, just return publications without locking
    if (!lockIdentifier) {
      const { data: scheduledPublications, error: publicationsError } = await client
        .from('article_publications')
        .select(`
          id,
          content_id,
          publish_location,
          scheduled_date,
          processing_lock_at,
          processing_lock_by,
          lock_expires_at,
          professional_content:content_id (
            id,
            title,
            content_markdown,
            category_id,
            contact_email,
            published_at,
            image_url
          )
        `)
        .or(`scheduled_date.is.null,scheduled_date.lte.${currentDate}`)
        .is('published_date', null);

      if (publicationsError) {
        throw publicationsError;
      }

      return scheduledPublications || [];
    }

    // First, clean up expired locks
    await this.cleanExpiredLocks();

    // Get publications that are scheduled, not published, and not currently locked
    const { data: availablePublications, error: fetchError } = await client
      .from('article_publications')
      .select(`
        id,
        content_id,
        publish_location,
        scheduled_date,
        processing_lock_at,
        processing_lock_by,
        lock_expires_at,
        professional_content:content_id (
          id,
          title,
          content_markdown,
          category_id,
          contact_email,
          published_at,
          image_url
        )
      `)
      .or(`scheduled_date.is.null,scheduled_date.lte.${currentDate}`)
      .is('published_date', null)
      .is('processing_lock_at', null);

    if (fetchError) {
      console.error('[DatabaseService] Error fetching available publications:', fetchError);
      throw fetchError;
    }

    if (!availablePublications || availablePublications.length === 0) {
      console.log('[DatabaseService] No available publications found');
      return [];
    }

    // Lock the publications atomically
    const publicationIds = availablePublications.map(p => p.id);
    const lockExpiry = new Date();
    lockExpiry.setMinutes(lockExpiry.getMinutes() + 5); // 5 minute lock

    const { data: lockedPublications, error: lockError } = await client
      .from('article_publications')
      .update({
        processing_lock_at: new Date().toISOString(),
        processing_lock_by: lockIdentifier,
        lock_expires_at: lockExpiry.toISOString()
      })
      .in('id', publicationIds)
      .is('processing_lock_at', null) // Only lock if not already locked
      .select(`
        id,
        content_id,
        publish_location,
        scheduled_date,
        processing_lock_at,
        processing_lock_by,
        lock_expires_at,
        professional_content:content_id (
          id,
          title,
          content_markdown,
          category_id,
          contact_email,
          published_at,
          image_url
        )
      `);

    if (lockError) {
      console.error('[DatabaseService] Error locking publications:', lockError);
      throw lockError;
    }

    console.log(`[DatabaseService] Successfully locked ${lockedPublications?.length || 0} publications`);
    return lockedPublications || [];
  }

  /**
   * Clean up expired publication locks
   */
  public async cleanExpiredLocks(): Promise<void> {
    try {
      const client = supabaseClient();
      const { error } = await client.rpc('clean_expired_publication_locks');
      if (error) {
        console.error('[DatabaseService] Error cleaning expired locks:', error);
      }
    } catch (error) {
      console.error('[DatabaseService] Error in cleanExpiredLocks:', error);
    }
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
   * Mark publication as completed and release lock
   */
  public async markPublicationAsCompleted(publicationId: number): Promise<void> {
    const client = supabaseClient();
    
    const { error } = await client
      .from('article_publications')
      .update({ 
        published_date: new Date().toISOString(),
        processing_lock_at: null,
        processing_lock_by: null,
        lock_expires_at: null
      })
      .eq('id', publicationId);
    
    if (error) {
      throw error;
    }
  }

  /**
   * Release lock on a publication without marking it as completed
   */
  public async releaseLock(publicationId: number): Promise<void> {
    const client = supabaseClient();
    
    const { error } = await client
      .from('article_publications')
      .update({ 
        processing_lock_at: null,
        processing_lock_by: null,
        lock_expires_at: null
      })
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
   * Reset publication date for retry and release lock
   */
  public async resetPublicationDate(publicationId: number): Promise<void> {
    const client = supabaseClient();
    
    const { error } = await client
      .from('article_publications')
      .update({ 
        published_date: null,
        processing_lock_at: null,
        processing_lock_by: null,
        lock_expires_at: null
      })
      .eq('id', publicationId);
    
    if (error) {
      throw error;
    }
  }

  /**
   * Check if an email was already delivered for this article
   */
  public async isEmailAlreadyDelivered(articleId: number, publicationId: number): Promise<boolean> {
    try {
      const client = supabaseClient();
      const { data, error } = await client
        .from('email_delivery_attempts')
        .select('id')
        .eq('article_id', articleId)
        .eq('publication_id', publicationId)
        .eq('status', 'success')
        .limit(1);

      if (error) {
        console.error(`[DatabaseService] Error checking email delivery status:`, error);
        return false; // If we can't check, allow the attempt
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error(`[DatabaseService] Error in isEmailAlreadyDelivered:`, error);
      return false;
    }
  }

  /**
   * Record email delivery attempt
   */
  public async recordEmailDeliveryAttempt(
    articleId: number, 
    publicationId: number, 
    attemptId: string, 
    status: 'sending' | 'success' | 'failed',
    recipientCount?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const client = supabaseClient();
      const { error } = await client
        .from('email_delivery_attempts')
        .upsert({
          article_id: articleId,
          publication_id: publicationId,
          attempt_id: attemptId,
          status,
          recipient_count: recipientCount,
          error_message: errorMessage,
          attempted_at: new Date().toISOString()
        }, {
          onConflict: 'attempt_id'
        });

      if (error) {
        console.error(`[DatabaseService] Error recording email delivery attempt:`, error);
      }
    } catch (error) {
      console.error(`[DatabaseService] Error in recordEmailDeliveryAttempt:`, error);
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

  /**
   * Get all finance categories
   */
  public async getFinanceCategories(): Promise<any[]> {
    try {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('finance_categories')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error('Error getting finance categories:', err);
      throw err;
    }
  }

  /**
   * Create a new finance category
   */
  public async createFinanceCategory(name: string, type: 'income' | 'expense'): Promise<any> {
    try {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('finance_categories')
        .insert({ name, type })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error creating finance category:', err);
      throw err;
    }
  }

  /**
   * Update a finance category
   */
  public async updateFinanceCategory(id: number, name: string, type: 'income' | 'expense'): Promise<any> {
    try {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('finance_categories')
        .update({ name, type })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error updating finance category:', err);
      throw err;
    }
  }

  /**
   * Delete a finance category
   */
  public async deleteFinanceCategory(id: number): Promise<void> {
    try {
      const client = supabaseClient();
      
      const { error } = await client
        .from('finance_categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error deleting finance category:', err);
      throw err;
    }
  }

  /**
   * Get all payment methods
   */
  public async getPaymentMethods(): Promise<any[]> {
    try {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('payment_methods')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error('Error getting payment methods:', err);
      throw err;
    }
  }

  /**
   * Create a new payment method
   */
  public async createPaymentMethod(name: string): Promise<any> {
    try {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('payment_methods')
        .insert({ name })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error creating payment method:', err);
      throw err;
    }
  }

  /**
   * Update a payment method
   */
  public async updatePaymentMethod(id: number, name: string): Promise<any> {
    try {
      const client = supabaseClient();
      
      const { data, error } = await client
        .from('payment_methods')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error updating payment method:', err);
      throw err;
    }
  }

  /**
   * Delete a payment method
   */
  public async deletePaymentMethod(id: number): Promise<void> {
    try {
      const client = supabaseClient();
      
      const { error } = await client
        .from('payment_methods')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error deleting payment method:', err);
      throw err;
    }
  }

  /**
   * Get all recipients who successfully received an email for an article
   */
  public async getSuccessfulEmailRecipients(articleId: number): Promise<string[]> {
    const client = supabaseClient();
    
    const { data, error } = await client
      .from('email_logs')
      .select('email')
      .eq('article_id', articleId)
      .eq('status', 'sent');
    
    if (error) {
      console.error('[DatabaseService] Error fetching successful email recipients:', error);
      throw error;
    }
    
    return data?.map(row => row.email) || [];
  }

  /**
   * Get all recipients who haven't successfully received an email for an article
   */
  public async getUndeliveredEmailRecipients(articleId: number): Promise<string[]> {
    const client = supabaseClient();
    
    // Get all active subscribers
    const allSubscribers = await this.fetchActiveSubscribers();
    
    // Get successful recipients
    const successfulRecipients = await this.getSuccessfulEmailRecipients(articleId);
    
    // Return the difference - those who haven't received the email
    const undeliveredRecipients = allSubscribers.filter(email => 
      !successfulRecipients.includes(email)
    );
    
    console.log(`[DatabaseService] Found ${undeliveredRecipients.length} undelivered recipients for article ${articleId} out of ${allSubscribers.length} total subscribers`);
    
    return undeliveredRecipients;
  }

  /**
   * Check if an article has been completely delivered to all subscribers
   */
  public async isArticleCompletelyDelivered(articleId: number): Promise<boolean> {
    const undeliveredRecipients = await this.getUndeliveredEmailRecipients(articleId);
    return undeliveredRecipients.length === 0;
  }
}
