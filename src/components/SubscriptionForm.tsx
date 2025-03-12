
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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
        .select('id, is_subscribed')
        .eq('email', email)
        .maybeSingle();
        
      if (existingData) {
        if (existingData.is_subscribed) {
          toast({
            title: "הודעה",
            description: "כתובת האימייל כבר רשומה לרשימת התפוצה"
          });
        } else {
          // Re-subscribe
          await supabase
            .from('content_subscribers')
            .update({ is_subscribed: true, unsubscribed_at: null })
            .eq('email', email);
            
          toast({
            title: "הצלחה",
            description: "נרשמת מחדש בהצלחה לרשימת התפוצה!"
          });
        }
      } else {
        // Add new subscriber
        await supabase
          .from('content_subscribers')
          .insert({ email, is_subscribed: true });
          
        toast({
          title: "הצלחה",
          description: "תודה על ההרשמה לרשימת התפוצה!"
        });
      }
      
      setEmail('');
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

  return (
    <div className="w-full max-w-md mx-auto backdrop-blur-sm bg-white/40 p-6 rounded-lg shadow-gold-sm">
      <h3 className="text-xl font-alef mb-3 text-[#4A235A] gold-text-shadow">הצטרפי לרשימת התפוצה</h3>
      <p className="text-purple-light mb-4">קבלי עדכונים, טיפים ומאמרים ישירות לתיבת המייל שלך</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <Input
          type="email"
          placeholder="האימייל שלך"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-gold/30 focus:border-gold/60 transition-all duration-200"
          dir="rtl"
        />
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-dark text-white rounded-md py-2 transition-colors duration-300"
        >
          {loading ? 'רק רגע...' : 'הצטרפי לרשימת התפוצה'}
        </Button>
      </form>
      
      <div className="mt-3 text-xs text-center text-purple-light">
        <p>
          בלחיצה על כפתור ההרשמה אני מאשר/ת קבלת תוכן שבועי כמפורט <Link to="/privacy-policy" className="text-purple-dark hover:text-gold underline">במדיניות הפרטיות</Link>
          <br />
          <Link to="/unsubscribe" className="text-purple-dark hover:text-gold underline">
            להסרה מרשימת התפוצה
          </Link>
        </p>
      </div>
    </div>
  );
}
