import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  CheckCircle2
} from 'lucide-react';
import { prePrayContent } from '@/content/landing/prePray';

const PrePrayLanding = () => {
  const [searchParams] = useSearchParams();
  const showSuccess = searchParams.get('success') === 'true';

  const scrollToPayment = () => {
    const element = document.getElementById('payment-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          
          <div className="container relative z-10 max-w-4xl px-4 py-16 text-center">
            <p className="text-lg md:text-xl text-purple-dark/80 mb-6 font-heebo">
              {prePrayContent.hero.introText}
            </p>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-purple-darkest mb-8 leading-relaxed font-alef whitespace-pre-line">
              {prePrayContent.hero.mainHeading}
            </h1>
            
            <Button 
              onClick={scrollToPayment}
              size="lg"
              className="text-lg px-8 py-6 font-alef bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
            >
              {prePrayContent.hero.ctaButton}
            </Button>
          </div>
        </section>

        {/* Pain Section */}
        <section className="py-16 md:py-24 bg-purple-light/5">
          <div className="container max-w-4xl px-4">
            <div className="text-right space-y-6 font-heebo">
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed whitespace-pre-line">
                {prePrayContent.pain.intro}
              </p>
              
              <ul className="space-y-4 mr-4">
                {prePrayContent.pain.feelings.map((feeling, index) => (
                  <li key={index} className="flex items-start gap-3 text-purple-dark/90">
                    <span className="text-gold mt-1">•</span>
                    <span className="text-lg leading-relaxed">"{feeling}"</span>
                  </li>
                ))}
              </ul>
              
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed mt-8 whitespace-pre-line">
                {prePrayContent.pain.closing}
              </p>
              
              <blockquote className="border-r-4 border-gold pr-6 py-4 my-8 bg-gold/5 rounded-r-lg">
                <p className="text-lg italic text-purple-darkest leading-relaxed">
                  "{prePrayContent.pain.quote}"
                </p>
              </blockquote>
              
              <div className="text-center mt-10">
                <Button 
                  onClick={scrollToPayment}
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 font-alef border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                >
                  {prePrayContent.pain.ctaButton}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-purple-50/30 to-gold-50/20">
          <div className="container max-w-4xl px-4">
            <div className="text-right space-y-6 font-heebo">
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed whitespace-pre-line">
                {prePrayContent.solution.content}
              </p>
              
              <ul className="space-y-3 mr-4 mt-6">
                {prePrayContent.solution.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 text-purple-dark">
                    <Check className="w-6 h-6 text-gold shrink-0 mt-1" />
                    <span className="text-lg leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <p className="text-xl md:text-2xl font-bold text-purple-darkest mt-8 font-alef">
                {prePrayContent.solution.closing}
              </p>
              
              <div className="text-center mt-10">
                <Button 
                  onClick={scrollToPayment}
                  size="lg"
                  className="text-lg px-8 py-6 font-alef bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                >
                  {prePrayContent.solution.ctaButton}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24 bg-purple-light/5">
          <div className="container max-w-4xl px-4">
            <div className="text-right space-y-6 font-heebo">
              <p className="text-lg md:text-xl text-purple-dark leading-relaxed whitespace-pre-line">
                {prePrayContent.howItWorks.intro}
              </p>
              
              <div className="bg-gradient-to-br from-gold/10 to-purple-100/20 p-8 rounded-lg mt-8">
                <h3 className="text-2xl md:text-3xl font-bold text-purple-darkest mb-4 font-alef">
                  {prePrayContent.howItWorks.secret.title}
                </h3>
                <p className="text-lg text-purple-dark leading-relaxed mb-6">
                  {prePrayContent.howItWorks.secret.content}
                </p>
                
                <ol className="space-y-4 mr-4">
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
                <Button 
                  onClick={scrollToPayment}
                  size="lg"
                  className="text-lg px-8 py-6 font-alef bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
                >
                  {prePrayContent.howItWorks.ctaButton}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-purple-50/30 to-gold-50/20">
          <div className="container max-w-4xl px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-darkest text-center mb-12 font-alef">
              {prePrayContent.process.title}
            </h2>
            
            <div className="space-y-8">
              {prePrayContent.process.steps.map((step, index) => {
                const Icon = stepIcons[index];
                return (
                  <div 
                    key={index}
                    className="bg-background border-2 border-purple-200 rounded-lg p-6 md:p-8 hover:border-gold transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4 text-right">
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
                          <blockquote className="border-r-4 border-gold pr-4 py-3 mt-4 bg-gold/5 rounded-r">
                            <p className="text-base italic text-purple-darkest/90 leading-relaxed font-heebo">
                              {step.quote}
                            </p>
                          </blockquote>
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
        <section className="py-16 md:py-24 bg-gradient-to-br from-gold/20 to-purple-100/30">
          <div className="container max-w-4xl px-4">
            <div className="bg-background border-4 border-gold rounded-lg p-8 md:p-12 shadow-xl">
              <p className="text-xl md:text-2xl text-purple-dark leading-relaxed mb-8 text-right font-heebo">
                {prePrayContent.offer.intro}
              </p>
              
              <div className="space-y-6 mb-8">
                {prePrayContent.offer.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 text-right">
                    <Sparkles className="w-6 h-6 text-gold shrink-0 mt-1" />
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
                
                <Button 
                  onClick={scrollToPayment}
                  size="lg"
                  className="text-lg px-8 py-6 font-alef bg-gradient-to-br from-gold to-gold/80 text-purple-darkest hover:from-gold/90 hover:to-gold/70 shadow-lg"
                >
                  {prePrayContent.offer.ctaButton}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Section */}
        <section id="payment-section" className="py-16 md:py-24 bg-purple-light/5 scroll-mt-20">
          <div className="container max-w-4xl px-4">
            {showSuccess ? (
              <div className="bg-gradient-to-br from-green-50 to-gold-50 border-4 border-green-400 rounded-lg p-8 md:p-12 text-center">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold text-purple-darkest mb-4 font-alef">
                  {prePrayContent.payment.successMessage.title}
                </h2>
                <p className="text-lg md:text-xl text-purple-dark leading-relaxed whitespace-pre-line font-heebo">
                  {prePrayContent.payment.successMessage.content}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-purple-dark/70 mb-4 font-heebo">
                  {prePrayContent.payment.reassurance}
                </p>
                
                <div className="flex justify-center">
                  <iframe
                    src={prePrayContent.payment.iframeUrl}
                    width="100%"
                    height="650"
                    className="border-0 max-w-[600px] rounded-lg shadow-lg"
                    loading="lazy"
                    title="טופס תשלום מאובטח"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-purple-50/30 to-gold-50/20">
          <div className="container max-w-4xl px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-darkest text-center mb-12 font-alef">
              {prePrayContent.faq.title}
            </h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              {prePrayContent.faq.items.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-background border-2 border-purple-200 rounded-lg px-6 hover:border-gold transition-all"
                >
                  <AccordionTrigger className="text-right text-lg md:text-xl font-bold text-purple-darkest py-6 font-alef hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-right text-lg text-purple-dark leading-relaxed pb-6 font-heebo">
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
            <p className="text-lg md:text-xl leading-relaxed mb-8 whitespace-pre-line font-heebo">
              {prePrayContent.finalCta.content}
            </p>
            
            <Button 
              onClick={scrollToPayment}
              size="lg"
              className="text-lg px-8 py-6 font-alef bg-gold text-purple-darkest hover:bg-gold/90 shadow-xl"
            >
              {prePrayContent.finalCta.ctaButton}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default PrePrayLanding;
