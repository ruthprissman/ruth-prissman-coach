
import React, { useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { SubscriptionForm } from '@/components/SubscriptionForm';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = useIsMobile();

  // Fade-in animation for elements
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(el => {
      observer.observe(el);
    });
    
    return () => {
      animatedElements.forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div 
        className="min-h-screen bg-cover bg-center relative" 
        style={{ backgroundImage: 'url(https://www.dropbox.com/scl/fi/3k8uim201uuhjsylidogq/clear-background.jpg?raw=1)' }}
      >
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
        
        <Navigation />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="pt-36 pb-20 px-4 relative">
            <div className="container mx-auto text-center relative z-10">
              <div className="max-w-3xl mx-auto animate-on-scroll opacity-0">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-alef text-purple-dark mb-4 gold-text-shadow">
                  רות פריסמן - קוד הנפש
                </h1>
                <p className="text-xl md:text-2xl text-purple-light mb-8 font-alef gold-text-shadow">
                  מבט חדש על חיים מוכרים
                </p>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-gold-sm mb-8 max-w-2xl mx-auto">
                  <p className="text-purple-dark mb-4 text-lg">
                    ברוכים הבאים לאתר שלי! אני רות פריסמן, מטפלת בשיטת "קוד הנפש" - גישה ייחודית המאפשרת מבט חדש על אתגרי החיים והתמודדויות יומיומיות.
                  </p>
                  <p className="text-purple-dark text-lg">
                    אני מאמינה שלכל אחד יש את הכוח לשנות את חייו, ותפקידי הוא לעזור לך למצוא את המפתחות לשינוי אמיתי ומתמשך בחייך.
                  </p>
                </div>
                <div className="flex justify-center space-x-4 space-x-reverse">
                  <a 
                    href="/appointment" 
                    className="bg-gold hover:bg-gold-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    קביעת פגישה
                  </a>
                  <a 
                    href="/about" 
                    className="bg-white/80 hover:bg-white text-purple-dark font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-gold-sm border border-gold/20"
                  >
                    למידע נוסף
                  </a>
                </div>
              </div>
            </div>
          </section>
          
          {/* Services Section */}
          <section className="py-16 px-4 bg-white/60 backdrop-blur-sm">
            <div className="container mx-auto">
              <div className="text-center mb-12 animate-on-scroll opacity-0">
                <h2 className="text-3xl font-bold text-purple-dark mb-4 gold-text-shadow">
                  מה מיוחד בשיטה שלי?
                </h2>
                <p className="text-purple-light max-w-2xl mx-auto">
                  שיטת "קוד הנפש" מאפשרת מבט חדש על חוויות וקשיים שמלווים אותנו שנים, 
                  ומציעה דרכים פשוטות ויעילות לשינוי ולצמיחה אישית.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/70 p-6 rounded-lg shadow-gold-sm transition-all duration-300 hover:shadow-gold animate-on-scroll opacity-0">
                  <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gold" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"></path>
                      <path d="M12 7v5l3 3"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-purple-dark mb-2 text-center gold-text-shadow">
                    פגישות אישיות
                  </h3>
                  <p className="text-purple-dark text-center">
                    פגישות אישיות המותאמות לצרכיך ומטרותיך, בדרך לשינוי משמעותי ומתמשך.
                  </p>
                </div>
                
                <div className="bg-white/70 p-6 rounded-lg shadow-gold-sm transition-all duration-300 hover:shadow-gold animate-on-scroll opacity-0">
                  <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gold" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path>
                      <path d="M12 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                      <path d="M12 11.5V17"></path>
                      <path d="M9 17h6"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-purple-dark mb-2 text-center gold-text-shadow">
                    סדנאות קבוצתיות
                  </h3>
                  <p className="text-purple-dark text-center">
                    סדנאות מעצימות בקבוצה קטנה ותומכת, המאפשרות למידה הדדית וגילויים חדשים.
                  </p>
                </div>
                
                <div className="bg-white/70 p-6 rounded-lg shadow-gold-sm transition-all duration-300 hover:shadow-gold animate-on-scroll opacity-0">
                  <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gold" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                      <path d="M7 7h10"></path>
                      <path d="M7 12h10"></path>
                      <path d="M7 17h10"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-purple-dark mb-2 text-center gold-text-shadow">
                    מאמרים ותרגילים
                  </h3>
                  <p className="text-purple-dark text-center">
                    מגוון רחב של מאמרים ותרגילים מעשיים, המאפשרים צמיחה והתפתחות גם בבית.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Testimonials Section */}
          <section className="py-16 px-4 relative">
            <div className="absolute inset-0 bg-gold/5"></div>
            <div className="container mx-auto relative z-10">
              <div className="text-center mb-12 animate-on-scroll opacity-0">
                <h2 className="text-3xl font-bold text-purple-dark mb-4 gold-text-shadow">
                  מה אומרים עליי
                </h2>
                <p className="text-purple-light max-w-2xl mx-auto">
                  התגובות של אנשים שעברו תהליך משמעותי בעזרת שיטת "קוד הנפש"
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    quote: "הטיפול עם רות נתן לי כלים חדשים להתמודדות עם אתגרים יומיומיים. הגישה שלה שינתה את חיי לחלוטין.",
                    author: "מיכל, תל אביב"
                  },
                  {
                    quote: "אחרי שנים של ניסיונות שונים, סוף סוף מצאתי את הדרך הנכונה בעזרת רות. היא רואה דברים שאחרים מפספסים.",
                    author: "דניאל, חיפה"
                  },
                  {
                    quote: "התהליך עם רות היה עמוק ומשמעותי. קיבלתי תובנות חשובות על עצמי ועל הדרך שבה אני מתמודדת עם אתגרים.",
                    author: "אורית, ירושלים"
                  }
                ].map((testimonial, index) => (
                  <div 
                    key={index} 
                    className="bg-white/70 backdrop-blur-sm p-6 rounded-lg shadow-gold-sm animate-on-scroll opacity-0"
                  >
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className="w-5 h-5 text-gold" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-purple-dark mb-4 text-center">
                      "{testimonial.quote}"
                    </p>
                    <p className="text-purple-dark font-semibold text-center">
                      {testimonial.author}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <a 
                  href="/recommendations" 
                  className="inline-block text-gold hover:text-gold-dark golden-nav-item font-semibold"
                >
                  לעוד המלצות
                </a>
              </div>
            </div>
          </section>
          
          {/* Subscribe Section */}
          <section className="py-16 px-4 relative">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="w-full md:w-1/2 text-right animate-on-scroll opacity-0">
                  <h2 className="text-3xl font-bold text-purple-dark mb-4 gold-text-shadow">
                    בואי להיות חלק מהקהילה
                  </h2>
                  <p className="text-purple-dark mb-6">
                    הצטרפי לרשימת התפוצה שלי וקבלי טיפים ומאמרים שיעזרו לך לחיות חיים מודעים יותר, 
                    עם כלים פרקטיים להתמודדות עם אתגרי היומיום.
                  </p>
                  <ul className="mb-6">
                    <li className="golden-bullet mb-2 text-purple-dark">עדכונים על מאמרים חדשים</li>
                    <li className="golden-bullet mb-2 text-purple-dark">טיפים מעשיים לחיי היומיום</li>
                    <li className="golden-bullet mb-2 text-purple-dark">הזמנות לסדנאות והרצאות</li>
                    <li className="golden-bullet text-purple-dark">גישה לתכנים בלעדיים</li>
                  </ul>
                </div>
                
                <div className="w-full md:w-1/2 animate-on-scroll opacity-0">
                  <SubscriptionForm />
                </div>
              </div>
            </div>
          </section>
          
          {/* Contact CTA */}
          <section className="py-16 px-4 bg-gold/10 backdrop-blur-sm">
            <div className="container mx-auto text-center animate-on-scroll opacity-0">
              <h2 className="text-3xl font-bold text-purple-dark mb-4 gold-text-shadow">
                מוכנה להתחיל?
              </h2>
              <p className="text-purple-dark max-w-2xl mx-auto mb-8">
                פנייה ראשונה היא הצעד החשוב ביותר. אני כאן כדי להקשיב ולהציע את הדרך הנכונה עבורך.
              </p>
              <div className="flex justify-center space-x-4 space-x-reverse">
                <a 
                  href="/contact" 
                  className="bg-gold hover:bg-gold-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  צרי קשר עכשיו
                </a>
                <a 
                  href="tel:0556620273" 
                  className="bg-white text-purple-dark font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-gold/20"
                >
                  055-6620273
                </a>
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
