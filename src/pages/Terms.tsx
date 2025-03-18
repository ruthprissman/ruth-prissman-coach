
import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed relative" 
        style={{ backgroundImage: 'url(https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/sign/site_imgs/clear-background.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzaXRlX2ltZ3MvY2xlYXItYmFja2dyb3VuZC5wbmciLCJpYXQiOjE3NDExMDE0OTMsImV4cCI6MjM3MTgyMTQ5M30.k9JPVqmzmFtfxa8jbYpr1Hi3T4l2ZaHQZdPy2gGpgvk)' }}
      >
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
        
        <Navigation />
        
        <main className="container mx-auto pt-24 pb-16 px-4 md:px-8 relative z-10">
          <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-alef text-[#4A235A] text-center mb-8">
              תנאי שימוש באתר רות פריסמן – מאמנת קוד הנפש
            </h1>

            <div className="prose prose-lg max-w-none rtl space-y-6 text-[#4A235A]">
              <p className="font-medium text-lg">
                ברוכים הבאים לאתר של רות פריסמן - מאמנת קוד הנפש ("האתר"). השימוש באתר כפוף לתנאי השימוש המפורטים להלן. אנא קראי בעיון את התנאים הבאים לפני שימוש באתר. השימוש באתר מהווה הסכמה מצדך לתנאי השימוש.
              </p>

              <section className="space-y-2">
                <h2 className="text-xl font-bold font-alef">תיאור האתר והשירותים</h2>
                <p>האתר מציע תוכן מקצועי, סיפורים, מידע על שיטת קוד הנפש ושירותי אימון אישי וליווי רגשי על פי גישת קוד הנפש, שפותחה על ידי שמחה אביטן. ניתן להשתמש באתר על מנת לקבוע פגישות אישיות ולקבל מידע בנושאים הקשורים לקוד הנפש.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-xl font-bold font-alef">התחייבות המשתמש</h2>
                <p>בשימוש באתר, המשתמש מתחייב לנהוג בתום לב, בהתאם לחוק, ולא לפגוע בתפקוד האתר, במשתמשים אחרים או בזכויות של בעלת האתר.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-xl font-bold font-alef">זכויות יוצרים וקניין רוחני</h2>
                <p>כל התכנים באתר, כולל טקסטים, סיפורים, תמונות, קבצים וכל חומר אחר המוצג באתר, מוגנים בזכויות יוצרים ובקניין רוחני השייכים לרות פריסמן, אלא אם צוין אחרת. חל איסור מוחלט להעתיק, לשכפל, לפרסם או להפיץ תכנים אלה ללא קבלת אישור מפורש מראש ובכתב מבעלת האתר.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-xl font-bold font-alef">הגבלת אחריות</h2>
                <p>התכנים באתר ניתנים כמידע כללי בלבד ואינם מהווים תחליף לייעוץ מקצועי, רפואי או טיפולי פרטני. רות פריסמן לא תהיה אחראית לכל נזק, ישיר או עקיף, שייגרם למשתמש כתוצאה מהשימוש באתר, במידע או בשירותים המוצעים בו.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-xl font-bold font-alef">מדיניות פרטיות</h2>
                <p>השימוש באתר כפוף למדיניות הפרטיות של האתר, המפורטת בדף נפרד וזמינה לעיון המשתמשים.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-xl font-bold font-alef">תנאי סיום השימוש</h2>
                <p>בעלת האתר שומרת לעצמה את הזכות להגביל או להפסיק את גישת המשתמש לאתר, באופן זמני או קבוע, לפי שיקול דעתה וללא הודעה מראש, במקרה של הפרת תנאי שימוש אלה או מסיבות אחרות.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-xl font-bold font-alef">הדין החל וסמכות שיפוט</h2>
                <p>על השימוש באתר זה יחול הדין הישראלי בלבד. סמכות השיפוט בכל מחלוקת הקשורה באתר תהיה מסורה לבתי המשפט המוסמכים באזור ירושלים.</p>
              </section>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-center">
                  בכל שאלה או הבהרה לגבי תנאי השימוש באתר, ניתן לפנות ישירות אלינו דרך עמוד "צור קשר".
                </p>
                <p className="text-center text-sm mt-4 text-gray-600">
                  תאריך עדכון אחרון: 18/03/2025
                </p>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
