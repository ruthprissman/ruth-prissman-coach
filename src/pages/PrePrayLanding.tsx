import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Heart, 
  Headphones, 
  Target, 
  Key, 
  RefreshCw, 
  Check, 
  Sparkles,
  CheckCircle2,
  ArrowDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { prePrayContent } from '@/content/landing/prePray';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const leadFormSchema = z.object({
  name: z.string().min(2, { message: 'נא להזין שם מלא' }),
  phone: z.string().regex(/^0\d{1,2}-?\d{7}$/, { message: 'נא להזין מספר טלפון תקין' }),
  email: z.string().email({ message: 'נא להזין כתובת אימייל תקינה' }),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'יש לאשר את תנאי השימוש ומדיניות הפרטיות',
  }),
  agreeToMarketing: z.boolean(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

const PrePrayLanding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      agreeToTerms: false,
      agreeToMarketing: false,
    },
  });

  const scrollToForm = () => {
    const element = document.getElementById('lead-form-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          name: data.name,
          phone: data.phone,
          email: data.email,
          source: 'pre-pray-landing',
          status: 'טופס התחלתי',
          agreed_to_terms: data.agreeToTerms,
          agreed_to_marketing: data.agreeToMarketing,
        });

      if (error) throw error;

      // שמירת הנתונים ב-localStorage כגיבוי
      localStorage.setItem('prePrayLeadData', JSON.stringify(data));
      
      toast({
        title: '✅ הפרטים נשמרו בהצלחה',
        description: 'מעביר לדף התשלום...',
      });

      setTimeout(() => {
        navigate('/pre-pray-payment', {
          state: { leadData: data },
        });
      }, 1000);
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: '❌ שגיאה',
        description: 'אופס, משהו השתבש. נסי שוב או צרי קשר איתי.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const stepIcons = [Key, Headphones, Target, Heart, RefreshCw];

  return (
    <>
      <Helmet>
        <title>{prePrayContent.meta.title}</title>
        <meta name="description" content={prePrayContent.meta.description} />
      </Helmet>

      <div className="min-h-screen bg-background" dir="rtl">
        {/* Hero Section */}
        <section 
          className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: 'url(/assets/pre-pray-hero-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px]" />
          
          <div className="container relative z-10 max-w-4xl px-4 py-16 text-center">
            <p className="text-lg md:text-xl text-purple-dark/80 mb-6 font-heebo">
              {prePrayContent.hero.introText}
            </p>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-purple-darkest mb-4 leading-tight font-alef">
              התפילה שלך היא מטלה או מתנה?
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-800 mb-8 leading-relaxed font-heebo">
              גלי איך שתי דקות בבוקר יכולות להפוך מילים שנאמרות מעצמן
              <br />
              לחוויה מרגשת, משמעותית וממלאת כוח
              <br />
              עוד היום.
            </p>
            
            <button 
              onClick={scrollToForm}
              className="cta-primary"
              style={{
                fontFamily: 'Alef, sans-serif',
                fontSize: '1.5rem',
                padding: '1.25rem 3rem'
              }}
            >
              {prePrayContent.hero.ctaButton} <ArrowDown className="inline mr-2" size={24} />
            </button>
          </div>
        </section>

        {/* Pain Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-4xl px-4">
            <div className="text-center space-y-6 font-heebo">
              <h2 className="text-3xl md:text-4xl font-bold text-[#5FA6A6] mb-6 font-alef leading-relaxed">
                את יודעת מה שאמרתי לך שזה מרגיש כמו יותר מידי בתפילה?
              </h2>
              
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed">
                אז זה לא רק אצלך.
              </p>
              
              <ul className="space-y-4 max-w-2xl mx-auto">
                {prePrayContent.pain.feelings.map((feeling, index) => (
                  <li key={index} className="flex items-center justify-center gap-3 text-purple-dark/90">
                    <Heart className="w-4 h-4 text-[#5FA6A6] shrink-0 mt-1.5 fill-[#5FA6A6]/20" />
                    <span className="text-lg leading-relaxed">"{feeling}"</span>
                  </li>
                ))}
              </ul>
              
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed mt-8 whitespace-pre-line">
                {prePrayContent.pain.closing}
              </p>
              
              <div className="p-6 my-8">
                <p className="text-lg text-purple-darkest leading-relaxed">
                  "{prePrayContent.pain.quote}"
                </p>
              </div>
              
              <div className="text-center mt-10">
                <button 
                  onClick={scrollToForm}
                  className="cta-primary"
                  style={{
                    fontFamily: 'Alef, sans-serif',
                    fontSize: '1.25rem',
                    padding: '1rem 2.5rem'
                  }}
                >
                  {prePrayContent.pain.ctaButton} <ArrowDown className="inline mr-2" size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-4xl px-4">
            <div className="text-center space-y-6 font-heebo">
              <h2 className="text-3xl md:text-4xl font-bold text-[#5FA6A6] mb-6 font-alef leading-relaxed">
                אבל מה אם הייתי אומרת לך שאת נמצאת במרחק שתי דקות בלבד מתפילה שאת משתוקקת לה?
              </h2>
              
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed">
                אני יודעת, זה נשמע טוב מכדי להיות אמיתי. בתור מאמנת רגשית שליוויתי נשים רבות במסע הזה, גיליתי שהסוד הוא לא להוסיף עוד משימות, אלא לזהות ולדייק את מה שאת כבר עושה.
              </p>
              
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed">
                ב"דקה לפני העמידה", ברכות השחר, המוכרות עוד מהגן, יהפכו להיות חלק ממך.
              </p>
              
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed font-bold">
                עם "דקה לפני העמידה", את יכולה גם וגם:
              </p>
              
              <ul className="space-y-3 max-w-2xl mx-auto mt-6">
                {prePrayContent.solution.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center justify-center gap-3 text-purple-dark">
                    <Check className="w-6 h-6 text-gold shrink-0 mt-1" />
                    <span className="text-lg leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <p className="text-xl md:text-2xl font-bold text-purple-darkest mt-8 font-alef">
                {prePrayContent.solution.closing}
              </p>
              
              <div className="text-center mt-10">
                <button 
                  onClick={scrollToForm}
                  className="cta-primary"
                  style={{
                    fontFamily: 'Alef, sans-serif',
                    fontSize: '1.5rem',
                    padding: '1.25rem 3rem'
                  }}
                >
                  {prePrayContent.solution.ctaButton} <ArrowDown className="inline mr-2" size={24} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-4xl px-4">
            <div className="text-center space-y-6 font-heebo">
              <h2 className="text-3xl md:text-4xl font-bold text-[#5FA6A6] mb-6 font-alef leading-relaxed">
                אז איך זה עובד?
              </h2>
              
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed">
                ב"דקה לפני העמידה" את תלמדי את הסוד הכי פשוט והכי עמוק של תפילה שבאמת נוגעת:
              </p>
              
              <div className="p-8 rounded-lg mt-8">
                <h3 className="text-2xl md:text-3xl font-bold text-purple-darkest mb-4 font-alef">
                  {prePrayContent.howItWorks.secret.title}
                </h3>
                <p className="text-lg text-purple-dark leading-relaxed mb-6">
                  {prePrayContent.howItWorks.secret.content}
                </p>
                
                <ol className="space-y-4 max-w-2xl mx-auto text-right">
                  {prePrayContent.howItWorks.secret.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-gold font-bold text-xl">{index + 1}.</span>
                      <div>
                        <span className="font-bold text-purple-darkest text-lg">{step.title}</span>
                        <span className="text-purple-dark"> – {step.content}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed mt-8">
                {prePrayContent.howItWorks.closing}
              </p>
              
              <div className="text-center mt-10">
                <button 
                  onClick={scrollToForm}
                  className="cta-primary"
                  style={{
                    fontFamily: 'Alef, sans-serif',
                    fontSize: '1.5rem',
                    padding: '1.25rem 3rem'
                  }}
                >
                  {prePrayContent.howItWorks.ctaButton} <ArrowDown className="inline mr-2" size={24} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-4xl px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#5FA6A6] text-center mb-12 font-alef">
              {prePrayContent.process.title}
            </h2>
            
            <div className="space-y-8">
              {prePrayContent.process.steps.map((step, index) => {
                const Icon = stepIcons[index];
                return (
                  <div 
                    key={index}
                    className="border-2 border-purple-200 rounded-lg p-6 md:p-8 hover:border-gold transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4 text-center flex-col items-center">
                      <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-full w-12 h-12 flex items-center justify-center shrink-0 font-bold text-xl font-alef">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Icon className="w-6 h-6 text-gold" />
                          <h3 className="text-xl md:text-2xl font-bold text-purple-darkest font-alef">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-lg text-purple-dark leading-relaxed font-heebo">
                          {step.content}
                        </p>
                        {step.quote && (
                          <div className="py-3 mt-4 rounded">
                            <p className="text-base text-purple-darkest/90 leading-relaxed font-heebo">
                              {step.quote}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Offer & Price Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-4xl px-4">
            <div className="border-4 border-gold rounded-lg p-8 md:p-12 shadow-xl">
              <h2 className="text-3xl md:text-4xl font-bold text-[#5FA6A6] mb-6 font-alef leading-relaxed text-center">
                אז מה את מקבלת ב"דקה לפני העמידה"?
              </h2>
              
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed mb-6 text-center font-heebo">
                חבילה מלאה שמלווה אותך צעד אחר צעד:
              </p>
              
              <div className="space-y-6 mb-8 max-w-2xl mx-auto">
                {prePrayContent.offer.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-center gap-4 text-center flex-col">
                    <Sparkles className="w-6 h-6 text-gold shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-purple-darkest mb-1 font-alef">
                        {item.title}
                      </h4>
                      <p className="text-purple-dark mb-1 font-heebo">{item.description}</p>
                      <p className="text-gold font-bold font-heebo">שווי: {item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t-2 border-gold pt-6 mt-6 text-center">
                <p className="text-lg text-purple-dark mb-2 font-heebo">
                  <span className="font-bold">שווי כולל:</span>{' '}
                  <span className="line-through">{prePrayContent.offer.totalValue}</span>
                </p>
                <p className="text-xl text-purple-darkest mb-2 font-heebo">
                  {prePrayContent.offer.priceLabel}
                </p>
                <p className="text-4xl md:text-5xl font-bold text-gold mb-8 font-alef">
                  {prePrayContent.offer.specialPrice}
                </p>
                
                <button 
                  onClick={scrollToForm}
                  className="cta-primary"
                  style={{
                    fontFamily: 'Alef, sans-serif',
                    fontSize: '1.5rem',
                    padding: '1.25rem 3rem'
                  }}
                >
                  {prePrayContent.offer.ctaButton} <ArrowDown className="inline mr-2" size={24} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Lead Form Section */}
        <section id="lead-form-section" className="py-16 md:py-24 bg-gradient-to-br from-purple-light via-white to-[#E5F5F5] scroll-mt-20">
          <div className="container max-w-2xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#5FA6A6] mb-4 font-alef">
                {prePrayContent.leadForm.title}
              </h2>
              <p className="text-xl text-purple-dark font-heebo">
                {prePrayContent.leadForm.subtitle}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-purple-light/20">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold text-purple-dark">
                          {prePrayContent.leadForm.fields.name.label}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={prePrayContent.leadForm.fields.name.placeholder}
                            {...field}
                            className="text-lg py-6"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold text-purple-dark">
                          {prePrayContent.leadForm.fields.phone.label}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={prePrayContent.leadForm.fields.phone.placeholder}
                            {...field}
                            className="text-lg py-6"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold text-purple-dark">
                          {prePrayContent.leadForm.fields.email.label}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={prePrayContent.leadForm.fields.email.placeholder}
                            {...field}
                            className="text-lg py-6"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-2">
                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base text-purple-dark font-normal cursor-pointer">
                              אני מאשר/ת שקראתי ואני מסכימ/ה ל
                              <Link 
                                to="/pre-pray-terms" 
                                className="text-[#5FA6A6] hover:text-[#4a8585] underline mr-1"
                                target="_blank"
                              >
                                תנאי השימוש ומדיניות הפרטיות
                              </Link>
                              של התוכנית "דקה לפני התפילה – ברכות השחר"
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agreeToMarketing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base text-purple-dark font-normal cursor-pointer">
                              אני מאשר/ת קבלת דיוור שבועי לתוכן לימודי והצעות מסחריות נוספות, בהתאם לחוק התקשורת (תיקון 40)
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-purple-light/20 border border-purple-light rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-[#5FA6A6] shrink-0 mt-0.5" />
                      <p className="text-sm text-purple-dark leading-relaxed">
                        <strong>גילוי נאות:</strong> ברכישת מוצר זה, שהינו תוכן דיגיטלי המסופק באופן מידי במייל ובגישה טלפונית, לא ניתן לבטל את העסקה ולקבל החזר, בהתאם לסעיף 14ג(ד)(1) לחוק הגנת הצרכן.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#5FA6A6] text-white py-6 text-xl font-bold hover:bg-[#4a8585] transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        {prePrayContent.leadForm.loadingButton}
                      </>
                    ) : (
                      prePrayContent.leadForm.submitButton
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-4xl px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#5FA6A6] text-center mb-4 font-alef">
              {prePrayContent.faq.title}
            </h2>
            <p className="text-lg md:text-xl text-purple-dark text-center mb-12 font-heebo">
              {prePrayContent.faq.subtitle}
            </p>
            
            <Accordion type="single" collapsible className="space-y-4">
              {prePrayContent.faq.items.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border-2 border-purple-200 rounded-lg px-6 hover:border-gold transition-all"
                >
                  <AccordionTrigger className="text-center text-lg md:text-xl font-bold text-purple-darkest py-6 font-alef hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-center text-lg text-purple-dark leading-relaxed pb-6 font-heebo">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
          <div className="container max-w-4xl px-4 text-center">
            <p className="text-lg md:text-xl leading-relaxed mb-8 max-w-3xl mx-auto font-heebo">
              {prePrayContent.finalCta.content}
            </p>
            
            <button 
              onClick={scrollToForm}
              className="cta-primary"
              style={{
                fontFamily: 'Alef, sans-serif',
                fontSize: '1.5rem',
                padding: '1.25rem 3rem'
              }}
            >
              {prePrayContent.finalCta.ctaButton} <ArrowDown className="inline mr-2" size={24} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default PrePrayLanding;
