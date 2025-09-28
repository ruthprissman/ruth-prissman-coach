import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchTestimonials } from '@/services/TestimonialService';
import { Testimonial } from '@/types/testimonial';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { TestimonialModal } from '@/components/TestimonialModal';

export default function NewHome() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  const scrollytellingScenes = [
    {
      text: "מכירה את זה ש…\nהרגשות שנלווים לניסיון כבדים יותר מהניסיון עצמו?",
      animation: "scene-1"
    },
    {
      text: "דחייה. אשמה. בגידה. בדידות.\nולפעמים… פשוט אין להן שם…",
      animation: "scene-2"
    },
    {
      text: "מכירה את זה ש…\nנוצר בלגן פנימי, שלא מאפשר לנו לזהות מה אנחנו רוצות באמת?",
      animation: "scene-3"
    },
    {
      text: "מכירה את זה ש…\nהחרדה מחוויות העבר והפחד מתוצאות העתיד חונקים את ההווה?",
      animation: "scene-4"
    },
    {
      text: "אני מאמינה\nשכל אישה יכולה להביא לעצמה גאולה פנימית – משיח פרטי משלה.\nשחרור מתלות; חיבור לעצמה, לסביבה ולבורא.",
      animation: "scene-5"
    }
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
      setCurrentSceneIndex((prev) => {
        if (prev < scrollytellingScenes.length - 1) {
          return prev + 1;
        } else {
          // Loop back to the beginning
          return 0;
        }
      });
    }, 4000);

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
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-alef font-bold mb-6" style={{ color: '#52327D' }}>
            רות פריסמן - מאמנת רגשית
          </h1>
          
          <h2 className="text-xl md:text-3xl lg:text-4xl font-alef font-bold mb-20" style={{ color: '#8C4FB9' }}>
            מבט חדש על חיים מוכרים
          </h2>
          
          <div className="h-36 md:h-32 flex items-center justify-center mb-24">
            <div 
              id="hero-subtext"
              key={currentSceneIndex}
              className={`text-2xl md:text-3xl lg:text-4xl font-heebo leading-relaxed max-w-5xl text-black scrollytelling-scene scene-transition ${scrollytellingScenes[currentSceneIndex].animation}`}
            >
              {scrollytellingScenes[currentSceneIndex].text.split('\n').map((line, index) => (
                <div key={index} className={scrollytellingScenes[currentSceneIndex].animation === 'scene-2' && index === 0 ? 'word-pop-container' : ''}>
                  {scrollytellingScenes[currentSceneIndex].animation === 'scene-2' && index === 0 ? (
                    line.split(' ').map((word, wordIndex) => (
                      <span 
                        key={wordIndex} 
                        className="word-pop" 
                        style={{animationDelay: `${wordIndex * 0.2}s`}}
                      >
                        {word}{' '}
                      </span>
                    ))
                  ) : (
                    line
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <Link 
            to="/contact"
            className="inline-block cta-primary px-16 py-6 text-2xl font-heebo animate-fade-in"
          >
            לתיאום פגישה אישית
          </Link>
        </div>
      </section>

      {/* New Unified Section */}
      <section dir="rtl" style={{
        marginTop: '8rem',
        padding: '0 1.5rem',
        background: '#FFFFFF'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60% 40%',
          alignItems: 'center',
          gap: '3rem'
        }} className="max-w-6xl mx-auto">
          {/* text column */}
          <div>
            <h2 style={{
              fontFamily: 'Alef, sans-serif',
              color: '#52327D',
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              margin: '0 0 2rem'
            }}>
              מה נעשה ביחד?
            </h2>

            <ul role="list" style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontFamily: 'Heebo, sans-serif',
              color: '#141414',
              fontSize: '1.125rem',
              lineHeight: '1.8'
            }}>
              {[
                { i: 0, text: 'נקשיב למה שקורה באמת, בפנים – מתחת למציאות החיצונית.', highlight: 'למה שקורה באמת' },
                { i: 1, text: 'נזהה ונגדיר את הרצון הפנימי שלך.', highlight: 'את הרצון הפנימי שלך' },
                { i: 2, text: 'נתחבר לכוחות הייחודיים דווקא לך.', highlight: 'לכוחות הייחודיים דווקא לך' },
                { i: 3, text: 'נמצא ביחד את האיזון שכבר קיים בחיים שלך.', highlight: 'את האיזון שכבר קיים' },
                { i: 4, text: 'נלמד לחיות בהווה – וליישם.', highlight: 'לחיות בהווה – וליישם' },
                { i: 5, text: 'נשתחרר מתלות במצבים חיצוניים.', highlight: 'מתלות במצבים חיצוניים' }
              ].map((item, index) => (
                <li 
                  key={index}
                  style={{
                    '--i': item.i,
                    paddingRight: '2.2rem',
                    marginBottom: '.8rem',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: `textIn .6s ease forwards`,
                    animationDelay: `calc(${item.i} * .25s)`
                  } as React.CSSProperties}
                  className="together-list-item"
                >
                  {item.text.split(item.highlight).map((part, partIndex, array) => (
                    <React.Fragment key={partIndex}>
                      {part}
                      {partIndex < array.length - 1 && (
                        <mark style={{
                          color: '#3AB9C9',
                          background: 'transparent',
                          fontWeight: '600'
                        }}>
                          {item.highlight}
                        </mark>
                      )}
                    </React.Fragment>
                  ))}
                </li>
              ))}
              
              <li style={{
                '--i': 6,
                paddingRight: '2.2rem',
                marginBottom: '.8rem',
                position: 'relative',
                overflow: 'hidden',
                animation: 'textIn .6s ease forwards',
                animationDelay: 'calc(6 * .25s)'
              } as React.CSSProperties}
              className="together-list-item">
                ונתפלל יחד…
              </li>
            </ul>

          </div>

          {/* logo column */}
          <div style={{ justifySelf: 'start' }}>
            <img 
              src="/assets/new-logo.png" 
              alt="לוגו האבן על גלים"
              style={{
                maxWidth: '260px',
                transition: 'transform .3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'rotate(3deg)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
            />
          </div>
        </div>
      </section>

      {/* CTA Button Below Together Section */}
      <section className="py-12" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="text-center">
          <Link 
            to="/contact"
            className="inline-block cta-primary px-16 py-6 text-2xl font-heebo"
          >
            אני רוצה להתחיל
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background hidden" id="about">
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
      <section className="py-20 bg-muted/50 hidden" id="journey">
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

      {/* Certificates Section */}
      <section className="py-20" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-alef font-bold text-center mb-16 reveal-on-scroll">התעודות שלי</h2>
          
          <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory justify-center">
            <div className="flex-shrink-0 w-80 h-96 bg-white rounded-lg shadow-lg p-4 snap-center">
              <img 
                src="/assets/certificate-1.png" 
                alt="תעודה מקצועית 1"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex-shrink-0 w-80 h-96 bg-white rounded-lg shadow-lg p-4 snap-center">
              <img 
                src="/assets/certificate-2.png" 
                alt="תעודה מקצועית 2"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex-shrink-0 w-80 h-96 bg-white rounded-lg shadow-lg p-4 snap-center">
              <img 
                src="/assets/certificate-3.png" 
                alt="תעודה מקצועית 3"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-alef font-bold text-center mb-16 reveal-on-scroll">בואי תקראי בעצמך</h2>
          
          <div className="testimonials-carousel">
            <div className="testimonials-track">
              {testimonials.concat(testimonials).map((testimonial, index) => (
                <div 
                  key={`${testimonial.id}-${index}`}
                  className="testimonial-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => setSelectedTestimonial(testimonial)}
                >
                  <div className="text-right">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="text-4xl text-primary/20 font-serif mb-2">"</div>
                        <p className="text-foreground mb-4 leading-relaxed font-heebo text-base line-clamp-3 group-hover:text-primary transition-colors">
                          {testimonial.summary}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-3">
                      {testimonial.image_url && (
                        <img 
                          src={testimonial.image_url} 
                          alt="תמונת לקוח"
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        />
                      )}
                      <div className="text-right">
                        <p className="font-semibold text-foreground font-alef">
                          {testimonial.name || 'אנונימי'}
                        </p>
                        {testimonial.source_type && (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs text-muted-foreground font-heebo">
                              {testimonial.source_type === 'whatsapp' ? 'WhatsApp' : 
                               testimonial.source_type === 'email' ? 'אימייל' : 'טלפון'}
                            </span>
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <span className="text-xs text-primary/60 font-heebo hover:text-primary transition-colors">
                        לחצי לקריאת ההמלצה המלאה ←
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <TestimonialModal 
          testimonial={selectedTestimonial}
          onClose={() => setSelectedTestimonial(null)}
        />
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
            className="inline-block cta-primary px-16 py-6 text-xl font-heebo reveal-on-scroll"
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
          
          <div className="reveal-on-scroll">
            <Link 
              to="/subscribe"
              className="inline-block cta-primary px-12 py-4 text-lg font-heebo"
            >
              הצטרפי לרשימת התפוצה ♥
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}