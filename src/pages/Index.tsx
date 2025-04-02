import React, { useEffect, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { SubscriptionForm } from '@/components/SubscriptionForm';
import { TestimonialsCarousel } from '@/components/TestimonialsCarousel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const logoRef = useRef(null);

  useEffect(() => {
    let clickCount = 0;
    let clickTimer;
    
    const handleLogoClick = () => {
      clickCount++;
      
      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 500);
      } else if (clickCount === 2) {
        clearTimeout(clickTimer);
        clickCount = 0;
        navigate('/admin/login');
      }
    };
    
    const logoElement = logoRef.current;
    if (logoElement) {
      logoElement.addEventListener('click', handleLogoClick);
    }
    
    return () => {
      if (logoElement) {
        logoElement.removeEventListener('click', handleLogoClick);
      }
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="min-h-screen relative w-full h-full">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
        
        <Navigation />
        
        <main className="flex-grow">
          <section className="pt-24 px-4 relative">
            <div className="container mx-auto relative z-10">
              <div className="flex flex-col items-top justify-center">
                <div className="flex flex-row items-top justify-center gap-4">
                  <img 
                    ref={logoRef}
                    src="https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/logo.png" 
                    alt="רות פריסמן - מאמנת קוד הנפש" 
                    className="w-52 h-52 md:w-64 md:h-64 object-top cursor-pointer mt-0" 
                  />
                  <div className="text-center">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-alef text-[#4A235A] gold-text-shadow">
                      רות פריסמן - מאמנת קוד הנפש
                    </h1>
                    <p className="text-lg md:text-xl text-purple-light mt-0.5 font-alef gold-text-shadow">
                      מבט חדש על חיים מוכרים
                    </p>
                     
                    <div className="backdrop-blur-sm p-5 rounded-lg mb-4 mx-auto w-full mt-6">
                      <h3 className="text-[#4A235A] text-lg font-heebo mb-3">החיים שלנו הם סיפור מתמשך.</h3>
                      
                      <p className="text-[#4A235A] text-lg font-heebo leading-snug">
                        סיפור שמורכב מרגשות, רצונות, היגיון ובחירות.<br />
                        סיפור שיש בו פחד ותקווה, בהירות ואיזון, יכולות, חוסרים ומתנות.<br /><br />
                        
                        בשיטת קוד הנפש, שפותחה על ידי שמחה אביטן,<br />
                        אנחנו לומדים לקרוא מחדש את הסיפור הפנימי שלנו,<br />
                        עם פחות תלות בסיפור החיצוני.<br /><br />
                        
                        ללמוד להבין את עצמנו, למצוא שלווה, בהירות ושמחה,<br />
                        ופשוט לבחור לחיות טוב.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <section className="py-6 px-4 relative">
            <div className="container mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="p-6 flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold font-alef text-[#4A235A] text-center">
                      אז מה אני עושה?
                    </h3>
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gold" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M8 12L12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#4A235A] text-center mb-6">
                    הכירי שיטה עמוקה המבוססת על היהדות, שתוביל אותך לאיזון פנימי של המידות. נגלה יחד איך למצוא בתוכך תשובות אמיתיות, להתחבר ולהנות מכוחות הנפש שלך, וליצור חיים של בהירות, אמונה ושלווה.
                  </p>
                  <div className="text-center space-y-2">
                    <a 
                      href="https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_file//Code_Of_The_Soul_Guide_Ruth_Prissman.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:text-gold-dark transition-colors duration-300 font-bold block"
                    >
                      לחצי כאן להורדת חוברת הסבר
                    </a>
                    <a 
                      href="/articles"
                      className="text-[#4A235A] hover:text-gold transition-colors duration-300 font-bold block"
                    >
                      למאמרי עומק לחצי כאן
                    </a>
                  </div>
                </div>

                <div className="p-6 flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold font-alef text-[#4A235A] text-center">
                      במילים קצת אחרות
                    </h3>
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gold" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6V18C7 16 9 16 12 18C15 16 17 16 21 18V6C17 4 15 4 12 6C9 4 7 4 3 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#4A235A] text-center mb-6">
                    את הסיפורים הבאים כתבתי מתוך תהליכים עמוקים שעברתי, עם עצמי ועם אחרים. תמצאי בהם דמויות שנוגעות בלב, מעוררות מחשבה, ומאפשרות לך להתחבר לעצמך ולקבל השראה לחיים מאוזנים ומדויקים יותר.
                  </p>
                  <a 
                    href="/stories"
                    className="text-gold hover:text-gold-dark transition-colors duration-300 font-bold"
                  >
                    לקריאה ולהורדה
                  </a>
                </div>

                <div className="p-6 flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold font-alef text-[#4A235A] text-center">
                      בואי נדבר
                    </h3>
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gold" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M17 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#4A235A] text-center mb-6">
                    אם את מרגישה מוכנה להביט פנימה, להבין את עצמך טוב יותר ולהבהיר את המציאות שסביבך ואת מקומך בתוכה, את מוזמנת לקבוע פגישה. נעבור יחד את הדרך ברגישות ובבהירות, בדרך לחיים יציבים, מאוזנים ומדויקים.
                  </p>
                  <a 
                    href="/appointment"
                    className="text-gold hover:text-gold-dark transition-colors duration-300 font-bold"
                  >
                    לקביעת פגישה
                  </a>
                </div>
              </div>
            </div>
          </section>
          
          <TestimonialsCarousel />
          
          <section className="py-16 px-4 relative">
            <div className="container mx-auto max-w-2xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-[#4A235A] mb-6 gold-text-shadow">
                  בואי להיות חלק מהקהילה
                </h2>
                <p className="text-[#4A235A] mb-8 font-heebo leading-relaxed">
                  הצטרפי לרשימת התפוצה שלי, וקבלי מאמרים שבועיים בנושאי 'קוד הנפש' - מחשבות, כלים ותובנות שידייקו אותך למצוא בעצמך את הדרך שלך לחיים מודעים יותר.
                  <br />
                  לפני חגים ייתכן שיופצו מאמרים מותאמים למהות החג.
                </p>
                <SubscriptionForm />
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
