
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Mail, UserMinus } from 'lucide-react';

// Supabase configuration
const supabaseUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function StorySubscriptionForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [unsubscribeEmail, setUnsubscribeEmail] = useState('');
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);

  const subscribeToStories = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('נא להזין כתובת אימייל');
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('story_subscribers')
        .select('*')
        .eq('email', email);
      
      if (existingUser && existingUser.length > 0) {
        toast.info('את/ה כבר רשום לרשימת התפוצה של הסיפורים.');
        setLoading(false);
        return;
      }
      
      // Insert new subscriber
      const { error } = await supabase
        .from('story_subscribers')
        .insert([{ 
          email, 
          first_name: firstName || null
        }]);
      
      if (error) {
        console.error('Subscription error:', error);
        toast.error('שגיאה בהרשמה, נסה שוב מאוחר יותר.');
      } else {
        toast.success('נרשמת בהצלחה! תקבלי עדכון כאשר יתפרסם סיפור חדש.');
        setEmail('');
        setFirstName('');
      }
    } catch (err) {
      console.error('Subscription exception:', err);
      toast.error('שגיאה בהרשמה, נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromStories = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!unsubscribeEmail) {
      toast.error('נא להזין כתובת אימייל להסרה');
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if email exists before deleting
      const { data: existingUser } = await supabase
        .from('story_subscribers')
        .select('*')
        .eq('email', unsubscribeEmail);
      
      if (!existingUser || existingUser.length === 0) {
        toast.info('אימייל זה אינו רשום ברשימת התפוצה.');
        setLoading(false);
        return;
      }
      
      // Delete subscriber
      const { error } = await supabase
        .from('story_subscribers')
        .delete()
        .eq('email', unsubscribeEmail);
      
      if (error) {
        console.error('Unsubscribe error:', error);
        toast.error('שגיאה בהסרה, נסה שוב מאוחר יותר.');
      } else {
        toast.success('הוסרת מרשימת התפוצה בהצלחה.');
        setUnsubscribeEmail('');
        setShowUnsubscribe(false);
      }
    } catch (err) {
      console.error('Unsubscribe exception:', err);
      toast.error('שגיאה בהסרה, נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-6 border border-gold/20">
      <h3 className="text-2xl font-alef font-bold text-center text-[#4A235A] gold-text-shadow mb-6">
        רישום לרשימת תפוצה לקבלת סיפורים למייל
      </h3>
      
      <p className="text-gray-600 mb-6 text-center">
        הרשמה לעדכונים בלעדיים כאשר מתפרסמים סיפורים חדשים.
        <br />
        <span className="text-sm font-semibold text-purple-dark">
          * זוהי רשימת תפוצה ייעודית לסיפורים בלבד, ואינה הרשימה הכללית של האתר.
        </span>
      </p>
      
      {!showUnsubscribe ? (
        <>
          <form onSubmit={subscribeToStories} className="space-y-4">
            <div className="relative">
              <Mail className="absolute right-3 top-3 text-gray-400" size={16} />
              <Input
                type="email"
                placeholder="האימייל שלך *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10 text-right"
                required
                dir="rtl"
              />
            </div>
            
            <div className="relative">
              <User className="absolute right-3 top-3 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="שם פרטי (לא חובה)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="pr-10 text-right"
                dir="rtl"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gold hover:bg-gold-dark text-[#4A235A] font-bold"
              disabled={loading}
            >
              {loading ? 'רק רגע...' : 'הצטרפי לרשימת התפוצה'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowUnsubscribe(true)}
              className="text-sm text-gray-500 hover:text-[#4A235A] underline"
            >
              להסרה מרשימת התפוצה
            </button>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={unsubscribeFromStories} className="space-y-4">
            <div className="relative">
              <Mail className="absolute right-3 top-3 text-gray-400" size={16} />
              <Input
                type="email"
                placeholder="האימייל שלך להסרה מהרשימה"
                value={unsubscribeEmail}
                onChange={(e) => setUnsubscribeEmail(e.target.value)}
                className="pr-10 text-right"
                required
                dir="rtl"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-300"
              disabled={loading}
            >
              <UserMinus size={18} className="ml-2" />
              {loading ? 'רק רגע...' : 'הסר אותי מרשימת התפוצה'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowUnsubscribe(false)}
              className="text-sm text-gray-500 hover:text-[#4A235A] underline"
            >
              חזרה לטופס ההרשמה
            </button>
          </div>
        </>
      )}
    </div>
  );
}
