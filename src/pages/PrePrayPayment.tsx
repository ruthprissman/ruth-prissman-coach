import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Lock, Phone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { prePrayPaymentContent } from '@/content/landing/prePrayPayment';
import { useEffect } from 'react';

export default function PrePrayPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ניסיון לקבל נתונים מ-state או מ-localStorage
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

  useEffect(() => {
    // אם אין נתוני ליד גם ב-localStorage, נחזיר לדף הראשי
    if (!leadData) {
      navigate('/pre-pray', { replace: true });
    }
  }, [leadData, navigate]);

  if (!leadData) {
    return null;
  }

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
            onClick={() => navigate('/pre-pray')}
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
              שלום {leadData.name}! 👋
            </p>
            <p className="text-lg text-white/90 drop-shadow-md">
              {prePrayPaymentContent.hero.subtitle}
            </p>
          </div>
          
          {/* כפתור בדיקה - מוסתר. להחזרה: הסירי את הקומנטריה
          <div className="flex justify-center mb-4">
            <Button
              onClick={() => {
                localStorage.setItem('prePrayLeadData', JSON.stringify(leadData));
                navigate('/pre-pray');
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              <CheckCircle className="ml-2 h-5 w-5" />
              מעבר לדף תודה (בדיקה)
            </Button>
          </div>
          */}

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
                src="https://app.upay.co.il/API6/s.php?m=U0tTcEpxZ2NhdjJXNWZ5dW5aUmk4dz09"
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
          <div className="mt-8 p-6 bg-purple-light/10 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Phone className="h-5 w-5 text-[#5FA6A6]" />
              <h3 className="text-xl font-bold text-purple-dark font-alef">
                {prePrayPaymentContent.support.title}
              </h3>
            </div>
            <p className="text-purple-dark mb-3">
              {prePrayPaymentContent.support.description}
            </p>
            <a
              href={`https://wa.me/972556620273?text=${encodeURIComponent('שלום רות, אני צריכה עזרה עם התשלום לקורס "דקה לפני התפילה"')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lg font-semibold text-[#5FA6A6] hover:text-[#4a8585] transition-colors"
            >
              <Phone className="h-5 w-5" />
              {prePrayPaymentContent.support.phone}
            </a>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
