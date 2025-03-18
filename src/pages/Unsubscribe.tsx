import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabaseClient } from '@/lib/supabaseClient';
import PublicLayout from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/Spinner';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, Check, X } from 'lucide-react';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'initial' | 'submitting' | 'success' | 'error' | 'not_found' | 'already_unsubscribed'>('initial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const list = searchParams.get('list');
  const queryEmail = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [queryEmail]);

  const handleUnsubscribe = async () => {
    if (!email) {
      toast({
        title: "שגיאה",
        description: "יש להזין כתובת אימייל",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check which list to unsubscribe from
      const supabase = supabaseClient();
      
      if (list === 'stories') {
        // Unsubscribe from story list
        const { data, error } = await supabase
          .from('story_subscribers')
          .select('id, is_subscribed')
          .eq('email', email)
          .maybeSingle();
        
      if (error) throw error;
      
      if (!data) {
        setStatus('not_found');
      } else if (!data.is_subscribed) {
        setStatus('already_unsubscribed');
      } else {
        // Update subscription status
        const { error: updateError } = await supabase
          .from('story_subscribers')
          .update({ is_subscribed: false })
          .eq('id', data.id);
        
        if (updateError) throw updateError;
        
        setStatus('success');
      }
    } else if (list === 'newsletter') {
      // Unsubscribe from newsletter
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('id, is_subscribed')
        .eq('email', email)
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data) {
        setStatus('not_found');
      } else if (!data.is_subscribed) {
        setStatus('already_unsubscribed');
      } else {
        // Update subscription status
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ is_subscribed: false })
          .eq('id', data.id);
        
        if (updateError) throw updateError;
        
        setStatus('success');
      }
    } else if (queryEmail) {
      // Handle automatic unsubscribe with queryEmail and token
      if (list === 'stories') {
        try {
          // Verify token matches the email
          const supabase = supabaseClient();
          const { data: userData, error: fetchError } = await supabase
            .from('story_subscribers')
            .select('id, unsubscribe_token')
            .eq('email', queryEmail)
            .single();
          
          if (fetchError) throw fetchError;
          
          if (userData.unsubscribe_token !== token) {
            throw new Error('Invalid unsubscribe token');
          }
          
          // Update unsubscribe status
          const { error: updateError } = await supabase
            .from('story_subscribers')
            .update({ is_subscribed: false })
            .eq('id', userData.id);
          
          if (updateError) throw updateError;
          
          setStatus('success');
        } catch (error) {
          console.error('Error processing automatic unsubscribe:', error);
          setStatus('error');
        }
      } else if (list === 'newsletter') {
        try {
          // Verify token matches the email
          const supabase = supabaseClient();
          const { data: userData, error: fetchError } = await supabase
            .from('newsletter_subscribers')
            .select('id, unsubscribe_token')
            .eq('email', queryEmail)
            .single();
          
          if (fetchError) throw fetchError;
          
          if (userData.unsubscribe_token !== token) {
            throw new Error('Invalid unsubscribe token');
          }
          
          // Update unsubscribe status
          const { error: updateError } = await supabase
            .from('newsletter_subscribers')
            .update({ is_subscribed: false })
            .eq('id', userData.id);
          
          if (updateError) throw updateError;
          
          setStatus('success');
        } catch (error) {
          console.error('Error processing automatic unsubscribe:', error);
          setStatus('error');
        }
      }
    } else {
      toast({
        title: "שגיאה",
        description: "יש לבחור רשימת תפוצה להסרה",
        variant: "destructive"
      });
    }
  } catch (error: any) {
    console.error('Error unsubscribing:', error);
    setStatus('error');
    toast({
      title: "שגיאה",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <PublicLayout title="הסרה מרשימת התפוצה">
      <div className="container max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          הסרה מרשימת התפוצה
        </h2>
        
        {status === 'initial' && (
          <>
            <p className="text-gray-600 mb-6">
              הזינו את כתובת האימייל שלכם כדי להסיר אותה מרשימת התפוצה.
            </p>
            <Input
              type="email"
              placeholder="האימייל שלך"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4"
              dir="ltr"
            />
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleUnsubscribe}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  מסיר מהרשימה...
                  <Spinner className="ml-2" />
                </>
              ) : (
                'הסר אותי מרשימת התפוצה'
              )}
            </Button>
          </>
        )}
        
        {status === 'submitting' && (
          <div className="text-gray-600">
            מסיר את האימייל מרשימת התפוצה...
            <Spinner className="ml-2" />
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-green-600">
            <Check className="inline-block mr-2" />
            האימייל הוסר בהצלחה מרשימת התפוצה.
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-red-600">
            <X className="inline-block mr-2" />
            אירעה שגיאה בעת ההסרה מרשימת התפוצה. אנא נסה שוב מאוחר יותר.
          </div>
        )}
        
        {status === 'not_found' && (
          <div className="text-yellow-600">
            <X className="inline-block mr-2" />
            כתובת האימייל לא נמצאה ברשימת התפוצה.
          </div>
        )}
        
        {status === 'already_unsubscribed' && (
          <div className="text-gray-600">
            <Check className="inline-block mr-2" />
            כתובת האימייל כבר הוסרה מרשימת התפוצה.
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <Link to="/" className="text-purple-600 hover:text-purple-800 underline">
            חזרה לעמוד הבית
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Unsubscribe;
