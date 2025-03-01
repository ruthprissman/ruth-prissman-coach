
import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Heart, Sun, Leaf } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url(https://www.dropbox.com/scl/fi/mn961lxdmrzb3hu61jr8c/clear-background.jpg?rlkey=te75ba634sz277355u5onqvuy&st=qxb55gpi&raw=1)' }}>
      <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
      
      <Navigation />
      <main className="flex-grow relative z-10">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <h1 className="text-center text-3xl md:text-4xl lg:text-5xl font-alef text-[#4A235A] mb-12 gold-text-shadow">
            אודות רות פריסמן – קוד הנפש
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-2 space-y-6 text-right">
              <p className="text-lg text-right">
                רות פריסמן היא מטפלת רגשית מוסמכת עם ניסיון של למעלה מעשרים שנה בהנחיית אנשים במסע שלהם לגילוי עצמי וצמיחה אישית. עם רקע בפסיכולוגיה ולימודי רוחניות, רות פיתחה את "קוד הנפש" - שיטה ייחודית המשלבת תובנות מודרניות עם חוכמה עתיקה.
              </p>
              <p className="text-lg text-right">
                בקליניקה הפרטית שלה ברמת גן, רות מלווה מטופלים בתהליכי שינוי משמעותיים, מסייעת להם לפתוח דלתות חדשות ולהתגבר על אתגרים רגשיים מורכבים.
              </p>
              <p className="text-lg text-right">
                "קוד הנפש" היא שיטה המבוססת על הבנה עמוקה של הקשר בין רגשות, מחשבות והתנהגויות. השיטה מאפשרת למטופלים להבין את המנגנונים הנפשיים המניעים אותם, לזהות דפוסים מגבילים ולפתח את היכולת להתמודד עם מצבים מאתגרים בדרך מודעת ומעצימה.
              </p>
            </div>

            <div className="flex justify-center md:justify-end">
              <img 
                src="https://www.dropbox.com/s/b86bweqhp41dw8m/original-image.jpg?st=wdhpssr7&raw=1" 
                alt="רות פריסמן" 
                className="rounded-2xl shadow-lg w-64 h-64 md:w-72 md:h-72 object-cover"
              />
            </div>
          </div>

          <div className="backdrop-blur-sm rounded-xl p-6 shadow-md mb-12 text-right">
            <h2 className="text-2xl font-alef text-[#4A235A] mb-6 text-center">ערכי הליבה וגישת הטיפול</h2>
            <div className="space-y-4 text-right">
              <div className="flex flex-row-reverse items-center gap-4">
                <p className="text-lg text-right flex-grow">מסע של גילוי עצמי – פיתוח מודעות עצמית היא אבן יסוד בהבנת הקשר בין חוויות העבר לדפוסי ההווה</p>
                <Sun className="text-gold-DEFAULT flex-shrink-0" size={24} />
              </div>
              <div className="flex flex-row-reverse items-center gap-4">
                <p className="text-lg text-right flex-grow">צמיחה רגשית – פיתוח כלים לעיבוד רגשות ושליטה בתגובות רגשיות, המאפשרים התמודדות יעילה עם אתגרים</p>
                <Heart className="text-gold-DEFAULT flex-shrink-0" size={24} />
              </div>
              <div className="flex flex-row-reverse items-center gap-4">
                <p className="text-lg text-right flex-grow">טרנספורמציה – שינוי מהותי המתרחש כאשר משחררים דפוסים מגבילים ופותחים דלת לאפשרויות חדשות</p>
                <Leaf className="text-gold-DEFAULT flex-shrink-0" size={24} />
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-alef text-[#4A235A] mb-4">רוצה לשמוע עוד על השיטה?</h3>
            <Button asChild className="bg-gold-DEFAULT hover:bg-gold-dark text-white font-medium px-6">
              <Link to="/contact">צרו קשר עם רות</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
