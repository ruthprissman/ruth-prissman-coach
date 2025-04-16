import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export function Footer() {
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
              <li>
                <a 
                  href="https://wa.me/972556620273" 
                  className="text-purple-dark hover:text-gold transition-colors inline-flex items-center"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="h-4 w-4 ml-1" />
                  <span>שלחי הודעת וואטסאפ</span>
                </a>
              </li>
            </ul>
          </div>
          
          <div className="text-right">
            <h4 className="font-alef text-xl text-purple-dark mb-4 gold-text-shadow">קישורים</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-purple-dark hover:text-gold transition-colors">אודות</Link></li>
              <li><Link to="/articles" className="text-purple-dark hover:text-gold transition-colors">מאמרים</Link></li>
              <li><Link to="/poems" className="text-purple-dark hover:text-gold transition-colors">שירים</Link></li>
              <li><Link to="/stories" className="text-purple-dark hover:text-gold transition-colors">סיפורים קצרים</Link></li>
              <li><Link to="/humor" className="text-purple-dark hover:text-gold transition-colors">לצחוק ברצינות</Link></li>
              <li><Link to="/faq" className="text-purple-dark hover:text-gold transition-colors">שאלות ותשובות</Link></li>
              <li><Link to="/unsubscribe" className="text-purple-dark hover:text-gold transition-colors">הסרה מרשימת תפוצה</Link></li>
            </ul>
          </div>
          
          <div className="text-right">
            <h4 className="font-alef text-xl text-purple-dark mb-4 gold-text-shadow">מידע נוסף</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-purple-dark hover:text-gold transition-colors">צור קשר</Link></li>
              <li><Link to="/privacy-policy" className="text-purple-dark hover:text-gold transition-colors">מדיניות פרטיות</Link></li>
              <li><Link to="/terms" className="text-purple-dark hover:text-gold transition-colors">תנאי שימוש</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center mb-3">
              <img 
                src="https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs//blwlogo.png" 
                alt="לוגו רות פריסמן" 
                className="h-10 w-auto ml-2"
              />
            </div>
            <p className="text-purple-dark text-sm">
              © 2025 רות פריסמן - מאמנת קוד הנפש. כל הזכויות שמורות
            </p>
            <Link 
              to="/admin/login" 
              className="text-purple-dark hover:text-gold transition-colors text-xs opacity-50 mt-2"
            >
              🔑 כניסת מנהל
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
