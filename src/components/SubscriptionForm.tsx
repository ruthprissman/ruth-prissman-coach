
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subscriberName, setSubscriberName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "שגיאה",
        description: "נא להזין כתובת אימייל",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if email already exists
      const { data: existingData } = await supabase
        .from('content_subscribers')
        .select('id, is_subscribed, name')
        .eq('email', email)
        .maybeSingle();
        
      if (existingData) {
        if (existingData.is_subscribed) {
          toast({
            title: "הודעה",
            description: "כתובת האימייל כבר רשומה לרשימת התפוצה"
          });
        } else {
          // Re-subscribe and update name if provided
          await supabase
            .from('content_subscribers')
            .update({ 
              is_subscribed: true, 
              unsubscribed_at: null,
              name: name || existingData.name 
            })
            .eq('email', email);
            
          toast({
            title: "הצלחה",
            description: "נרשמת מחדש בהצלחה לרשימת התפוצה!"
          });
          setSubmitted(true);
          setSubscriberName(name);
        }
      } else {
        // Add new subscriber
        await supabase
          .from('content_subscribers')
          .insert({ 
            email, 
            is_subscribed: true,
            name: name || null
          });
          
        toast({
          title: "הצלחה",
          description: "תודה על ההרשמה לרשימת התפוצה!"
        });
        setSubmitted(true);
        setSubscriberName(name);
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בתהליך ההרשמה. אנא נסה שנית מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-6 rounded-lg">
        <p className="text-lg text-[#4A235A] mb-2">
          {subscriberName 
            ? `תודה שהצטרפת, ${subscriberName}! בכל שבוע יישלח אלייך מאמר בנושא 'קוד הנפש' ישירות למייל שלך.` 
            : `נרשמת בהצלחה! בכל שבוע יישלח אלייך מאמר בנושא 'קוד הנפש' ישירות למייל שלך.`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <Input
          type="text"
          placeholder="שמך (אופציונלי)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-right border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-gold/30 focus:border-gold/60 transition-all duration-200"
          dir="rtl"
        />
        <Input
          type="email"
          placeholder="האימייל שלך"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full text-right border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-gold/30 focus:border-gold/60 transition-all duration-200"
          dir="rtl"
        />
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-dark text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
        >
          {loading ? 'רק רגע...' : 'הצטרפי לרשימת התפוצה'}
        </Button>
      </form>
      
      <div className="mt-3 text-xs text-center space-x-2 rtl:space-x-reverse text-purple-light">
        <span>בהצטרפות לרשימה אני מאשרת קבלת תוכן שבועי.</span>
        <Link to="/unsubscribe" className="text-purple-dark hover:text-gold underline">
          להסרה מרשימת התפוצה
        </Link>
      </div>
    </div>
  );
}
