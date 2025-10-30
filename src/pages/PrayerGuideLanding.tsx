import { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowDown, Check } from 'lucide-react';

const PrayerGuideLanding = () => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [formStartTime] = useState(Date.now());
  const signupRef = useRef<HTMLDivElement>(null);

  const scrollToSignup = () => {
    signupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // SPAM protection - honeypot
    if (honeypot) {
      console.log('Bot detected via honeypot');
      setShowSuccess(true);
      return;
    }

    // SPAM protection - time trap (minimum 3 seconds)
    const timeDiff = Date.now() - formStartTime;
    if (timeDiff < 3000) {
      console.log('Bot detected via time trap');
      setShowSuccess(true);
      return;
    }

    // Validation
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'נא למלא שם מלא (לפחות 2 תווים)'
      });
      return;
    }

    if (!email.trim() || !validateEmail(email.trim())) {
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'נא למלא כתובת מייל תקינה'
      });
      return;
    }

    if (!consent) {
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: 'יש לאשר את תנאי ההצטרפות'
      });
      return;
    }

    setIsLoading(true);

    try {
      const trimmedEmail = email.toLowerCase().trim();
      const trimmedName = fullName.trim();

      // Check if email already exists
      const { data: existingSubscriber, error: checkError } = await supabase
        .from('content_subscribers')
        .select('is_subscribed')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSubscriber) {
        if (existingSubscriber.is_subscribed) {
          // Resend the guide
          const pdfUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_file/GUID.pdf';
          
          const { error: emailError } = await supabase.functions.invoke('send-guide-email', {
            body: {
              email: trimmedEmail,
              firstName: trimmedName.split(' ')[0],
              pdfUrl
            }
          });

          if (emailError) {
            console.error('Error sending email:', emailError);
            throw new Error('שגיאה בשליחת המייל');
          }

          setShowSuccess(true);
          toast({
            title: 'נשלח מחדש! ✅',
            description: 'שלחנו לך את המדריך שוב למייל'
          });
          
          setTimeout(() => {
            document.getElementById('thanks')?.scrollIntoView({ behavior: 'smooth' });
          }, 500);
          return;
        } else {
          // Resubscribe
          const { error: updateError } = await supabase
            .from('content_subscribers')
            .update({
              is_subscribed: true,
              first_name: trimmedName,
              consent: true,
              source: 'lp-prayer-guide',
              unsubscribed_at: null
            })
            .eq('email', trimmedEmail);

          if (updateError) throw updateError;
        }
      } else {
        // New subscriber
        const { error: insertError } = await supabase
          .from('content_subscribers')
          .insert({
            email: trimmedEmail,
            first_name: trimmedName,
            is_subscribed: true,
            consent: true,
            source: 'lp-prayer-guide'
          });

        if (insertError) throw insertError;
      }

      // Send email with PDF
      const pdfUrl = 'https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_file/GUID.pdf';
      
      const { error: emailError } = await supabase.functions.invoke('send-guide-email', {
        body: {
          email: trimmedEmail,
          firstName: trimmedName.split(' ')[0],
          pdfUrl
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        throw new Error('שגיאה בשליחת המייל');
      }

      setShowSuccess(true);
      setFullName('');
      setEmail('');
      setConsent(false);
      
      toast({
        title: 'מעולה! ✅',
        description: 'המדריך נשלח למייל שלך'
      });

      setTimeout(() => {
        document.getElementById('thanks')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast({
        variant: 'destructive',
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה, נא לנסות שוב'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>מדריך תפילה חינמי - רות פריסמן</title>
        <meta name="description" content="קבלי את המדריך החינמי: להתפלל כשאין זמן. מדריך מעשי לתפילה משמעותית גם בלוח זמנים עמוס." />
      </Helmet>

      {/* Hero Section */}
      <section dir="rtl" style={{
        minHeight: '65vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '3rem 1.5rem'
      }}>
        {/* Background Image - Very high transparency */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("/assets/pearl-hero-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08
        }} />

        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '900px'
        }}>
          <h1 style={{
            fontFamily: 'Alef, sans-serif',
            fontSize: 'clamp(2.25rem, 5vw, 4rem)',
            fontWeight: 'bold',
            color: '#52327D',
            marginBottom: '1.5rem',
            lineHeight: 1.2
          }}>
            להתפלל כשאין זמן
          </h1>

          <p style={{
            fontFamily: 'Heebo, sans-serif',
            fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
            color: '#4A5568',
            marginBottom: '3rem',
            lineHeight: 1.8
          }}>
            מדריך מעשי וקצר לתפילה משמעותית,<br />
            גם בלוח זמנים עמוס
          </p>

          <button
            onClick={scrollToSignup}
            className="cta-primary"
            style={{
              fontFamily: 'Heebo, sans-serif',
              fontSize: '1.5rem',
              padding: '1.25rem 3rem'
            }}
          >
            להורדה חינמית <ArrowDown className="inline mr-2" size={24} />
          </button>
        </div>
      </section>

      {/* Signup Form - RIGHT AFTER HERO */}
      <section 
        id="signup" 
        ref={signupRef}
        dir="rtl" 
        style={{
          padding: '5rem 1.5rem',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontFamily: 'Alef, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 'bold',
            color: '#52327D',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            קבלי את המדריך החינמי שלך
          </h2>

          <p style={{
            fontFamily: 'Heebo, sans-serif',
            fontSize: '1.125rem',
            color: '#4A5568',
            textAlign: 'center',
            marginBottom: '2.5rem'
          }}>
            רק מלאי פרטים ותקבלי את המדריך ישירות למייל
          </p>

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            backgroundColor: 'rgba(82, 50, 125, 0.03)',
            padding: '2.5rem',
            borderRadius: '12px',
            border: '2px solid rgba(82, 50, 125, 0.1)'
          }}>
            {/* Honeypot field (hidden from users) */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div>
              <label style={{
                fontFamily: 'Heebo, sans-serif',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#52327D',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                שם מלא
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                placeholder="השם המלא שלך"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '1rem',
                  fontFamily: 'Heebo, sans-serif',
                  borderRadius: '8px',
                  border: '2px solid rgba(82, 50, 125, 0.2)',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8C4FB9'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(82, 50, 125, 0.2)'}
              />
            </div>

            <div>
              <label style={{
                fontFamily: 'Heebo, sans-serif',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#52327D',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                כתובת מייל
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="הכתובת שלך"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '1rem',
                  fontFamily: 'Heebo, sans-serif',
                  borderRadius: '8px',
                  border: '2px solid rgba(82, 50, 125, 0.2)',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8C4FB9'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(82, 50, 125, 0.2)'}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked as boolean)}
                required
                disabled={isLoading}
                style={{
                  marginTop: '0.25rem'
                }}
              />
              <label
                htmlFor="consent"
                style={{
                  fontFamily: 'Heebo, sans-serif',
                  fontSize: '0.9rem',
                  color: '#4A5568',
                  lineHeight: 1.6,
                  cursor: 'pointer'
                }}
              >
                אני מאשרת קבלת תוכן וחומרים שיווקיים באופן תקופתי. ניתן להסיר הסכמה בכל עת.
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="cta-primary"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.25rem',
                fontFamily: 'Heebo, sans-serif',
                marginTop: '0.5rem'
              }}
            >
              {isLoading ? 'שולח...' : 'שלחי לי את המדריך →'}
            </Button>
          </form>
        </div>
      </section>

      {/* Pain + Solution Section */}
      <section dir="rtl" style={{
        padding: '5rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(95, 166, 166, 0.05) 0%, rgba(82, 50, 125, 0.05) 100%)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '3rem',
          alignItems: 'center'
        }}
        className="md:grid-cols-2">
          {/* Text Column - Right on Desktop */}
          <div style={{ order: 1 }}>
            <h2 style={{
              fontFamily: 'Alef, sans-serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 'bold',
              color: '#52327D',
              marginBottom: '1.5rem'
            }}>
              מכירה את זה?
            </h2>

            <div style={{
              fontFamily: 'Heebo, sans-serif',
              fontSize: '1.125rem',
              color: '#4A5568',
              lineHeight: 1.8,
              marginBottom: '2rem'
            }}>
              <p style={{ marginBottom: '1rem' }}>
                יש לך רצון אמיתי להתפלל, אבל…
              </p>
              <p style={{ marginBottom: '1rem' }}>
                ⏰ הזמן לא מספיק<br />
                🌪️ הראש מלא<br />
                😔 המילים מרגישות ריקות
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(95, 166, 166, 0.1)',
              borderRight: '4px solid #5FA6A6',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontFamily: 'Alef, sans-serif',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#52327D',
                marginBottom: '0.75rem'
              }}>
                הפתרון כאן
              </h3>
              <p style={{
                fontFamily: 'Heebo, sans-serif',
                fontSize: '1.125rem',
                color: '#4A5568',
                lineHeight: 1.7
              }}>
                מדריך קצר ומעשי שיעזור לך להתחבר לתפילה באמת –<br />
                גם כשהזמן מוגבל והלב מוסח.
              </p>
            </div>
          </div>

          {/* Image Column - Left on Desktop */}
          <div style={{ order: 2 }} className="md:order-first">
            <img
              src="/assets/butterfly.png"
              alt="פרפר - סמל לחופש ושחרור"
              style={{
                width: '100%',
                maxWidth: '400px',
                height: 'auto',
                margin: '0 auto',
                display: 'block',
                filter: 'drop-shadow(0 10px 25px rgba(82, 50, 125, 0.15))'
              }}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section dir="rtl" style={{
        padding: '5rem 1.5rem',
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontFamily: 'Alef, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 'bold',
            color: '#52327D',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            מה תמצאי במדריך?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                icon: '🎯',
                title: 'כיוון ברור',
                description: 'איך למצוא כיוון אישי בתפילה, גם כשהמילים נראות תמיד אותו דבר'
              },
              {
                icon: '⏱️',
                title: 'מעשי וקצר',
                description: 'תובנות שאפשר ליישם מיד – בלי לדרוש שעות נוספות ביום'
              },
              {
                icon: '💫',
                title: 'חיבור אמיתי',
                description: 'טכניקות פשוטות להתחבר לתפילה מהלב, לא רק מהסידור'
              }
            ].map((benefit, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(82, 50, 125, 0.03)',
                  padding: '2.5rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: '2px solid rgba(82, 50, 125, 0.1)',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = '#8C4FB9';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(82, 50, 125, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(82, 50, 125, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: '3.5rem',
                  marginBottom: '1.25rem'
                }}>
                  {benefit.icon}
                </div>
                <h3 style={{
                  fontFamily: 'Alef, sans-serif',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#52327D',
                  marginBottom: '1rem'
                }}>
                  {benefit.title}
                </h3>
                <p style={{
                  fontFamily: 'Heebo, sans-serif',
                  fontSize: '1.125rem',
                  color: '#4A5568',
                  lineHeight: 1.8
                }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA after benefits */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '3rem' 
          }}>
            <button
              onClick={scrollToSignup}
              className="cta-primary"
              style={{
                fontFamily: 'Heebo, sans-serif',
                fontSize: '1.25rem',
                padding: '1rem 2.5rem'
              }}
            >
              רוצה את המדריך? לחצי כאן ←
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section dir="rtl" style={{
        padding: '5rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(82, 50, 125, 0.05) 0%, rgba(95, 166, 166, 0.05) 100%)'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontFamily: 'Alef, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 'bold',
            color: '#52327D',
            marginBottom: '2rem'
          }}>
            מי אני?
          </h2>

          <div style={{
            fontFamily: 'Heebo, sans-serif',
            fontSize: '1.125rem',
            color: '#4A5568',
            lineHeight: 1.9,
            textAlign: 'right'
          }}>
            <p style={{ marginBottom: '1.5rem' }}>
              שמי רות פריסמן, ואני מאמנת רגשית, סופרת ומנחת סדנאות.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              במשך שנים ליוויתי נשים בתהליכי שינוי – בעבודה על עצמן, בהתמודדות עם חרדות, ובמציאת שלום פנימי.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              בתוך כל זה גיליתי שתפילה יכולה להיות לא רק חובה, אלא כלי עוצמתי לחיבור – לעצמנו, לבורא, ולחיים שלנו.
            </p>
            <p>
              ולכן כתבתי את המדריך הזה – כדי לעזור לך למצוא את הדרך שלך לתפילה שמרגישה אמיתית.
            </p>
          </div>

          {/* Final CTA */}
          <div style={{ marginTop: '3rem' }}>
            <button
              onClick={scrollToSignup}
              className="cta-primary"
              style={{
                fontFamily: 'Heebo, sans-serif',
                fontSize: '1.25rem',
                padding: '1rem 2.5rem'
              }}
            >
              קבלי את המדריך עכשיו ←
            </button>
          </div>
        </div>
      </section>

      {/* Thanks Section - Only shown after successful submission */}
      {showSuccess && (
        <section id="thanks" dir="rtl" style={{
          padding: '5rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderTop: '2px solid rgba(82, 50, 125, 0.1)'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1.5rem'
            }}>
              ✅
            </div>

            <h2 style={{
              fontFamily: 'Alef, sans-serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 'bold',
              color: '#52327D',
              marginBottom: '1.5rem'
            }}>
              תודה! שלחנו לך את המדריך
            </h2>

            <p style={{
              fontFamily: 'Heebo, sans-serif',
              fontSize: '1.25rem',
              color: '#4A5568',
              lineHeight: 1.8,
              marginBottom: '2rem'
            }}>
              המדריך בדרך אלייך במייל. תוך דקה-שתיים הוא יגיע.<br />
              אם לא רואה אותו, כדאי לבדוק בתיבת הספאם.
            </p>

            <div style={{
              backgroundColor: 'rgba(95, 166, 166, 0.1)',
              padding: '2rem',
              borderRadius: '12px',
              border: '2px solid rgba(95, 166, 166, 0.2)',
              marginTop: '2.5rem'
            }}>
              <h3 style={{
                fontFamily: 'Alef, sans-serif',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#52327D',
                marginBottom: '1rem'
              }}>
                מה עכשיו?
              </h3>
              <p style={{
                fontFamily: 'Heebo, sans-serif',
                fontSize: '1.125rem',
                color: '#4A5568',
                lineHeight: 1.8
              }}>
                <Check className="inline ml-2" size={20} style={{ color: '#5FA6A6' }} /> המדריך כבר במייל שלך<br />
                <Check className="inline ml-2" size={20} style={{ color: '#5FA6A6' }} /> בקרוב תקבלי תכנים נוספים שיעזרו לך<br />
                <Check className="inline ml-2" size={20} style={{ color: '#5FA6A6' }} /> ותהיי הראשונה לדעת על סדנאות והרצאות חדשות
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default PrayerGuideLanding;