
import React, { useEffect, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { TestimonialsCarousel } from '@/components/TestimonialsCarousel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { AppInitializer } from '@/components/AppInitializer';

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
      {/* Include the diagnostics initializer */}
      <AppInitializer />
      
      <div className="min-h-screen relative w-full h-full">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
        
        <Navigation />
        
        <main className="flex-grow">
          <section className="pt-24 px-4 relative">
            <div className="container mx-auto relative z-10">
              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col md:flex-row items-center justify-center md:gap-4">
                  <img ref={logoRef} src="https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs//logo.jpg" alt="רות פריסמן - מאמנת קוד הנפש" className="w-52 h-52 md:w-64 md:h-64 object-top cursor-pointer mt-0 rounded-2xl" />
                  <div className="text-center w-full max-w-full">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-alef text-[#4A235A] gold-text-shadow mt-4 md:mt-0">רות פריסמן - מאמנת וסופרת</h1>
                    <p className="text-lg md:text-xl text-purple-light mt-3 font-alef gold-text-shadow">
                      מבט חדש על חיים מוכרים
                    </p>
                    
                    <div className="mt-16 mb-20 max-w-3xl mx-auto animate-fade-in px-4">
                      <p className="text-[#4A235A] font-heebo text-lg md:text-xl leading-relaxed text-center">
                        החיים שלנו הם סיפור מתמשך
                      </p>
                      
                      <div className="text-[#4A235A] font-heebo text-lg md:text-xl leading-relaxed text-center mt-8 space-y-4">
                        <p>
                          סיפור שמורכב מרגשות, רצונות, היגיון ובחירות.
                          סיפור שיש בו פחד ותקווה, בהירות ואיזון, יכולות, חוסרים ומתנות.
                        </p>
                        
                        <p>
                          בשיטת קוד הנפש, שפותחה על ידי שמחה אביטן,
                          אנחנו לומדים לקרוא מחדש את הסיפור הפנימי שלנו,
                          עם שחרור מהתלות בסיפור החיצוני.
                        </p>
                        
                        <p>
                          ללמוד להבין את עצמנו, למצוא שלווה, בהירות ושמחה,
                          ופשוט לבחור לחיות טוב.
                        </p>
                        
                        <p>
                          אני מאמנת בגישה המיוחדת הזו
                          וסופרת, שמביאה סיפורים על חיים מוכרים, פחות או יותר. ממבט חדש ומרענן.
                        </p>
                      </div>
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
                        <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M8 12L12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#4A235A] text-center mb-6 whitespace-normal leading-relaxed">
                    הכירי שיטה עמוקה המבוססת על היהדות, שתוביל אותך לאיזון פנימי של המידות. נגלה יחד איך למצוא בתוכך תשובות אמיתיות, להתחבר ולהנות מכוחות הנפש שלך, וליצור חיים של בהירות, אמונה ושלווה.
                  </p>
                  <div className="text-center space-y-2">
                  </div>
                </div>

                <div className="p-6 flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold font-alef text-[#4A235A] text-center">
                      במילים קצת אחרות
                    </h3>
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gold" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6V18C7 16 9 16 12 18C15 16 17 16 21 18V6C17 4 15 4 12 6C9 4 7 4 3 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#4A235A] text-center mb-6 whitespace-normal leading-relaxed">
                    את הסיפורים הבאים כתבתי מתוך תהליכים עמוקים שעברתי, עם עצמי ועם אחרים. תמצאי בהם דמויות שנוגעות בלב, מעוררות מחשבה, ומאפשרות לך להתחבר לעצמך ולקבל השראה לחיים מאוזנים ומדויקים יותר.
                  </p>
                  <a href="/stories" className="text-gold hover:text-gold-dark transition-colors duration-300 font-bold">
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
                        <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                        <path d="M7 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M17 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[#4A235A] text-center mb-6 whitespace-normal leading-relaxed">
                    אם את מרגישה מוכנה להביט פנימה, להבין את עצמך טוב יותר ולהבהיר את המציאות שסביבך ואת מקומך בתוכה, את מוזמנת לקבוע פגישה. נעבור יחד את הדרך ברגישות ובבהירות, בדרך לחיים יציבים, מאוזנים ומדויקים.
                  </p>
                  <a href="/contact" className="text-gold hover:text-gold-dark transition-colors duration-300 font-bold">
                    לקביעת פגישה
                  </a>
                </div>
              </div>
            </div>
          </section>
          
          <TestimonialsCarousel />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
