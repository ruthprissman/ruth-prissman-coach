import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
          const pdfUrl = `${window.location.origin}/assets/prayer-guide.pdf`;
          
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
      const pdfUrl = `${window.location.origin}/assets/prayer-guide.pdf`;
      
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
        <title>מדריך חינם: להתפלל כשאין זמן | רות פריסמן</title>
        <meta 
          name="description" 
          content="קבלי מדריך מעשי חינם לסדר קדימויות בתפילה לנשים עסוקות. גלי איך להפוך תפילה קצרה לחוויה משמעותית." 
        />
        <meta property="og:title" content="מדריך חינם: להתפלל כשאין זמן | רות פריסמן" />
        <meta property="og:description" content="קבלי מדריך מעשי חינם לסדר קדימויות בתפילה" />
        <meta property="og:image" content={`${window.location.origin}/assets/pearl-bg.png`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground" dir="rtl">
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-50 bg-primary/95 backdrop-blur-sm shadow-md">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h2 className="text-white font-semibold text-lg">מדריך תפילה לנשים עסוקות</h2>
            <Button 
              onClick={scrollToSignup}
              variant="secondary"
              size="sm"
              className="shadow-lg"
            >
              קבלי את המדריך
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <section 
          className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(/assets/pearl-bg.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="container mx-auto px-4 py-20 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              גם כשהתפילה קצרה והמחשבות נודדות,<br />
              יש לך זכות ויכולת להפוך אותה לחוויה.<br />
              כזו שתחכי לה כל יום.
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              הורידי בחינם את המדריך המעשי <strong>"להתפלל כשאין זמן – סדר קדימויות התפילה לנשים"</strong> וקבלי את סדר קדימויות התפילה בצורה ברורה. גלי על מה מדלגים קודם כשהזמן קצר, בלי לוותר על החיבור.
            </p>
            <Button 
              onClick={scrollToSignup}
              size="lg"
              className="text-lg px-8 py-6 shadow-xl hover:scale-105 transition-transform"
            >
              אני רוצה את המדריך
            </Button>
          </div>
        </section>

        {/* Pain + Solution Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="order-2 md:order-1">
                <img 
                  src="/assets/butterfly.png" 
                  alt="פרפר צבעוני"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
              <div className="order-1 md:order-2 space-y-6">
                <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  מרגישה שהתפילה הפכה לעוד משימה ברשימה העמוסה של היום?
                </div>
                <p className="text-lg leading-relaxed">
                  את לא לבד. הרבה נשים מרגישות שהתפילה היומיומית היא עוד דבר שצריך "לסיים", במקום חוויה שמחברת. השאלות הן תמיד אותן השאלות: "האם אני עושה את זה נכון?", "מה חייבים ומה אפשר לדלג?", "איך אני מתפללת כשיש לי רק 10 דקות?".
                </p>
                <p className="text-lg leading-relaxed">
                  המדריך הזה נותן לך תשובות ברורות, כך שתוכלי להתפלל בראש שקט ובלב פתוח – גם כשהזמן קצוב.
                </p>
                <Button 
                  onClick={scrollToSignup}
                  variant="outline"
                  size="lg"
                  className="mt-4"
                >
                  לעבור לטופס ההרשמה
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              מה את מקבלת כשאת מצטרפת?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-xl font-bold mb-3">המדריך המיידי (PDF להורדה)</h3>
                <p className="text-muted-foreground leading-relaxed">
                  סדר קדימויות מפורט ומעשי – מה מחויב, מה מומלץ, ומה אפשר לדלג. הכל בצורה ברורה, נוחה להדפסה ולשמירה.
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">✉️</div>
                <h3 className="text-xl font-bold mb-3">תוכן שבועי – "חיבורים קטנים"</h3>
                <ul className="text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                  <li>רעיונות קצרים להתפללות יומיומית</li>
                  <li>תובנות על התפתחות אישית והורות</li>
                  <li>מדריכים נוספים שיעזרו לך לגדול</li>
                </ul>
              </div>

              <div className="bg-card p-8 rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">🗣</div>
                <h3 className="text-xl font-bold mb-3">הרצאות וסדנאות</h3>
                <p className="text-muted-foreground leading-relaxed">
                  תהיי הראשונה לדעת על סדנאות, שיעורים והרצאות בנושאי תפילה, התפתחות אישית ומנהיגות נשית.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button 
                onClick={scrollToSignup}
                size="lg"
                className="text-lg px-8 py-6"
              >
                להורדת המדריך והצטרפות לרשימה
              </Button>
            </div>
          </div>
        </section>

        {/* Signup Form */}
        <section 
          id="signup" 
          ref={signupRef}
          className="py-16 bg-primary/5"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-card p-8 md:p-12 rounded-2xl shadow-2xl border border-border">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
                הצטרפי וקבלי מיד למייל את המדריך
              </h2>

              {showSuccess ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                    מעולה!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    שלחנו אלייך עכשיו את המדריך למייל.<br />
                    אם לא הגיע תוך דקה, בדקי בתיבת הספאם.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
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

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-lg">
                      שם מלא <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="הכניסי את שמך המלא"
                      className="text-lg p-6"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-lg">
                      דוא״ל <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="text-lg p-6"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-start space-x-3 space-x-reverse">
                    <Checkbox
                      id="consent"
                      checked={consent}
                      onCheckedChange={(checked) => setConsent(checked as boolean)}
                      disabled={isLoading}
                      required
                    />
                    <Label 
                      htmlFor="consent" 
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      בהרשמתי אני מסכימה לקבל מרות פריסמן תכנים במייל בנושאי תפילה והתפתחות אישית, כולל מדריכים, תוכן שבועי, ועדכונים על סדנאות והרצאות. ניתן להסיר את עצמי מהרשימה בכל עת בלחיצה אחת.
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg py-6"
                    disabled={isLoading}
                  >
                    {isLoading ? 'שולחות...' : 'אני רוצה את המדריך'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
                נעים מאוד, אני רות פריסמן
              </h2>
              <div className="prose prose-lg dark:prose-invert mx-auto text-right" dir="rtl">
                <p className="text-lg leading-relaxed">
                  אני מאמנת תפילה ומטפלת בגישה רגשית-רוחנית. עבדתי שנים רבות עם נשים שמחפשות דרך להתחבר מחדש לתפילה – לא מתוך חובה, אלא מתוך רצון אמיתי.
                </p>
                <p className="text-lg leading-relaxed">
                  המדריך הזה נולד מתוך אלפי שיחות עם נשים שמרגישות לחוצות, אשמות, או פשוט מבולבלות לגבי התפילה שלהן. הוא נותן תשובות ברורות, מעשיות ומלאות חמלה – כדי שכל אחת תוכל להתפלל בדרך שלה, בקצב שלה, ועדיין להרגיש מחוברת.
                </p>
                <p className="text-lg leading-relaxed">
                  אני מזמינה אותך לקחת את המדריך, לנסות, ולראות איך התפילה יכולה להפוך למשהו שאת באמת מחכה לו.
                </p>
              </div>
              <div className="text-center mt-8">
                <Button 
                  onClick={scrollToSignup}
                  size="lg"
                  variant="outline"
                >
                  להצטרפות וקבלת המדריך
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Thanks Section */}
        <section id="thanks" className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-card p-8 rounded-2xl shadow-lg text-center border border-border">
              <div className="text-5xl mb-4">🙏</div>
              <h2 className="text-2xl font-bold mb-4">תודה שנרשמת!</h2>
              <p className="text-lg text-muted-foreground mb-6">
                המדריך כבר בדרך אלייך. בדקי את תיבת המייל (ואם לא מצאת, גם את תיבת הספאם).
              </p>
              <Button 
                onClick={scrollToSignup}
                variant="outline"
              >
                חזרה לטופס
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PrayerGuideLanding;
