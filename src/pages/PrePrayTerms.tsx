import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrePrayTerms() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>תנאי שימוש ומדיניות פרטיות - דקה לפני התפילה | רות פריסמן</title>
        <meta name="description" content="תנאי שימוש ומדיניות פרטיות לתוכנית דקה לפני התפילה - ברכות השחר" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-12">
          <div className="container max-w-4xl px-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/pre-pray')}
              className="mb-6 flex items-center gap-2 text-white hover:text-white/80 hover:bg-white/10"
            >
              <ArrowRight className="h-5 w-5" />
              חזרה לדף הרישום
            </Button>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-alef">
              תנאי שימוש ומדיניות פרטיות
            </h1>
            <p className="text-xl text-white/90 font-heebo">
              דקה לפני התפילה – ברכות השחר
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-4xl px-4 py-12">
          <div className="prose prose-lg max-w-none font-heebo">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-[#5FA6A6] mb-4 font-alef">
                    כאן יבוא התוכן שלך
                  </h2>
                  <p className="text-purple-dark leading-relaxed">
                    דף זה מוכן לקבל את תנאי השימוש ומדיניות הפרטיות של התוכנית.
                    כשתהיה מוכנה, תני לי את התוכן ואני אכניס אותו לכאן.
                  </p>
                </section>

                <section className="pt-6 border-t border-purple-light">
                  <p className="text-sm text-purple-dark/70">
                    עדכון אחרון: {new Date().toLocaleDateString('he-IL')}
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
