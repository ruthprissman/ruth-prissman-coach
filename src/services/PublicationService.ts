import { Article, PublishTarget } from '@/types/article';
import { supabaseClient } from '@/lib/supabaseClient';

const PUBLICATION_COOLDOWN_HOURS = 24;

export const publishArticle = async (
  articleId: number,
  publishTargets: PublishTarget[]
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // 1. Validation: Check if article exists and is not already published to the selected targets
    const { data: existingPublications, error: selectError } = await supabaseClient()
      .from('article_publications')
      .select('*')
      .eq('article_id', articleId)
      .in('target', publishTargets);

    if (selectError) {
      console.error('Error checking existing publications:', selectError);
      return { success: false, error: 'Failed to check existing publications.' };
    }

    const alreadyPublishedTargets = existingPublications?.map(pub => pub.target) || [];
    const newTargets = publishTargets.filter(target => !alreadyPublishedTargets.includes(target));

    if (newTargets.length === 0) {
      return { success: false, error: 'Article is already published to all selected targets.' };
    }

    // 2. Check publication cooldown
    const { data: lastPublication, error: cooldownError } = await supabaseClient()
      .from('article_publications')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (cooldownError) {
      console.error('Error checking publication cooldown:', cooldownError);
      return { success: false, error: 'Failed to check publication cooldown.' };
    }

    if (lastPublication && lastPublication.length > 0) {
      const lastPublicationDate = new Date(lastPublication[0].created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - lastPublicationDate.getTime()) / (1000 * 3600);

      if (diffInHours < PUBLICATION_COOLDOWN_HOURS) {
        return { success: false, error: `You must wait ${PUBLICATION_COOLDOWN_HOURS} hours between publications. Time remaining: ${Math.ceil(PUBLICATION_COOLDOWN_HOURS - diffInHours)} hours.` };
      }
    }

    // 3. Proceed with publication
    const { data: articleData, error: articleError } = await supabaseClient()
      .from('professional_content')
      .select('title, content_markdown')
      .eq('id', articleId)
      .single();

    if (articleError) {
      console.error('Error fetching article content:', articleError);
      return { success: false, error: 'Failed to fetch article content.' };
    }

    if (!articleData) {
      return { success: false, error: 'Article not found.' };
    }

    const publicationPromises = newTargets.map(async (target) => {
      try {
        switch (target) {
          case 'facebook':
            return await publishToFacebook(articleData.title, articleData.content_markdown || '');
          case 'email':
            return await publishViaEmail(articleId, articleData.title, articleData.content_markdown || '');
          default:
            throw new Error(`Unsupported publish target: ${target}`);
        }
      } catch (error: any) {
        console.error(`Error publishing to ${target}:`, error);
        return { success: false, error: `Failed to publish to ${target}. ${error.message}` };
      }
    });

    const results = await Promise.all(publicationPromises);
    const successfulPublications = results.filter(result => result.success).length;
    const failedPublications = results.filter(result => !result.success);

    // 4. Record successful publications in the database
    const publicationsToInsert = newTargets.map(target => ({
      article_id: articleId,
      target: target,
      status: 'success'
    }));

    const { error: insertError } = await supabaseClient()
      .from('article_publications')
      .insert(publicationsToInsert);

    if (insertError) {
      console.error('Error recording publications:', insertError);
      return { success: false, error: 'Failed to record publications.' };
    }

    if (failedPublications.length > 0) {
      const errorMessages = failedPublications.map(pub => pub.error).join('\n');
      return { success: successfulPublications > 0, error: `Published to ${successfulPublications} targets with errors:\n${errorMessages}` };
    }

    return { success: true, error: null };

  } catch (error: any) {
    console.error('Error publishing article:', error);
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
};

