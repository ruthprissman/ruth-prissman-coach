import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrePrayTerms() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>תנאי תוכנית - דקה לפני התפילה: ברכות השחר | רות פריסמן</title>
        <meta name="description" content="תנאי ההצטרפות והשימוש בתוכנית דקה לפני התפילה - ברכות השחר. כולל מדיניות ביטול והחזרים, זכויות יוצרים ופרטי יצירת קשר." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
        <div 
          className="relative text-white py-12 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/assets/pre-pray-terms-hero.png')" }}
        >
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="container max-w-4xl px-4 relative z-10">
            <Button
              variant="ghost"
              onClick={() => navigate('/pre-pray')}
              className="mb-6 flex items-center gap-2 text-white hover:text-white/80 hover:bg-white/10"
            >
              <ArrowRight className="h-5 w-5" />
              חזרה לדף הרישום
            </Button>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-alef">
              תנאי תוכנית
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
              <div className="space-y-8 text-right">
                
                {/* ברוכה הבאה */}
                <section>
                  <h2 className="text-3xl font-bold text-[#5FA6A6] mb-4 font-alef">
                    ברוכה הבאה!
                  </h2>
                  <p className="text-purple-dark leading-relaxed text-lg">
                    תודה שנרשמת לתוכנית "דקה לפני התפילה – ברכות השחר". להלן תנאי ההצטרפות והשימוש:
                  </p>
                </section>

                {/* מה כוללת התוכנית */}
                <section>
                  <h2 className="text-2xl font-bold text-[#5FA6A6] mb-4 font-alef">
                    מה כוללת התוכנית:
                  </h2>
                  <ul className="space-y-3 text-purple-dark leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="text-[#5FA6A6] mt-1">•</span>
                      <span>תוכנית תוכן דיגיטלי בת 20 יום.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5FA6A6] mt-1">•</span>
                      <span>שליחת מייל יומי אחד בכל יום עם תוכן לימודי והשראה.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5FA6A6] mt-1">•</span>
                      <span>גישה לקו טלפוני הכולל הקלטות להאזנה עצמאית (24/7).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5FA6A6] mt-1">•</span>
                      <span className="font-bold">עלות התוכנית: 47 ש"ח (כולל מע"מ, אם רלוונטי).</span>
                    </li>
                  </ul>
                </section>

                {/* אספקת השירות */}
                <section>
                  <h2 className="text-2xl font-bold text-[#5FA6A6] mb-4 font-alef">
                    אספקת השירות:
                  </h2>
                  <ul className="space-y-3 text-purple-dark leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="text-[#5FA6A6] mt-1">•</span>
                      <span>הגישה לתכנים נשלחת מיד לאחר השלמת התשלום, לכתובת האימייל שסיפקת.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5FA6A6] mt-1">•</span>
                      <span>האחריות לוודא שהאימייל תקין ופעיל חלה על המשתמש בלבד.</span>
                    </li>
                  </ul>
                </section>

                {/* תנאי ביטול והחזר כספי */}
                <section className="bg-purple-50 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-[#5FA6A6] mb-4 font-alef">
                    תנאי ביטול והחזר כספי:
                  </h2>
                  <div className="space-y-3 text-purple-dark leading-relaxed">
                    <p>
                      לפי סעיף 14ג(ד)(1) לחוק הגנת הצרכן, לא ניתן לבטל עסקה של תוכן דיגיטלי שסופק באופן מידי.
                    </p>
                    <p className="font-bold text-purple-darkest">
                      לפיכך, אין החזר כספי לאחר התשלום.
                    </p>
                  </div>
                </section>

                {/* דיוור ותוכן שיווקי */}
                <section>
                  <h2 className="text-2xl font-bold text-[#5FA6A6] mb-4 font-alef">
                    דיוור ותוכן שיווקי:
                  </h2>
                  <div className="space-y-3 text-purple-dark leading-relaxed">
                    <p>במהלך ההרשמה תתבקש/י לאשר קבלת דיוור שבועי. הדיוור יכלול:</p>
                    <ul className="space-y-2 mr-6">
                      <li className="flex items-start gap-3">
                        <span className="text-[#5FA6A6] mt-1">•</span>
                        <span>תוכן לימודי נוסף</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#5FA6A6] mt-1">•</span>
                        <span>עדכונים על הרצאות, סדנאות, או מוצרים דיגיטליים נוספים</span>
                      </li>
                    </ul>
                    <p className="pt-2">
                      באפשרותך להסיר את עצמך מהדיוור בכל עת באמצעות הקישור בתחתית כל מייל.
                    </p>
                  </div>
                </section>

                {/* זכויות יוצרים */}
                <section>
                  <h2 className="text-2xl font-bold text-[#5FA6A6] mb-4 font-alef">
                    זכויות יוצרים:
                  </h2>
                  <ul className="space-y-3 text-purple-dark leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="text-[#5FA6A6] mt-1">•</span>
                      <span>כל התכנים הכלולים בתוכנית מוגנים בזכויות יוצרים.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5FA6A6] mt-1">•</span>
                      <span>חל איסור לשכפל, להעביר, להפיץ או לפרסם את החומרים ללא אישור מראש ובכתב מבעלת הזכויות.</span>
                    </li>
                  </ul>
                </section>

                {/* פרטי הספק */}
                <section className="bg-purple-50 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-[#5FA6A6] mb-4 font-alef">
                    פרטי הספק:
                  </h2>
                  <div className="space-y-2 text-purple-dark leading-relaxed">
                    <p><span className="font-bold">שם העוסק:</span> רות פריסמן</p>
                    <p><span className="font-bold">עוסק פטור מס׳:</span> 200429025</p>
                    <p>
                      <span className="font-bold">כתובת אימייל ליצירת קשר:</span>{' '}
                      <a href="mailto:ruth@ruthprissman.co.il" className="text-[#5FA6A6] hover:underline">
                        ruth@ruthprissman.co.il
                      </a>
                    </p>
                    <p><span className="font-bold">אזור פעילות:</span> ישראל</p>
                  </div>
                </section>

                {/* יצירת קשר */}
                <section>
                  <h2 className="text-2xl font-bold text-[#5FA6A6] mb-4 font-alef">
                    יצירת קשר:
                  </h2>
                  <p className="text-purple-dark leading-relaxed">
                    אם יש לך שאלה, פנייה או בעיה – אפשר לפנות אליי ב
                    <a href="mailto:ruth@ruthprissman.co.il" className="text-[#5FA6A6] hover:underline font-bold mx-1">
                      כתובת האימייל
                    </a>
                    או דרך
                    <a href="/contact" className="text-[#5FA6A6] hover:underline font-bold mx-1">
                      טופס יצירת הקשר באתר
                    </a>
                    .
                  </p>
                </section>

                {/* תאריך עדכון */}
                <section className="pt-6 border-t-2 border-purple-light">
                  <p className="text-sm text-purple-dark/70">
                    <span className="font-bold">תאריך עדכון תנאים:</span> 20.11.2025
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
