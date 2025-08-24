import React from 'react';
import { Button } from '@/components/ui/button';
import { Quote, CheckCircle, Star } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const HebrewLandingPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const scrollToForm = () => {
    const formElement = document.getElementById('registration-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email) {
      toast({
        title: "שגיאה",
        description: "אנא מלאי את השדות החובה",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          workshop_id: 'ac258723-b2b7-45da-9956-2ca140457a44'
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "נרשמת בהצלחה!",
        description: "כל הפרטים בדרך למייל שלך 💌"
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "שגיאה בהרשמה",
        description: "נסי שוב או שלחי מייל ל Ruth@RuthPrissman.co.il",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Section 1: Top Bar */}
      <div 
        className="w-full flex items-center justify-center py-3 px-4"
        style={{ backgroundColor: '#4B2E83', minHeight: '50px' }}
      >
        <p className="text-white text-center font-alef font-bold text-sm md:text-base leading-tight">
          מרגישה שהתפילה שלך הפכה לעוד מטלה שצריך לסמן עליה וי?
        </p>
      </div>

      {/* Section 2: Hero with Background */}
      <div 
        className="relative w-full min-h-screen flex items-center justify-center px-4 py-12 sm:py-16 md:py-24"
        style={{
          backgroundColor: '#374151',
          backgroundImage: `url('/lovable-uploads/04710e22-f223-434b-a8fe-d553816388a5.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay with fallback background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: '#374151',
            backgroundImage: 'linear-gradient(135deg, rgba(16, 37, 58, 0.65), rgba(30, 20, 60, 0.7))'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Main Title */}
          <h1 className="text-black sm:text-white font-heebo text-xl sm:text-2xl md:text-4xl lg:text-5xl leading-relaxed font-light px-2">
            <span className="block mb-2 text-black sm:text-white">הסוד להפוך תפילה מעוד חובה</span>
            <span className="block mb-2 text-lg sm:text-xl md:text-3xl lg:text-4xl text-black sm:text-white">(שלא תמיד אנחנו מצליחים למלא),</span>
            <span className="block mb-2 text-black sm:text-white">למילים, לשיחה אמיתית שממלאת אותך בכוח.</span>
            <span className="block text-lg sm:text-xl md:text-3xl lg:text-4xl text-black sm:text-white">גם כשהקטנים מושכים לך בחצאית והראש עמוס במטלות?</span>
          </h1>

          {/* Subtitle */}
          <div className="text-black sm:text-white font-heebo text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-light space-y-3 sm:space-y-4 max-w-4xl mx-auto px-2">
            <p>מה אם היית יכולה לפתוח את הסידור בקלות, להרגיש את הלב נפתח?</p>
            <p>לסיים כל תפילה בתחושת רוממות וחיבור, במקום בתחושת אשמה ותסכול.</p>
            <p>לגלות איך להכניס את כל החיים שלך, את כל הבלגן והעייפות, אל תוך המילים המוכרות, ולמצוא בהן אור חדש?</p>
          </div>

             {/* Section 16: Registration Form */}
      <div id="registration-form" className="w-full py-12 sm:py-16 px-4" style={{ backgroundColor: 'var(--blue-very-light)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
            <h2 className="text-center font-alef font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-6 sm:mb-8 leading-relaxed purple-text px-2">
              הרשמי כאן וקבלי גישה מיידית לסדנה החינמית
            </h2>
            
            {isSubmitted ? (
              <div className="text-right space-y-4">
                <div className="text-green-600 text-xl font-bold">
                  נרשמת בהצלחה! כל הפרטים בדרך למייל שלך 💌
                </div>
                <p className="text-gray-600 font-heebo">
                  נתראה בסדנה!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-2 text-right">
                  <Label htmlFor="fullName" className="text-right font-heebo text-base sm:text-lg" style={{ color: 'var(--purple-deep)' }}>
                    שם פרטי *
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="text-right font-heebo text-base sm:text-lg py-3"
                    placeholder="השם הפרטי שלך"
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="email" className="text-right font-heebo text-base sm:text-lg" style={{ color: 'var(--purple-deep)' }}>
                    אימייל *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="text-right font-heebo text-base sm:text-lg py-3"
                    placeholder="האימייל שלך"
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="phone" className="text-right font-heebo text-base sm:text-lg" style={{ color: 'var(--purple-deep)' }}>
                    טלפון (לא חובה)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="text-right font-heebo text-base sm:text-lg py-3"
                    placeholder="מספר הטלפון שלך"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white font-bold text-base sm:text-lg md:text-xl py-4 sm:py-6 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg min-h-[48px] touch-manipulation"
                  style={{ backgroundColor: 'var(--pink-vibrant)' }}
                >
                  {isSubmitting ? 'נרשמת...' : 'אני נרשמת עכשיו לסדנה'}
                </Button>

                <p className="text-right text-gray-500 text-xs sm:text-sm font-heebo">
                  לא נשלח לך ספאם. הפרטים שלך שמורים איתנו.
                </p>
              </form>
            )}

            {/* Support Note */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 font-heebo text-lg font-bold">
                ❗ חסומה? שלחי לי מייל ואצרף אותך ידנית – Ruth@RuthPrissman.co.il
              </p>
            </div>
          </div>
        </div>
      </div>
          {/* CTA Button */}
          
        </div>
      </div>
 {/* Section 12: What you'll get upon registration */}
      <div className="w-full py-16 px-4" style={{ backgroundColor: 'var(--purple-deep)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            {/* Title */}
            <h2 className="text-center font-alef font-bold text-2xl md:text-3xl lg:text-4xl mb-8 leading-relaxed purple-text">
              הנה כל מה שתקבלי מיד עם ההרשמה לסדנה
            </h2>

            {/* List Items */}
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <Star className="flex-shrink-0 mt-1" size={24} style={{ color: 'var(--pink-vibrant)' }} />
                <div>
                  <p className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800">
                    השתתפות מלאה בסדנה חיה "חיבורים חדשים למילים מוכרות"
                  </p>
                  <p className="text-gray-600">(שווי: 120 ₪)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Star className="flex-shrink-0 mt-1" size={24} style={{ color: 'var(--pink-vibrant)' }} />
                <div>
                  <p className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800">
                    דפי עבודה וסיכום הסדנה להדפסה
                  </p>
                  <p className="text-gray-600">(שווי: 49 ₪)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Star className="flex-shrink-0 mt-1" size={24} style={{ color: 'var(--pink-vibrant)' }} />
                <div>
                  <p className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800">
                    גישה להקלטת הסדנה למשך 7 ימים
                  </p>
                  <p className="text-gray-600">(שווי: 65 ₪)</p>
                </div>
              </div>
            </div>

            {/* Total Value */}
            <div className="border-t border-gray-200 pt-6 text-center">
              <p className="font-heebo text-xl md:text-2xl text-gray-800 mb-2">שווי כולל: 234 ₪</p>
              <p className="font-alef font-bold text-2xl md:text-3xl mb-6" style={{ color: 'var(--pink-vibrant)' }}>
                המחיר שלך היום: 0 ₪ (לגמרי בחינם)
              </p>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Button
                onClick={scrollToForm}
                className="text-white font-bold text-lg md:text-xl px-8 py-6 md:px-12 md:py-8 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg w-full md:max-w-2xl mx-auto h-auto"
                style={{ backgroundColor: 'var(--pink-vibrant)' }}
              >
                שרייני את מקומך בחינם!
              </Button>
            </div>
          </div>
        </div>
      </div>

   
      {/* Section 3: Empathy Bullets */}
      <div className="w-full bg-gray-50 py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h2 className="text-center font-alef font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-8 sm:mb-12 leading-relaxed purple-text px-2">
            גם לך קורים הדברים האלה סביב התפילה, שמשאירים אותך מרוקנת במקום מלאה?
          </h2>

          {/* Bullet Points */}
          <div className="space-y-4 sm:space-y-6">
            {[
              "את אומרת את המילים, אבל הראש שלך כבר עסוק ברשימת הקניות, בכביסות ובמה לבשל לצהריים.",
              "התפילה הפכה לעוד מטלה ברשימה האינסופית של היום, משהו שצריך רק לסיים ולסמן וי כדי להמשיך הלאה.",
              "את פותחת את הסידור ומרגישה ריקנות, לא מצליחה להתחבר למי שמקשיבי בצד השני.",
              "את מרגישה אשמה שאת לא מתרגשת, שהתפילה שלך הפכה למכנית, כמו רובוט שמדקלם טקסט.",
              "את מתגעגעת לתפילות של פעם, לימים שהתרגשת של מילה בלב, ותוהה לאן נעלמה כל ההתלהבות הזאת.",
              "את מרגישה כמעט זרה – כלפי חוץ את נראית כמו אישה מתפללת, אבל בפנים, הראש שלך נמצא במקום אחר לגמרי.",
              "אולי בכלל את לא מצליחה להתפלל....?"
            ].map((text, index) => (
              <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-white shadow-sm">
                <span className="text-xl sm:text-2xl text-red-500 flex-shrink-0 mt-1">❌</span>
                <p className="font-heebo text-base sm:text-lg md:text-xl leading-relaxed text-gray-800">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Hope and Promise */}
      <div className="w-full py-16 px-4" style={{ backgroundColor: 'var(--blue-soft)' }}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Title */}
          <h2 className="font-alef font-bold text-2xl md:text-3xl lg:text-4xl leading-relaxed" style={{ color: 'var(--purple-deep)' }}>
            הגיע הזמן לגלות איך להחיות את התפילה שלך, ולהפוך אותה למקור הכוח הגדול ביותר ביום שלך.
          </h2>

          {/* Paragraph */}
          <div className="font-heebo text-lg md:text-xl leading-relaxed max-w-3xl mx-auto space-y-4" style={{ color: 'var(--purple-deep)' }}>
            <p>מתוך עבודה עם נשים כמוך, ומתוך המסע האישי שלי כאישה, כאמא וכמאמנת – גיליתי שיש דרך אחרת.</p>
            <p>דרך שלא דורשת ממך להיות מושלמת או מנותקת מהמציאות.</p>
            <p>למדתי, ואני עדיין לומדת, איך להפוך את התפילה לחיה, נושמת ואמיתית.</p>
            <p>עזרתי כבר להרבה נשים לגלות מחדש את העוצמה והחיבור שבתפילה,</p>
            <p>ואני רוצה להראות גם לך איך לעשות את זה.</p>
          </div>

          {/* 3 Benefit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {[
              "להיות אמא מסורה ואישה עסוקה – וגם להרגיש קרובה למקור עליון.",
              "לנהל בית ועבודה תובעניים – וגם למצוא רגעים של שקט וחיבור רוחני.",
              "לעמוד בכל המטלות של היום – ולהתחיל אותו עם כוח ותחושת משמעות."
            ].map((text, index) => (
              <div key={index} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-xl sm:text-2xl flex-shrink-0 mt-1">🌀</span>
                  <p className="font-heebo text-base sm:text-lg leading-relaxed text-gray-800">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="px-4">
            <Button
              onClick={scrollToForm}
              className="w-full sm:w-auto text-white font-bold text-base sm:text-lg md:text-xl px-6 sm:px-8 py-4 sm:py-6 md:px-12 md:py-8 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg max-w-full sm:max-w-2xl mx-auto h-auto text-center leading-snug"
              style={{ backgroundColor: 'var(--pink-vibrant)' }}
            >
              <div className="sm:hidden">
                <div>כן, אני רוצה לגלות איך להרגיש קרובה שוב</div>
                <div>ולהירשם לסדנה החינמית</div>
              </div>
              <span className="hidden sm:inline">
                כן, אני רוצה לגלות איך להרגיש קרובה שוב ולהירשם לסדנה החינמית
              </span>
            </Button>
          </div>
        </div>
      </div>

      

      {/* Section 7: Visual Imagination */}
      <div className="w-full bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <h2 className="text-center font-alef font-bold text-2xl md:text-3xl lg:text-4xl mb-12 leading-relaxed purple-text">
            דמייני את הבוקר שלך בעוד כמה שבועות מהיום...
          </h2>

          {/* Story Paragraphs */}
          <div className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800">
            <p>
              את מתעוררת, ולפני שהמרוץ של היום מתחיל, את לוקחת לעצמך שتי דקות.<br/>
              רק את והסידור (ויש לך סידור!). את לא מנסה בכוח "לנקות את הראש",<br/>
              אלא פשוט מביאה את כל מה שעל ליבך אל תוך המילים.<br/>
              הדאגה מהפגישה בעבודה, השמחה על הציור שהילד הביא מהגן, הבקשה על הבריאות של אמא.<br/>
              פתאום, המילים המוכרות של "מודה אני" ו"ברכות השחר" מקבלות משמעות חדשה, אישית.<br/>
              הן הופכות להיות המילים שלך. את מסיימת את התפילה הקצרה הזו ומרגישה... אחרת.<br/>
              רגועה יותר. מחוברת. עם כוח אמיתי להתחיל את היום.
            </p>
            
            <p className="mt-4">
              במהלך היום, כשאת מרגישה את הלחץ עולה, את נזכרת בתחושה הזאת מהבוקר.<br/>
              את עוצרת לרגע, נושמת עמוק, וממלמלת פסוק אחד שפתאום מדבר אלייך.<br/>
              זה לא לוקח יותר מכמה שניות, אבל זה עוגן.<br/>
              זה רגע של חיבור שמטעין אותך מחדש. הילדים רואים אמא רגועה יותר, סבלנית יותר.<br/>
              את מרגישה שאת לא לבד בתוך כל הטירוף הזה.<br/>
              יש לך קו פתוח, שיחה מתמשכת עם מי שמנהל את כל העולם, וגם את העולם הקטן והעמוס שלך.
            </p>
            
            <p className="mt-4">
              בערב, כשאת סוף סוף מגיעה למיטה, במקום לצנוח מותשת ולמלמל את קריאת שמע מתוך הרגל, את עוצרת.<br/>
              את מודה על הטוב שהיה היום, ומבקשת כוח למחר.<br/>
              התפילה הפסיקה להיות מטלה. היא הפכה להיות החברה הכי טובה שלך,<br/>
              מקור הכוח שלך, המצפן שמכוון אותך בתוך ים המשימות והדרישות.<br/>
              את נרדמת עם חיוך, בידיעה שאת כבר לא רק "אומרת" תפילה, את חיה אותה.
            </p>
          </div>

          {/* Final CTA Button */}
          <div className="text-center pt-8">
            <Button
              onClick={scrollToForm}
              className="text-white font-bold text-base sm:text-lg md:text-xl px-6 sm:px-8 py-4 sm:py-6 md:px-12 md:py-8 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg max-w-full sm:max-w-2xl mx-auto h-auto text-center leading-snug w-full sm:w-auto"
              style={{ backgroundColor: 'var(--pink-vibrant)' }}
            >
              <div className="sm:hidden">
                <div>אני רוצה לחיות את התפילה שלי</div>
                <div>ולהירשם עכשיו בחינם</div>
              </div>
              <span className="hidden sm:inline">
                אני רוצה לחיות את התפילה שלי ולהירשם עכשיו בחינם
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Section 8: Testimonials from women */}
      <div className="w-full py-16 px-4" style={{ backgroundColor: 'var(--blue-very-light)' }}>
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <h2 className="text-center font-alef font-bold text-2xl md:text-3xl lg:text-4xl mb-12 leading-relaxed" style={{ color: 'var(--purple-deep)' }}>
            הקשיבי למה שנשים כמוך מספרות
          </h2>

          {/* 3 Testimonial Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              "״מדהים מדהים, רות! המשפט הזה נגע בי הכי חזק: תפילה = רצון״",
              "״וואו, כמה חדות! כמה תובנות. איך לקחת מילים מוכרות והצגת אותן בזווית כל כך אחרת״",
              "״אליי זה הגיע פשוט בזמן (ולא התפללתי על זה, זה רק רציתי). תודה לך!״"
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <Quote className="text-blue-400 flex-shrink-0 mt-1" size={24} />
                  <p className="font-heebo text-lg leading-relaxed text-gray-800">
                    {testimonial}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 9: 3-step structured method */}
      <div className="w-full bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h2 className="text-center font-alef font-bold text-2xl md:text-3xl lg:text-4xl mb-12 leading-relaxed purple-text">
            איך בדיוק נחבר מחדש את התפילה לחיים שלך?
          </h2>

          {/* 3 Steps */}
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: 'var(--purple-deep)' }}>
                1
              </div>
              <div className="flex-1">
                <h3 className="font-alef font-bold text-xl md:text-2xl mb-4" style={{ color: 'var(--purple-deep)' }}>
                  חידוש תפיסות ישנות
                </h3>
                <div className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800 space-y-2">
                  <p>נבין מדוע אמונות כמו "תפילה צריכה להיות מושלמת" הן אלו שתוקעות אותנו.</p>
                  <p>נלמד להפסיק להרגיש אשמה על כך שהראש שלנו נודד,</p>
                  <p>ונגלה איך דווקא המחשבות האלו הן חומר הגלם לתפילה הכי אמיתית שיש.</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: 'var(--purple-deep)' }}>
                2
              </div>
              <div className="flex-1">
                <h3 className="font-alef font-bold text-xl md:text-2xl mb-4" style={{ color: 'var(--purple-deep)' }}>
                  רכישת כלים מעשיים
                </h3>
                <div className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800 space-y-2">
                  <p>תקבלי ארגז כלים פשוט ופרקטי להתחברות.</p>
                  <p>נלמד טכניקות קצרות של דקה או שתיים לעשות "אתחול" לפני התפילה,</p>
                  <p>נגלה איך למצוא את הבקשות האישיות שלנו בתוך הטקסט הכתוב,</p>
                  <p>ונקבל טיפים להתמודדות עם הסחות דעת בזמן אמת.</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: 'var(--purple-deep)' }}>
                3
              </div>
              <div className="flex-1">
                <h3 className="font-alef font-bold text-xl md:text-2xl mb-4" style={{ color: 'var(--purple-deep)' }}>
                  הטמעה בתוך מרוץ החיים
                </h3>
                <div className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800 space-y-2">
                  <p>נלמד איך להפוך את התפילה לחלק טבעי מהיום, ולא למשהו שצריך "לפנות לו זמן".</p>
                  <p>תגלי איך אפשר להתפלל תפילה עמוקה גם בחמש דקות,</p>
                  <p>איך למצוא רגעי חיבור קטנים לאורך היום,</p>
                  <p>ואיך להפוך כל פעולה יומיומית להזדמנות להתקרבות לבורא עולם.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 10: What we'll do vs what you'll get */}
      <div className="w-full bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="border-2 p-8 rounded-lg">
            {/* Title */}
            <h2 className="text-center font-alef font-bold text-2xl md:text-3xl lg:text-4xl mb-12 leading-relaxed" style={{ color: 'var(--purple-deep)' }}>
              הדרכים החדשות שתגלי בסדנה כדי להפוך כל תפילה לחוויה רוחנית וגשמית
            </h2>

            {/* 2 Column Layout */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Column 1: What we'll do */}
              <div className="space-y-6">
                <h3 className="font-alef font-bold text-xl md:text-2xl text-center mb-6" style={{ color: 'var(--purple-deep)' }}>
                  מה נעשה בסדנה
                </h3>
                <div className="space-y-4">
                  {[
                    "נלמד תפיסות חדשות ופורצות דרך על מהות התפילה.",
                    "נקבל טיפים מעשיים וכלים ליישום להתחברות מיידית.",
                    "נרכוש מיומנויות לעצור רגע לפני התפילה ולכוון את הלב.",
                    "נבין איך להפסיק להילחם במחשבות הטורדניות ולהשתמש בהן כקרש קפיצה.",
                    "נגלה איך למצוא את עצמנו בתוך המילים המוכרות של הסידור.",
                    "נזהה את החסם האישי שלנו להתחברות ונהפוך אותו לכלי הכי חזק שלנו."
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                      <p className="font-heebo text-lg leading-relaxed text-gray-800">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: What you'll get */}
              <div className="space-y-6">
                <h3 className="font-alef font-bold text-xl md:text-2xl text-center mb-6" style={{ color: 'var(--purple-deep)' }}>
                  התוצאה שלך
                </h3>
                <div className="space-y-4">
                  {[
                    "חשק אמיתי להתפלל, גם כשאין לך זמן או כוח.",
                    "יכולת להפוך כל תפילה לשיחה אישית, מרגשת ומלאה.",
                    "שחרור מרגשות האשמה וההתסכול שליוו אותך עד היום.",
                    "תחושת קרבה וחיבור לבורא עולם שלא הרגשת אולי שנים.",
                    "כלים פשוטים שמלווים אותך לאורך כל היום, לא רק בזמן התפילה.",
                    "תחושת רכות וכוח פנימי שמשפיעה על כל תחומי החיים."
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Star className="flex-shrink-0 mt-1" size={20} style={{ color: 'var(--pink-vibrant)' }} />
                      <p className="font-heebo text-lg leading-relaxed text-gray-800">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Button
                onClick={scrollToForm}
                className="text-white font-bold text-lg md:text-xl px-8 py-6 md:px-12 md:py-8 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg max-w-2xl mx-auto h-auto"
                style={{ backgroundColor: 'var(--pink-vibrant)' }}
              >
                כן, אני רוצה לקבל את כל הכלים ולהירשם לסדנה החינמית
              </Button>
            </div>
          </div>
        </div>
      </div>

    
       
      {/* Section 14: FAQ */}
      <div className="w-full py-16 px-4" style={{ backgroundColor: 'var(--blue-very-light)' }}>
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h2 className="text-center font-alef font-bold text-2xl md:text-3xl lg:text-4xl mb-12 leading-relaxed" style={{ color: 'var(--purple-deep)' }}>
            שאלות נפוצות
          </h2>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm">
            <AccordionItem value="item-1" className="border-b border-gray-200 last:border-b-0">
              <AccordionTrigger className="text-right px-4 sm:px-6 py-4 text-base sm:text-lg md:text-xl font-heebo hover:no-underline" style={{ color: 'var(--purple-deep)' }}>
                "אין לי זמן לסדנה של שעתיים, בקושי יש לי זמן להתפלל."
              </AccordionTrigger>
              <AccordionContent className="px-4 sm:px-6 pb-4 text-right">
                <div className="font-heebo text-sm sm:text-base md:text-lg leading-relaxed text-gray-800 space-y-2">
                  <p>אני מבינה אותך לגמרי. בדיוק בגלל זה הסדנה הזו כל כך חשובה עבורך. השעתיים האלה הן לא עוד "מטלה", הן השקעה שתחזיר את עצמה עשרות מונים. הכלים שתקבלי ילמדו אותך איך להפוך את מעט הזמן שיש לך לאיכותי ויעיל פי כמה. תגלי איך חמש דקות של תפילה מחוברת יכולות לתת לך יותר כוח משעה של תפילה מכנית.</p>
                  <p className="font-bold">איכות על פני כמות.</p>
                  <p>בנוסף, תקבלי גישה להקלטה ותוכלי לצפות בה בזמן שנוח לך.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b border-gray-200 last:border-b-0">
              <AccordionTrigger className="text-right px-4 sm:px-6 py-4 text-base sm:text-lg md:text-xl font-heebo hover:no-underline" style={{ color: 'var(--purple-deep)' }}>
                "ניסיתי כבר הכל, אני פשוט לא בן אדם 'רוחני' יותר, החיים שחקו אותי."
              </AccordionTrigger>
              <AccordionContent className="px-4 sm:px-6 pb-4 text-right">
                <div className="font-heebo text-sm sm:text-base md:text-lg leading-relaxed text-gray-800">
                  <p>התחושה הזאת כל כך מוכרת, והיא נובעת מהאמונה השגויה ש"רוחניות" היא משהו ששייך רק לאנשים מסוימים או לתקופות מסוימות בחיים. הסדנה הזאת תוכיח לך שרוחניות לא נעלמת, היא פשוט משנה צורה. תלמדי למצוא את החיבור הרוחני שלך לא בשעה של הקשבה להרצאה מרוממת, או בשירה בשעת ליל, אלא דווקא בתוך שגרת החיים העמוסה. את לא "שחוקה", את פשוט צריכה כלים חדשים שמתאימים למי שאת היום.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b border-gray-200 last:border-b-0">
              <AccordionTrigger className="text-right px-4 sm:px-6 py-4 text-base sm:text-lg md:text-xl font-heebo hover:no-underline" style={{ color: 'var(--purple-deep)' }}>
                "זה בטח עוד סדנה שנותנת הרגשה טובה לרגע ואז הכל חוזר לקדמותו."
              </AccordionTrigger>
              <AccordionContent className="px-4 sm:px-6 pb-4 text-right">
                <div className="font-heebo text-sm sm:text-base md:text-lg leading-relaxed text-gray-800">
                  <p>זו לא הרצאה שנועדה לתת "זריקת מוטיבציה". זו סדנה מעשית שנותנת מיומנויות. בדיוק כמו שלומדים לבשל או לנהוג, כך נלמד מיומנות חדשה: המיומנות של תפילה מחוברת. תצאי עם כלים פרקטיים ועם תוכנית פעולה פשוטה שתוכלי ליישם מיד. המטרה היא לא שינוי רגעי, אלא יצירת הרגלים חדשים שישנו את חווית התפילה שלך לתמיד.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Section 15: Final Call to Action */}
      <div className="w-full py-16 px-4" style={{ backgroundColor: 'var(--pink-vibrant)' }}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Final CTA Text */}
          <div className="text-white font-heebo text-lg md:text-xl lg:text-2xl leading-relaxed space-y-4">
            <p>הגיע הזמן להחזיר את התפילה למקום שהיא ראויה לו בחיים שלך.</p>
            <p>הצטרפי אליי למסע מרגש ומשנה תפיסה,</p>
            <p>שיחזיר לך את הקול, את הלב, ואת החיבור – דרך מילים שכבר מזמן שכחת שהן שלך.</p>
          </div>

          {/* Final CTA Button */}
          <Button
            onClick={scrollToForm}
            className="bg-white font-bold text-base sm:text-lg md:text-xl px-6 sm:px-8 py-4 sm:py-6 md:px-12 md:py-8 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg max-w-full sm:max-w-3xl mx-auto h-auto text-center leading-snug w-full sm:w-auto"
            style={{ color: 'var(--pink-vibrant)' }}
          >
            <div className="sm:hidden">
              <div>כן! אני נרשמת עכשיו</div>
              <div>לסדנה החינמית</div>
            </div>
            <span className="hidden sm:inline">
              כן! אני נרשמת עכשיו לסדנה החינמית
            </span>
          </Button>
        </div>
      </div>

    
      {/* Section 18: Footer */}
      <div className="w-full bg-white py-8 px-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 font-heebo text-sm">
            © כל הזכויות שמורות | רות פריסמן | Ruth@RuthPrissman.co.il
          </p>
        </div>
      </div>
    </div>
  );
};

export default HebrewLandingPage;