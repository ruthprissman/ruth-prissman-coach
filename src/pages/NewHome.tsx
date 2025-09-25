import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchTestimonials } from '@/services/TestimonialService';
import { Testimonial } from '@/types/testimonial';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function NewHome() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const heroTexts = [
    "כאב. בגידה. דחייה. אשמה. בדידות.",
    "רגשות עמוקים שמכאיבים – אבל הם לא חייבים לנהל אותנו.",
    "אני מאמינה שכל אחת יכולה לאהוב את החיים, להנות מהם ולהודות עליהם באמת – עם כל הניסיונות שבהם."
  ];

  const journeySteps = [
    "לזהות את הרצונות שלי",
    "לעשות סדר ברגשות ובמחשבות", 
    "להנות מעצמי, מאנשים ומהבורא",
    "תהליך התבוננות ואיזון",
    "להשתחרר"
  ];

  useEffect(() => {
    const loadTestimonials = async () => {
      const data = await fetchTestimonials();
      setTestimonials(data);
    };
    loadTestimonials();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % heroTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Intersection Observer for reveal animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elementsToAnimate = document.querySelectorAll('.reveal-on-scroll');
    elementsToAnimate.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Helmet>
        <title>רות פריסמן – מבט חדש על חיים מוכרים | טיפול רגשי ואיזון אישי</title>
        <meta name="description" content="טיפול רגשי ותהליך אישי עם רות פריסמן. מבט חדש על חיים מוכרים, איזון רגשי, והתמודדות עם כאב, בגידה ודחייה." />
        <meta name="keywords" content="טיפול רגשי, איזון רגשי, תהליך אישי, רות פריסמן, התמודדות רגשית" />
      </Helmet>

      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.7)), url("/assets/glass-stones-beach.jpg")',
          }}
        />
        
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-alef font-bold mb-6" style={{ color: '#52327D' }}>
            רות פריסמן - מאמנת רגשית
          </h1>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-alef font-bold mb-12" style={{ color: '#8C4FB9' }}>
            מבט חדש על חיים מוכרים
          </h2>
          
          <div className="h-40 md:h-32 flex items-center justify-center mb-16">
            <p 
              key={currentTextIndex}
              className="text-3xl md:text-4xl lg:text-5xl font-heebo leading-relaxed animate-fade-in max-w-5xl text-black"
            >
              {heroTexts[currentTextIndex]}
            </p>
          </div>
          
          <Link 
            to="/contact"
            className="inline-block bg-primary hover:bg-primary/90 text-white px-16 py-6 rounded-[40px] text-2xl font-heebo transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            לתיאום פגישה אישית
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-alef font-bold text-center mb-16 reveal-on-scroll">על התהליך</h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1 reveal-on-scroll">
              <img 
                src="/assets/new-logo.png" 
                alt="לוגו רות פריסמן - אבן שחורה על גלים טורקיז"
                className="w-64 h-64 mx-auto transition-transform duration-300 hover:rotate-3"
              />
            </div>
            
            <div className="order-1 md:order-2 text-center md:text-right reveal-on-scroll">
              <p className="text-2xl md:text-3xl font-heebo text-foreground leading-relaxed">
                לאט. בעדינות. אבל באמת.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-alef font-bold text-center mb-16 reveal-on-scroll">איך נראה תהליך איתי?</h2>
          
          <div className="flex overflow-x-auto gap-8 pb-4 snap-x snap-mandatory md:justify-center">
            {journeySteps.map((step, index) => (
              <div 
                key={index}
                className="flex-shrink-0 w-64 text-center snap-center reveal-on-scroll"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 hover:scale-110 transition-transform duration-300">
                  {index + 1}
                </div>
                <p className="text-lg font-heebo text-foreground leading-relaxed px-4">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificates & Testimonials */}
      <section className="py-20" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-alef font-bold text-center mb-16 reveal-on-scroll">בואי תקראי בעצמך</h2>
          
          <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory">
            {/* Certificates */}
            <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg p-6 snap-center">
              <img 
                src="/assets/certificate-1.png" 
                alt="תעודה מקצועית 1"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg p-6 snap-center">
              <img 
                src="/assets/certificate-2.png" 
                alt="תעודה מקצועית 2"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg p-6 snap-center">
              <img 
                src="/assets/certificate-3.png" 
                alt="תעודה מקצועית 3"
                className="w-full h-auto rounded-lg"
              />
            </div>
            
            {/* Testimonials */}
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.id} 
                className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg p-6 snap-center"
              >
                <div className="text-right">
                  <p className="text-foreground mb-4 leading-relaxed font-heebo">
                    {testimonial.summary}
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    {testimonial.image_url && (
                      <img 
                        src={testimonial.image_url} 
                        alt="תמונת לקוח"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-foreground">
                        {testimonial.name || 'אנונימי'}
                      </p>
                      {testimonial.source_type && (
                        <p className="text-sm text-muted-foreground">
                          {testimonial.source_type === 'whatsapp' ? 'WhatsApp' : 
                           testimonial.source_type === 'email' ? 'אימייל' : 'טלפון'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="reveal-on-scroll">
              <img 
                src="/assets/clinic-photo.png" 
                alt="קליניקה של רות פריסמן - כסאות אפורים נוחים"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            <div className="text-center md:text-right reveal-on-scroll">
              <h3 className="text-3xl md:text-4xl font-alef font-bold text-foreground mb-6">
                בואי לגלות את עצמך המוכרת מחדש
              </h3>
              <p className="text-lg font-heebo text-muted-foreground leading-relaxed">
                מרחב בטוח ונוח שבו תוכלי להתחבר אליך, לרגשותיך ולחלומותיך.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wide CTA */}
      <section className="py-20" style={{ backgroundColor: '#B7E3E5' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-alef font-bold text-foreground mb-8 reveal-on-scroll">
            מרגישה שזה הזמן שלך להתחיל?
          </h2>
          
          <Link 
            to="/contact"
            className="inline-block bg-primary hover:bg-primary/90 text-white px-16 py-6 rounded-2xl text-xl font-heebo transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl reveal-on-scroll"
          >
            אני רוצה להתחיל תהליך
          </Link>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-4xl font-alef font-bold text-foreground mb-8 reveal-on-scroll">
            הצטרפי לרשימות התפוצה שלי
          </h2>
          
          <div className="bg-muted/30 rounded-lg p-8 reveal-on-scroll">
            <form className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="name" className="block text-right font-heebo text-foreground mb-2">
                  שם פרטי
                </label>
                <input 
                  type="text" 
                  id="name"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="השם שלך"
                />
              </div>
              
              <div className="flex-1">
                <label htmlFor="email" className="block text-right font-heebo text-foreground mb-2">
                  כתובת אימייל
                </label>
                <input 
                  type="email" 
                  id="email"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="האימייל שלך"
                />
              </div>
              
              <Link 
                to="/subscribe"
                className="bg-secondary border-2 border-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-lg font-heebo transition-colors duration-300"
              >
                שלחו לי ♥
              </Link>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}