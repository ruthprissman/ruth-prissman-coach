
import React from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/Footer';
import { Navigation } from '@/components/Navigation';

export default function PrivacyPolicy() {
  // Generate the current date in a readable format
  const currentDate = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 animate-fade-in">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-alef text-center mb-6 text-[#4A235A]">מדיניות פרטיות</h1>
          <p className="text-center text-gray-600 mb-8">עודכן לאחרונה: {currentDate}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-alef mb-4 text-[#4A235A]">• המחויבות שלנו לפרטיות</h2>
            <p className="mb-4 leading-relaxed">
              אנו מחויבים להגן על פרטיותך ולהבטיח שקיפות בנוגע למידע שאתה משתף איתנו.
              דף זה מסביר כיצד אנו אוספים, משתמשים ומגנים על הנתונים שלך.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-alef mb-4 text-[#4A235A]">• איזה מידע אנחנו אוספים?</h2>
            <p className="mb-4 leading-relaxed">
              אנו אוספים נתונים רק למטרות מוגדרות:
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                <span className="font-semibold">כתובת אימייל</span> – לשליחת עדכוני תוכן שבועיים.
              </li>
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                <span className="font-semibold">שם מלא (אופציונלי)</span> – אם הוזן על ידי המשתמש.
              </li>
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                <span className="font-semibold">מאמרים שנקראו</span> – מאוחסנים מקומית באמצעות LocalStorage, לא נשלחים לשרת.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-alef mb-4 text-[#4A235A]">• כיצד אנו משתמשים במידע שלך?</h2>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                אימיילים נשלחים <span className="font-semibold">פעם בשבוע</span> עם <span className="font-semibold">מאמרים בלבד</span> (ולעתים במהלך חגים).
              </li>
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                <span className="font-semibold">ללא פרסומות או שיווק מסחרי.</span>
              </li>
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                <span className="font-semibold">איננו משתפים נתונים אישיים עם צדדים שלישיים.</span>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-alef mb-4 text-[#4A235A]">• כיצד ניתן לבטל את המנוי?</h2>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                כל אימייל כולל <span className="font-semibold">קישור ביטול מנוי מיידי</span>.
              </li>
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                באפשרותך לבטל את המנוי דרך דף זה:
                <Link 
                  to="/unsubscribe" 
                  className="inline-block text-[#7E69AB] hover:text-[#4A235A] underline mr-2 transition-colors duration-300"
                >
                  לחץ כאן לביטול המנוי
                </Link>
              </li>
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                באפשרותך גם לבקש הסרה באמצעות אימייל: 
                <a 
                  href="mailto:Ruthprissman@gmail.com" 
                  className="text-[#7E69AB] hover:text-[#4A235A] underline mr-2 transition-colors duration-300"
                >
                  Ruthprissman@gmail.com
                </a>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-alef mb-4 text-[#4A235A]">• כיצד ליצור איתנו קשר?</h2>
            <p className="mb-4 leading-relaxed">
              אם יש לך שאלות כלשהן, אל תהסס לפנות אלינו:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                <span className="font-semibold">אימייל:</span> 
                <a 
                  href="mailto:Ruthprissman@gmail.com" 
                  className="text-[#7E69AB] hover:text-[#4A235A] underline mr-2 transition-colors duration-300"
                >
                  Ruthprissman@gmail.com
                </a>
              </li>
              <li className="flex items-start space-x-2 rtl:space-x-reverse">
                <span className="text-[#4A235A] mr-2">•</span>
                <span className="font-semibold">טלפון:</span> 
                <a 
                  href="tel:0556620273" 
                  className="text-[#7E69AB] hover:text-[#4A235A] underline mr-2 transition-colors duration-300"
                >
                  055-6620273
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
