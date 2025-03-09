
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Mail, Phone } from 'lucide-react';

interface StaticLink {
  id: number;
  name: string;
  fixed_text: string;
  url: string | null;
  list_type: string;
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [links, setLinks] = useState<StaticLink[]>([]);
  
  useEffect(() => {
    async function fetchLinks() {
      const { data, error } = await supabase
        .from('static_links')
        .select('*')
        .or('list_type.eq.general,list_type.eq.all');
      
      if (error) {
        console.error('Error fetching links:', error);
        return;
      }
      
      setLinks(data || []);
    }
    
    fetchLinks();
  }, []);
  
  const formatLink = (link: StaticLink) => {
    // Format WhatsApp link
    if (link.name === 'whatsapp' && link.url) {
      const phoneNumber = link.url.replace(/\D/g, '');
      const formattedNumber = phoneNumber.startsWith('972') 
        ? phoneNumber 
        : `972${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
      
      return (
        <a 
          href={`https://wa.me/${formattedNumber}`} 
          className="flex items-center justify-center gap-1 text-purple-dark hover:text-gold transition-colors font-alef font-bold"
          target="_blank" 
          rel="noopener noreferrer"
        >
          {link.fixed_text}
          <Phone className="h-4 w-4" />
        </a>
      );
    }
    
    // Email link
    if (link.name === 'email' && link.url) {
      return (
        <a 
          href={`mailto:${link.url}`} 
          className="flex items-center justify-center gap-1 text-purple-dark hover:text-gold transition-colors font-alef font-bold"
        >
          {link.fixed_text}
          <Mail className="h-4 w-4" />
        </a>
      );
    }
    
    // Regular link with URL
    if (link.url) {
      return (
        <a 
          href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
          className="text-purple-dark hover:text-gold transition-colors font-alef font-bold"
          target="_blank" 
          rel="noopener noreferrer"
        >
          {link.fixed_text}
        </a>
      );
    }
    
    // Just text without URL
    return <span className="text-purple-dark font-alef font-bold">{link.fixed_text}</span>;
  };
  
  return (
    <footer className="bg-white/80 backdrop-blur-sm mt-12 py-8 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-right">
            <h4 className="font-alef text-xl text-purple-dark mb-4 gold-text-shadow">רות פריסמן - קוד הנפש</h4>
            <p className="text-purple-light mb-2">מבט חדש על חיים מוכרים</p>
            <p className="text-purple-dark">טלפון: 055-6620273</p>
            <p className="text-purple-dark">אימייל: RuthPrissman@gmail.com</p>
          </div>
          
          <div className="text-right">
            <h4 className="font-alef text-xl text-purple-dark mb-4 gold-text-shadow">קישורים</h4>
            <ul className="space-y-2">
              {links.filter(link => link.name !== 'whatsapp' && link.name !== 'email').map(link => (
                <li key={link.id}>
                  {formatLink(link)}
                </li>
              ))}
              <li><Link to="/about" className="text-purple-dark hover:text-gold transition-colors font-alef font-bold">אודות</Link></li>
              <li><Link to="/articles" className="text-purple-dark hover:text-gold transition-colors font-alef font-bold">מאמרים ותרגילים</Link></li>
              <li><Link to="/stories" className="text-purple-dark hover:text-gold transition-colors font-alef font-bold">סיפורים קצרים</Link></li>
              <li><Link to="/faq" className="text-purple-dark hover:text-gold transition-colors font-alef font-bold">שאלות ותשובות</Link></li>
              <li><Link to="/unsubscribe" className="text-purple-dark hover:text-gold transition-colors font-alef font-bold">הסרה מרשימת תפוצה</Link></li>
            </ul>
          </div>
          
          <div className="text-right">
            <h4 className="font-alef text-xl text-purple-dark mb-4 gold-text-shadow">מידע נוסף</h4>
            <ul className="space-y-2">
              {links.filter(link => link.name === 'whatsapp' || link.name === 'email').map(link => (
                <li key={link.id}>
                  {formatLink(link)}
                </li>
              ))}
              <li><Link to="/contact" className="text-purple-dark hover:text-gold transition-colors font-alef font-bold">צור קשר</Link></li>
              <li><Link to="/appointment" className="text-purple-dark hover:text-gold transition-colors font-alef font-bold">קביעת פגישה</Link></li>
              <li><Link to="/privacy" className="text-purple-dark hover:text-gold transition-colors font-alef font-bold">מדיניות פרטיות</Link></li>
              <li><Link to="/terms" className="text-purple-dark hover:text-gold transition-colors font-alef font-bold">תנאי שימוש</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-purple-dark text-sm">
            © {currentYear} רות פריסמן - קוד הנפש. כל הזכויות שמורות.
            <Link to="/admin/login" className="text-purple-dark hover:text-gold transition-colors ms-3 opacity-50 font-alef">
              🔑 כניסת מנהל
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