const publishToFacebook = async (title: string, content: string): Promise<{ success: boolean; error: string | null }> => {
  // Simulate Facebook publication
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Published to Facebook: ${title}`);
  return { success: true, error: null };
};

const publishViaEmail = async (articleId: number, title: string, content: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    // 1. Fetch subscribers
    const subscribers = await fetchSubscribers();
    if (!subscribers || subscribers.length === 0) {
      return { success: false, error: 'No subscribers found.' };
    }

    // 2. Send email to each subscriber
    const sendPromises = subscribers.map(async (email) => {
      try {
        // Simulate sending email
        await sendEmail(email, title, content);
        return { success: true, email };
      } catch (error: any) {
        console.error(`Error sending email to ${email}:`, error);
        return { success: false, email, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successfulEmails = results.filter(result => result.success).length;
    const failedEmails = results.filter(result => !result.success);

    if (failedEmails.length > 0) {
      const errorMessages = failedEmails.map(email => `Failed to send to ${email}`).join('\n');
      return { success: successfulEmails > 0, error: `Sent to ${successfulEmails} emails with errors:\n${errorMessages}` };
    }

    return { success: true, error: null };

  } catch (error: any) {
    console.error('Error publishing via email:', error);
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
};

const fetchSubscribers = async (): Promise<string[] | null> => {
  try {
    const { data, error } = await supabaseClient()
      .from('content_subscribers')
      .select('email')
      .eq('is_subscribed', true);

    if (error) {
      console.error('Error fetching subscribers:', error);
      return null;
    }

    if (!data) {
      console.warn('No subscribers found.');
      return [];
    }

    const recips = data as string[];
    return recips;

  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return null;
  }
};

const sendEmail = async (recipient: string, title: string, content: string): Promise<void> => {
  try {
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Sent email to ${recipient}: ${title}`);
  } catch (error) {
    console.error(`Error sending email to ${recipient}:`, error);
    throw new Error(`Failed to send email to ${recipient}`);
  }
};

export const fetchFailedPublications = async (): Promise<{ article_id: number; target: string; }[] | null> => {
  try {
    const { data, error } = await supabaseClient()
      .from('article_publications')
      .select('article_id, target')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching failed publications:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching failed publications:', error);
    return null;
  }
};

export const resendPublication = async (articleId: number, target: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    // 1. Fetch article content
    const { data: articleData, error: articleError } = await supabaseClient()
      .from('professional_content')
      .select('title, content_markdown')
      .eq('id', articleId)
      .single();

    if (articleError) {
      console.error('Error fetching article content:', articleError);
      return { success: false, error: 'Failed to fetch article content.' };
    }

    if (!articleData) {
      return { success: false, error: 'Article not found.' };
    }

    // 2. Resend publication based on target
    let result;
    switch (target) {
      case 'facebook':
        result = await publishToFacebook(articleData.title, articleData.content_markdown || '');
        break;
      case 'email':
        result = await publishViaEmail(articleId, articleData.title, articleData.content_markdown || '');
        break;
      default:
        return { success: false, error: `Unsupported publish target: ${target}` };
    }

    // 3. Update publication status in the database
    if (result.success) {
      const { error: updateError } = await supabaseClient()
        .from('article_publications')
        .update({ status: 'success' })
        .eq('article_id', articleId)
        .eq('target', target);

      if (updateError) {
        console.error('Error updating publication status:', updateError);
        return { success: false, error: 'Failed to update publication status.' };
      }
    } else {
      return result; // Return the error from the publication attempt
    }

    return { success: true, error: null };

  } catch (error: any) {
    console.error('Error resending publication:', error);
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
};

export const fetchStorySubscribers = async (): Promise<string[] | null> => {
  try {
    const { data, error } = await supabaseClient()
      .from('story_subscribers')
      .select('email')
      .eq('is_subscribed', true);

    if (error) {
      console.error('Error fetching subscribers:', error);
      return null;
    }

    if (!data) {
      console.warn('No subscribers found.');
      return [];
    }

    const recips = data as string[];
    return recips;
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return null;
  }
};
