
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('נא להזין כתובת אימייל');
      return;
    }
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('תודה על ההרשמה!');
      setEmail('');
      setLoading(false);
    }, 1000);
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
    </div>
  );
}
