
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StaticLink {
  id: number;
  name: string;
  fixed_text: string;
  url: string | null;
  position: number | null;
  list_type: 'all' | 'general' | 'newsletter' | 'whatsapp' | null;
  created_at: string;
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [staticLinks, setStaticLinks] = useState<StaticLink[]>([]);
  
  useEffect(() => {
    async function fetchStaticLinks() {
      try {
        const { data, error } = await supabase
          .from('static_links')
          .select('*')
          .or('list_type.eq.general,list_type.eq.all')
          .order('position', { ascending: true });
        
        if (error) {
          console.error("Error fetching static links:", error);
          return;
        }
        
        if (data) {
          setStaticLinks(data);
        }
      } catch (error) {
        console.error("Error in fetchStaticLinks:", error);
      }
    }
    
    fetchStaticLinks();
  }, []);
  
  // Format URL to ensure it's valid
  const formatUrl = (url: string | null): string | null => {
    if (!url) return null;
    
    url = url.trim();
    
    // Check if it's an email address
    if (url.includes('@') && !url.startsWith('mailto:')) {
      return `mailto:${url}`;
    }
    
    // Check if it's a WhatsApp number
    if (url.includes('whatsapp') || url.startsWith('+') || 
        url.startsWith('972') || url.match(/^\d{10,15}$/)) {
      
      // Extract only numbers
      const phoneNumber = url.replace(/\D/g, '');
      
      // Make sure it starts with country code
      const formattedNumber = phoneNumber.startsWith('972') 
        ? phoneNumber 
        : `972${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
      
      return `https://wa.me/${formattedNumber}`;
    }
    
    // Add https:// if missing for regular URLs
    if (!url.startsWith('http://') && !url.startsWith('https://') && 
        !url.startsWith('mailto:') && !url.startsWith('#')) {
      return `https://${url}`;
    }
    
    return url;
  };
  
  // Render a static link based on its properties
  const renderStaticLink = (link: StaticLink) => {
    const formattedUrl = formatUrl(link.url);
    
    // WhatsApp link with icon
    if (link.name === 'whatsapp' && formattedUrl) {
      return (
        <li key={link.id}>
          <a 
            href={formattedUrl} 
            className="text-purple-dark hover:text-gold transition-colors inline-flex items-center"
            target="_blank" 
            rel="noopener noreferrer"
          >
            <MessageSquare className="h-4 w-4 ml-1" />
            <span>{link.fixed_text}</span>
          </a>
        </li>
      );
    }
    
    // Regular link with URL
    if (formattedUrl && link.fixed_text) {
      return (
        <li key={link.id}>
          <a 
            href={formattedUrl} 
            className="text-purple-dark hover:text-gold transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            {link.fixed_text}
          </a>
        </li>
      );
    } 
    
    // Plain text without URL
    if (link.fixed_text) {
      return (
        <li key={link.id}>
          <span className="text-purple-dark">{link.fixed_text}</span>
        </li>
      );
    }
    
    return null;
  };
  
  // Group links by their position or some other criteria for different footer sections
  const getLinksForSection = (sectionName: string) => {
    // This is a simple example - you might want to implement more sophisticated grouping
    const sectionLinks = staticLinks.filter(link => {
      if (sectionName === "additional" && link.name !== 'whatsapp') {
        return true;
      }
      if (sectionName === "whatsapp" && link.name === 'whatsapp') {
        return true;
      }
      return false;
    });
    
    return sectionLinks.map(renderStaticLink);
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
            <ul className="space-y-2 mt-2">
              {getLinksForSection("whatsapp")}
            </ul>
          </div>
          
          <div className="text-right">
            <h4 className="font-alef text-xl text-purple-dark mb-4 gold-text-shadow">קישורים</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-purple-dark hover:text-gold transition-colors">אודות</Link></li>
              <li><Link to="/articles" className="text-purple-dark hover:text-gold transition-colors">מאמרים ותרגילים</Link></li>
              <li><Link to="/stories" className="text-purple-dark hover:text-gold transition-colors">סיפורים קצרים</Link></li>
              <li><Link to="/faq" className="text-purple-dark hover:text-gold transition-colors">שאלות ותשובות</Link></li>
              <li><Link to="/unsubscribe" className="text-purple-dark hover:text-gold transition-colors">הסרה מרשימת תפוצה</Link></li>
            </ul>
          </div>
          
          <div className="text-right">
            <h4 className="font-alef text-xl text-purple-dark mb-4 gold-text-shadow">מידע נוסף</h4>
            <ul className="space-y-2">
              {getLinksForSection("additional")}
              <li><Link to="/contact" className="text-purple-dark hover:text-gold transition-colors">צור קשר</Link></li>
              <li><Link to="/appointment" className="text-purple-dark hover:text-gold transition-colors">קביעת פגישה</Link></li>
              <li><Link to="/privacy" className="text-purple-dark hover:text-gold transition-colors">מדיניות פרטיות</Link></li>
              <li><Link to="/terms" className="text-purple-dark hover:text-gold transition-colors">תנאי שימוש</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-purple-dark text-sm">
            © {currentYear} רות פריסמן - קוד הנפש. כל הזכויות שמורות.
            <Link to="/admin/login" className="text-purple-dark hover:text-gold transition-colors ms-3 opacity-50">
              🔑 כניסת מנהל
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
