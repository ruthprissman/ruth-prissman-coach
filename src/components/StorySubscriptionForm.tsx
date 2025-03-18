
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const supabaseClient = supabase();

export function StorySubscriptionForm() {
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
      const { data: existingData } = await supabaseClient
        .from('story_subscribers')
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
          await supabaseClient
            .from('story_subscribers')
            .update({ is_subscribed: true })
            .eq('email', email);
            
          toast({
            title: "הצלחה",
            description: "נרשמת מחדש בהצלחה לרשימת התפוצה!"
          });
        }
      } else {
        // Add new subscriber
        await supabaseClient
          .from('story_subscribers')
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
    <div className="w-full max-w-md mx-auto shadow-lg p-8 rounded-lg bg-white">
      <h3 className="text-xl text-center font-bold mb-4">הצטרפ/י לרשימת התפוצה</h3>
      <p className="text-gray-600 mb-6 text-center">וקבל/י סיפורים חדשים ישירות למייל</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="האימייל שלך"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full"
          dir="ltr"
        />
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'מבצע רישום...' : 'הירשם/י לרשימת התפוצה'}
        </Button>
      </form>
      
      <div className="mt-3 text-xs text-center text-gray-500">
        <p>
          בלחיצה על כפתור ההרשמה אני מאשר/ת קבלת תוכן שבועי כמפורט <Link to="/privacy-policy" className="text-purple-600 hover:text-purple-800 underline">במדיניות הפרטיות</Link>
          <br />
          <Link to="/unsubscribe?list=stories" className="text-purple-600 hover:text-purple-800 underline">
            להסרה מרשימת התפוצה
          </Link>
        </p>
      </div>
    </div>
  );
}
