import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Lock, Phone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { prePrayPaymentContent } from '@/content/landing/prePrayPayment';
import { useEffect } from 'react';

export default function PrePrayPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // קריאת שם מ-URL query parameter (למגיעות מהמייל)
  const searchParams = new URLSearchParams(location.search);
  const nameFromUrl = searchParams.get('name');
  
  // ניסיון לקבל נתונים מ-state או מ-localStorage (למגיעות מדף הנחיתה)
  let leadData = location.state?.leadData;
  
  if (!leadData) {
    const storedData = localStorage.getItem('prePrayLeadData');
    if (storedData) {
      try {
        leadData = JSON.parse(storedData);
      } catch (e) {
        console.error('Error parsing stored lead data:', e);
      }
    }
  }

  // עדיפות: שם מה-URL (מייל) > שם מ-localStorage (דף נחיתה) > null
  const name = nameFromUrl || leadData?.name || null;

  return (
    <>
      <Helmet>
        <title>השלמת תשלום - דקה לפני התפילה | רות פריסמן</title>
        <meta name="description" content="השלמת רכישת הקורס דקה לפני התפילה" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div 
        className="min-h-screen font-heebo relative" 
        dir="rtl"
        style={{
          backgroundImage: 'url(/assets/payment-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        
        {/* Content wrapper */}
        <div className="relative z-10">
        {/* Header */}
        <div className="container max-w-4xl px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/pre-pray?cancelled=true')}
            className="mb-6 flex items-center gap-2 text-purple-dark hover:text-[#5FA6A6]"
          >
            <ArrowRight className="h-5 w-5" />
            {prePrayPaymentContent.payment.backButton}
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-4 font-alef">
              {prePrayPaymentContent.hero.title}
            </h1>
            <p className="text-xl text-white drop-shadow-md mb-2">
              {name ? `שלום ${name}! 👋` : 'ברוכה הבאה! 👋'}
            </p>
            <p className="text-lg text-white/90 drop-shadow-md">
              {prePrayPaymentContent.hero.subtitle}
            </p>
          </div>
          
          {/* Secure Payment Badge */}
          <div className="flex items-center justify-center gap-2 text-green-400 drop-shadow-md mb-6 bg-white/20 backdrop-blur-sm py-2 px-4 rounded-full">
            <Lock className="h-5 w-5" />
            <span className="font-semibold">{prePrayPaymentContent.payment.securePayment}</span>
          </div>
        </div>

        {/* Payment Form Section */}
        <div className="container max-w-5xl px-4 pb-16">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-purple-light/20">
            <h2 className="text-2xl font-bold text-[#5FA6A6] mb-6 text-center font-alef">
              {prePrayPaymentContent.payment.title}
            </h2>
            
            <div className="w-full overflow-hidden rounded-lg">
              <iframe
                src="https://app.upay.co.il/API6/s.php?m=Q0FxUWdjWjY3UG5IZVBQaElhcmh6QT09"
                className="w-full rounded-lg border-0"
                style={{
                  minHeight: '100vh',
                  height: '1200px',
                  display: 'block'
                }}
                frameBorder="0"
                scrolling="no"
                title="טופס תשלום"
              />
            </div>
          </div>

          {/* Support Section */}
          <div className="mt-8 p-6 bg-white/10 backdrop-blur-md rounded-xl text-center border-2 border-white/30">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Phone className="h-6 w-6 text-[#7DD3D3]" />
              <h3 className="text-2xl font-bold text-white drop-shadow-lg font-alef">
                {prePrayPaymentContent.support.title}
              </h3>
            </div>
            <p className="text-white/95 text-lg mb-4 font-medium drop-shadow-md">
              {prePrayPaymentContent.support.description}
            </p>
            <a
              href={`https://wa.me/972556620273?text=${encodeURIComponent('שלום רות, אני צריכה עזרה עם התשלום לקורס "דקה לפני התפילה"')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xl font-bold text-[#7DD3D3] hover:text-white transition-colors drop-shadow-lg"
            >
              <Phone className="h-6 w-6" />
              {prePrayPaymentContent.support.phone}
            </a>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
