import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, CheckCircle, XCircle, Star, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const RuthFrissmanWorkshop = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    inquiry_title: 'Workshop Interest',
    email: '',
    phone: '',
    message: '',
    date_option_1: undefined as Date | undefined,
    date_option_2: undefined as Date | undefined,
    date_option_3: undefined as Date | undefined,
    group_type: '',
    format: '',
    consent_privacy: false
  });

  // Track analytics events
  const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('speaker_leads')
        .insert([{
          full_name: formData.full_name,
          inquiry_title: formData.inquiry_title,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          date_option_1: formData.date_option_1?.toISOString().split('T')[0],
          date_option_2: formData.date_option_2?.toISOString().split('T')[0],
          date_option_3: formData.date_option_3?.toISOString().split('T')[0],
          group_type: formData.group_type,
          format: formData.format,
          consent_privacy: formData.consent_privacy,
          status: 'new'
        }]);

      if (error) throw error;

      // Track success
      trackEvent('form_submit', { page_id: 'speaker_profile' });

      toast({
        title: "תודה על פנייתך!",
        description: "נחזור אלייך עד שני ימי עסקים.",
      });

      // Reset form
      setFormData({
        full_name: '',
        inquiry_title: 'Workshop Interest',
        email: '',
        phone: '',
        message: '',
        date_option_1: undefined,
        date_option_2: undefined,
        date_option_3: undefined,
        group_type: '',
        format: '',
        consent_privacy: false
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "שגיאה בשליחה",
        description: (
          <div>
            מצטערים, היתה שגיאה בשליחת הטופס. 
            <br />
            <a 
              href="mailto:ruth@ruthprissman.co.il" 
              className="underline hover:text-brand-purple"
              onClick={() => trackEvent('email_click')}
            >
              אנא צרי קשר ישירות במייל
            </a>
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const faqData = [
    {
      question: "כמה זמן אורכת הסדנה?",
      answer: "הסדנה נמשכת כשעתיים וחצי, כולל הפסקה קצרה באמצע. יש גמישות בזמנים בהתאם לצרכי הקבוצה."
    },
    {
      question: "האם צריך ידע מוקדם בתפילה?",
      answer: "בהחלט לא! הסדנה מתאימה לכל רמות הידע - ממי שמתחילה עכשיו ועד מי שמתפללת שנים. נתחיל מהבסיס."
    },
    {
      question: "כמה משתתפות יכולות להיות בסדנה?",
      answer: "הקבוצה האידיאלית היא 8-15 משתתפות. זה מאפשר אווירה אינטימית וזמן לכל אחת לשתף ולקבל תשומת לב אישית."
    },
    {
      question: "מה כדאי להביא לסדנה?",
      answer: "רק את עצמך ופתיחות ללמוד! אספק את כל החומרים הנדרשים, כולל חוברת עם התרגילים שנעשה."
    },
    {
      question: "האם אפשר לעשות סדנה בזום?",
      answer: "כן! הסדנה יעילה מאוד גם בזום. המפגשים הווירטואליים מאפשרים השתתפות נוחה מהבית ויוצרים אווירה חמה ומחברת."
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage", 
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <Helmet>
        <html lang="he" dir="rtl" />
        <title>רות פריסמן - מאמנת רגשית ומלווה נשים | הרצאות וסדנאות תפילה</title>
        <meta name="description" content="מחברות מחדש בין המילים המוכרות ללב. סדנאות והרצאות חדשניות לחיבור עמוק יותר לתפילה עם רות פריסמן." />
        <meta property="og:title" content="רות פריסמן - חיבורים חדשים לתפילה" />
        <meta property="og:description" content="מחברות מחדש בין המילים המוכרות ללב. סדנאות והרצאות חדשניות לחיבור עמוק יותר לתפילה." />
        <meta property="og:url" content="https://coach.ruthprissman.co.il/main-workshops" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://coach.ruthprissman.co.il/main-workshops" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        
        {/* Hero Section */}
        <section 
          id="hero" 
          className="relative py-20 lg:py-32 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/assets/glass-stones-beach.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-white/85"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8">
                <img 
                  src="/assets/new-logo.png" 
                  alt="אייקון רות פריסמן"
                  className="w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-6"
                />
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 text-text-primary">
                רות פריסמן
              </h1>
              
              <p className="text-xl lg:text-2xl mb-4 text-brand-purple">
                מאמנת רגשית ומלווה נשים | הרצאות וסדנאות: חיבורים חדשים לתפילה
              </p>
              
              <p className="text-lg mb-8 text-muted-foreground">
                חיבורים חדשים בין המילים המוכרות ללב
              </p>
              
              <div className="flex justify-center mb-12">
                <Button 
                  size="lg"
                  className="bg-brand-purple text-white hover:bg-brand-purple/90 px-8 py-3 text-lg rounded-full shadow-lg border-0"
                  onClick={() => scrollToSection('contact')}
                >
                  לבירור והרשמה
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <button 
                  onClick={() => scrollToSection('about')}
                  className="text-brand-purple hover:underline"
                >
                  מי אני?
                </button>
                <span className="text-muted-foreground">|</span>
                <button 
                  onClick={() => scrollToSection('workshops')}
                  className="text-brand-purple hover:underline"
                >
                  סדנאות
                </button>
                <span className="text-muted-foreground">|</span>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="text-brand-purple hover:underline"
                >
                  המלצות
                </button>
                <span className="text-muted-foreground">|</span>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="text-brand-purple hover:underline"
                >
                  שאלות נפוצות
                </button>
                <span className="text-muted-foreground">|</span>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-brand-purple hover:underline"
                >
                  יצירת קשר
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8 text-text-primary">מי אני?</h2>
              <div className="text-lg leading-relaxed mb-8 text-muted-foreground">
                <p className="mb-6">
                  אני רות פריסמן מאמנת רגשית ומלווה נשים נשים מיוחדות שבוחרות לחיות את חייהן בתחושת שיחרור, חיבור והנאה.
                </p>
                <p className="mb-6">
                  לא תמיד הייתי מאמנת, שנים הייתי מתכנתת, ובעקבות רצף נסיונות גם בתחום הבריאות, למדתי ועדיין לומדת את תורת הנפש.
                </p>
                <p className="mb-6">
                  הכלים שאני עובדת איתם הם שיטת &quot;קוד הנפש&quot; שפותחה על ידי שמחה אביטן S-EFT - לטיפול ממוקד בטראומה וNLP.
                </p>
                <p className="mb-6">
                  מתוך שעות ארוכות של שיחות עם נשים איכותיות, ותהליכים עמוקים מצאתי, כי התפילה, היא עוגן מרכזי בבריאות הנפש שלנו, ומשם התחלתי ללמוד. וכיום גם ללמד ולהרצות, על בניית הנפש והרוח דרך מילות תפילה, בפורמטים מותאמים לנשים פרטיות ולקהלים ארגוניים.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="flex items-center gap-3 text-right">
                    <div className="w-3 h-3 bg-brand-purple rounded-full flex-shrink-0"></div>
                    <span>גדילה פנימית</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="w-3 h-3 bg-brand-purple rounded-full flex-shrink-0"></div>
                    <span>זוגיות וילדים</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="w-3 h-3 bg-brand-purple rounded-full flex-shrink-0"></div>
                    <span>התמודדות עם משקעי עבר</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workshops Section */}
        <section id="workshops" className="py-16 bg-surface-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 text-center text-text-primary">חיבורים קטנים למילים גדולות</h2>
              <p className="text-center text-muted-foreground mb-12">סדנאות והרצאות על תפילה ונפש</p>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Workshop 1 */}
                <Card className="border-2 border-brand-purple/20 hover:border-brand-purple/40 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-xl text-text-primary">חיבורים קטנים למילים גדולות</CardTitle>
                    <CardDescription>סדנה על תפילה, רצון והנאה פנימית</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground">
                      הסוד להפוך תפילה מעוד חובה
                      (שלא תמיד אנחנו מצליחים למלא),
                      למילים, לשיחה אמיתית שממלאת אותך בכוח.
                    </p>
                    
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-text-primary">מה תרכשי בסדנה:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>תגלי איך למצוא את עצמנו בתוך המילים המוכרות של הסידור.</li>
                        <li>תזהי את החסם האישי שלנו להתחברות ונהפוך אותו לכלי הכי חזק שלנו.</li>
                        <li>תקבלי תרגילים מעשיים וקלים ליישום ליצירת חיבור.</li>
                      </ol>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p><strong>פורמט:</strong> זום או פרונטלי</p>
                      <p><strong>משך:</strong> 1.5 שעות</p>
                      <p><strong>גודל קבוצה:</strong> עד 50 משתתפות</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Workshop 2 - Coming Soon */}
                <Card className="border-2 border-muted/40 opacity-75">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl text-muted-foreground">תפילה- יישום לאמונה</CardTitle>
                      <Badge variant="secondary">בקרוב</Badge>
                    </div>
                    <CardDescription>סדנה מיוחדת לחיבור עמוק יותר לתפילות השבת</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground">
                      סדנה שתעמיק את החיבור שלך לתפילות השבת והחג, ותלמד אותך לחוות את הזמנים המיוחדים 
                      כהזדמנות לחידוש רוחני.
                    </p>
                    
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-text-primary">עדכני אותי כשהסדנה תפתח:</h4>
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const email = formData.get('email') as string;
                          const note = formData.get('note') as string;
                          
                          try {
                            await supabase.from('speaker_leads').insert({
                              full_name: '',
                              inquiry_title: 'Interest: Workshop 2',
                              email,
                              phone: '',
                              message: note,
                              status: 'new',
                              consent_privacy: true
                            });
                            
                            toast({
                              title: "תודה!",
                              description: "נעדכן אותך ברגע שהסדנה תפתח להרשמה.",
                            });
                            
                            (e.target as HTMLFormElement).reset();
                          } catch (error) {
                            toast({
                              title: "שגיאה",
                              description: "אנא נסי שוב מאוחר יותר.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="space-y-3"
                      >
                        <Input 
                          type="email" 
                          name="email" 
                          placeholder="כתובת מייל" 
                          required 
                          className="text-sm"
                        />
                        <Input 
                          type="text" 
                          name="note" 
                          placeholder="הערה (אופציונלי)" 
                          className="text-sm"
                        />
                        <Button type="submit" size="sm" className="w-full bg-brand-purple text-white hover:bg-brand-purple/90 rounded-full">
                          עדכני אותי
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 bg-surface-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-12 text-center text-text-primary">מה משתתפות אומרות</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-brand-turquoise/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-2 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-lg italic mb-4 text-muted-foreground">
                      "תודה רות, היה מדהים, מרתק ומאוד מחבר ומתוק... ברגעים שהייתי היה נהדר."
                    </blockquote>
                    <cite className="font-semibold text-text-primary">**אילה**</cite>
                  </CardContent>
                </Card>
                
                <Card className="border-brand-turquoise/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-2 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-lg italic mb-4 text-muted-foreground">
                      "הרגשתי שאת מאוד מחוברת לרצון, והלב והנתינה הגדולה... נקודות שנתנו כלים להתחבר לתפילה."
                    </blockquote>
                    <cite className="font-semibold text-text-primary">**מרים**</cite>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-12 text-center text-text-primary">שאלות נפוצות</h2>
              
              <Accordion type="single" collapsible className="space-y-4">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-brand-purple/20">
                    <AccordionTrigger className="text-right text-text-primary hover:text-brand-purple">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 bg-surface-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">יצירת קשר</h2>
              
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-xl font-semibold mb-6 text-text-primary">בואי נתחיל!</h3>
                  <p className="mb-6 text-muted-foreground">
                    מוזמנת לפנות אליי לכל שאלה או להרשמה לסדנה. אשמח לענות על כל השאלות ולעזור לך למצוא את הסדנה המתאימה לך.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-brand-turquoise" />
                      <span>055-6620273</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-brand-turquoise" />
                      <a 
                        href="mailto:ruth@ruthprissman.co.il"
                        className="hover:text-brand-purple transition-colors"
                        onClick={() => trackEvent('email_click')}
                      >
                        ruth@ruthprissman.co.il
                      </a>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg"
                    className="w-full bg-brand-turquoise text-white hover:bg-brand-turquoise/90 md:hidden rounded-full"
                    onClick={() => {
                      trackEvent('whatsapp_click', { source: 'sticky' });
                      window.open('https://wa.me/972556620273', '_blank');
                    }}
                  >
                    שיחת היכרות בוואטסאפ
                  </Button>
                </div>
                
                <div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-text-primary">שם מלא *</label>
                        <Input
                          required
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-text-primary">נושא הפנייה *</label>
                        <Input
                          required
                          value={formData.inquiry_title}
                          onChange={(e) => setFormData({...formData, inquiry_title: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-text-primary">מייל *</label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-text-primary">טלפון *</label>
                        <Input
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-text-primary">הודעה</label>
                      <Textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="ספרי לי קצת על מה שמעניין אותך..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-primary">תאריכים מועדפים (אופציונלי)</label>
                      <div className="grid sm:grid-cols-3 gap-2">
                        {[1, 2, 3].map((num) => (
                          <Popover key={num}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "justify-start text-right font-normal",
                                  !formData[`date_option_${num}` as keyof typeof formData] && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {formData[`date_option_${num}` as keyof typeof formData] 
                                  ? format(formData[`date_option_${num}` as keyof typeof formData] as Date, "PPP", { locale: he })
                                  : `אופציה ${num}`
                                }
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData[`date_option_${num}` as keyof typeof formData] as Date}
                                onSelect={(date) => setFormData({...formData, [`date_option_${num}`]: date})}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-text-primary">סוג קבוצה</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="group_type"
                              value="organization"
                              checked={formData.group_type === 'organization'}
                              onChange={(e) => setFormData({...formData, group_type: e.target.value})}
                            />
                            <span>ארגון</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="group_type"
                              value="private"
                              checked={formData.group_type === 'private'}
                              onChange={(e) => setFormData({...formData, group_type: e.target.value})}
                            />
                            <span>קבוצה פרטית</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-text-primary">פורמט</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="format"
                              value="zoom"
                              checked={formData.format === 'zoom'}
                              onChange={(e) => setFormData({...formData, format: e.target.value})}
                            />
                            <span>זום</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="format"
                              value="in_person"
                              checked={formData.format === 'in_person'}
                              onChange={(e) => setFormData({...formData, format: e.target.value})}
                            />
                            <span>פרונטלי</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="consent"
                        required
                        checked={formData.consent_privacy}
                        onChange={(e) => setFormData({...formData, consent_privacy: e.target.checked})}
                        className="mt-1"
                      />
                      <label htmlFor="consent" className="text-sm text-muted-foreground">
                        הפרטים ישמשו רק לצורך חזרה אלייך. *
                      </label>
                    </div>
                    
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-brand-purple text-white hover:bg-brand-purple/90 rounded-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'שולח...' : 'שלחי את הפנייה'}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Micro-copy */}
        <div className="bg-brand-purple/5 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg italic mb-4 text-text-primary">
              "תפילה היא זכות. בואי נחזיר לה את העדינות."
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <a 
                href="tel:055-6620273"
                className="text-brand-turquoise hover:underline"
              >
                055-6620273
              </a>
              <span className="text-muted-foreground">|</span>
              <a 
                href="mailto:ruth@ruthprissman.co.il"
                className="text-brand-turquoise hover:underline"
                onClick={() => trackEvent('email_click')}
              >
                ruth@ruthprissman.co.il
              </a>
              <span className="text-muted-foreground">|</span>
              <button 
                onClick={() => {
                  trackEvent('whatsapp_click', { source: 'footer' });
                  window.open('https://wa.me/972556620273', '_blank');
                }}
                className="text-brand-turquoise hover:underline"
              >
                וואטסאפ
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default RuthFrissmanWorkshop;