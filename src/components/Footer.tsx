
import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white/80 backdrop-blur-sm mt-12 py-8 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-right">
            <h4 className="font-alef text-xl text-gray-800 mb-4 gold-text-shadow">רות פריסמן - קוד הנפש</h4>
            <p className="text-gray-600 mb-2">מבט חדש על חיים מוכרים</p>
            <p className="text-gray-600">טלפון: 055-6620273</p>
            <p className="text-gray-600">אימייל: RuthPrissman@gmail.com</p>
          </div>
          
          <div className="text-right">
            <h4 className="font-alef text-xl text-gray-800 mb-4 gold-text-shadow">קישורים</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-600 hover:text-gold transition-colors">אודות</Link></li>
              <li><Link to="/articles" className="text-gray-600 hover:text-gold transition-colors">מאמרים ותרגילים</Link></li>
              <li><Link to="/stories" className="text-gray-600 hover:text-gold transition-colors">סיפורים טיפוליים</Link></li>
              <li><Link to="/faq" className="text-gray-600 hover:text-gold transition-colors">שאלות ותשובות</Link></li>
            </ul>
          </div>
          
          <div className="text-right">
            <h4 className="font-alef text-xl text-gray-800 mb-4 gold-text-shadow">מידע נוסף</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-gray-600 hover:text-gold transition-colors">צור קשר</Link></li>
              <li><Link to="/appointment" className="text-gray-600 hover:text-gold transition-colors">קביעת פגישה</Link></li>
              <li><Link to="/privacy" className="text-gray-600 hover:text-gold transition-colors">מדיניות פרטיות</Link></li>
              <li><Link to="/terms" className="text-gray-600 hover:text-gold transition-colors">תנאי שימוש</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} רות פריסמן - קוד הנפש. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
}
