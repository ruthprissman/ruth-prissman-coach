
import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>רות פריסמן - אודות | מאמנת רגשית בגישת קוד הנפש</title>
        <meta name="description" content="הכירו את רות פריסמן, מאמנת רגשית לנשים בגישת קוד הנפש. סיפור אישי, ניסיון מקצועי ותשוקה לליווי תהליכי עומק נשיים." />
        <meta name="keywords" content="רות פריסמן, על רות, קואצ'רית רגשית, מאמנת אישית לנשים, קוד הנפש, ליווי רגשי, אודות רות פריסמן" />
      </Helmet>
      <Navigation />
      <main className="flex-grow relative z-10">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <h1 className="text-center text-3xl md:text-4xl lg:text-5xl font-alef text-[#4A235A] mb-12 gold-text-shadow">
            אודות רות פריסמן - מאמנת קוד הנפש
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="order-2 md:order-1 space-y-6 text-right">
              <p className="text-lg text-right">
                נעים להכיר, אני רות פריסמן
              </p>
              <p className="text-lg text-right">
                גם החיים שלי, כמו החיים שלך, הם סיפור מתמשך. 
                יש בו פרקים של רגשות סוערים וגם של אדישות, 
                של רצונות מוגדרים או לא ממש, 
                של עיבוד פנימי ושל עייפות, 
                של בחירות והחלטות, עם יותר ופחות מודעות.
              </p>
              <p className="text-lg text-right">
                במשך שנים, האמנתי שתחושות 
                הדחיה והריחוק, 
                חוסר האמון עד בגידה, 
                האשמה והלקאה עצמית, 
                חוסר אונים ואובדן שליטה, 
                הן גזירה שהיא חלק מהחיים.
              </p>
              <p className="text-lg text-right">
                ובעצם כל הזמן הייתי במסלול התנגשות עם החוויות הפנימיות האלה,
                מנסה לברוח מהן, דרך ריצוי אחרים או התבצרות בשלי,
                דרך מסירות בלי גבולות או דכדוך,
                דרך אחריות ונתינה מקסימלית או התמקדות בעצמי בלבד,
                דרך עשיה בלי סוף או אדישות מוחלטת.
              </p>
              <p className="text-lg text-right">
                כשגיליתי את שיטת קוד הנפש, 
                שפיתחה שמחה אביטן, 
                היא אפשרה לי לשנות את הכל.
              </p>
              <p className="text-lg text-right">
                התחלתי להתבונן על העולם מבפנים החוצה, 
                להפריד בין הדחף האוטומטי לרצון אמיתי ומבורר,
                להכיר את היכולות שלי, לאהוב אותם, 
                להכיר את היכולות של הסביבה שלי ולאהוב אותם,
                לבחון את המידות שלי, לזהות הקצנות וגם איזון
                ולבחור. כל הזמן לבחור.
              </p>
              <p className="text-lg text-right">
                מאז, 
                אני לא מפסיקה ללמוד ולהתפתח
                ותוך כדי עוזרת לאנשים,
                לזהות בתוך עצמם את הרצון, את היכולות,
                את האמונה בעצמם, בסביבה, בבורא,
                את הקצוות והאמצע.
              </p>
              <p className="text-lg text-right">
                אם את מרגישה שאת מוכנה להתחיל במסע הזה, 
                את מוזמנת לקבוע פגישה אישית
                לקבל מבט חדש על החיים המוכרים שלך, 
                להרוויח שלווה אמיתית, סיפוק ושמחה.
              </p>
            </div>

            <div className="order-1 md:order-2 flex justify-center md:justify-start">
              <img 
                src="https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs//default.jpg" 
                alt="רות פריסמן" 
                className="rounded-2xl shadow-lg max-w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg mb-4 text-[#4A235A] font-medium">רוצה לשמוע עוד?</p>
            <Button asChild className="bg-[#F5E6C5] hover:bg-gold-light text-[#4A235A] font-medium px-6 border border-gold-DEFAULT shadow-sm">
              <Link to="/contact">צור קשר</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
