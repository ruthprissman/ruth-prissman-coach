import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Lock, Phone } from 'lucide-react';
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

      <div className="min-h-screen bg-gradient-to-b from-purple-light to-white font-heebo" dir="rtl">
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
            <h1 className="text-3xl md:text-4xl font-bold text-[#5FA6A6] mb-4 font-alef">
              {prePrayPaymentContent.hero.title}
            </h1>
            <p className="text-xl text-purple-dark mb-2">
              שלום {leadData.name}! 👋
            </p>
            <p className="text-lg text-purple-dark/80">
              {prePrayPaymentContent.hero.subtitle}
            </p>
          </div>

          {/* Secure Payment Badge */}
          <div className="flex items-center justify-center gap-2 text-green-600 mb-6">
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
            
            <div className="w-full" style={{ minHeight: '800px' }}>
              <iframe
                src="https://app.upay.co.il/API6/s.php?m=UmFZY1oxTU5OM2tSN3g1Wjl1ekc4UT09"
                width="100%"
                height="800"
                frameBorder="0"
                scrolling="auto"
                className="w-full rounded-lg"
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
    </>
  );
}
