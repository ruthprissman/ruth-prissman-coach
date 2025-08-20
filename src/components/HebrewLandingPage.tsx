import React from 'react';
import { Button } from '@/components/ui/button';
import { Quote, CheckCircle, Star } from 'lucide-react';

const HebrewLandingPage = () => {
  const scrollToForm = () => {
    // Add scroll to form logic when form is created
    console.log('Scrolling to registration form');
  };

  return (
    <div className="w-full">
      {/* Section 1: Top Bar */}
      <div 
        className="w-full flex items-center justify-center py-3 px-4"
        style={{ backgroundColor: 'var(--purple-deep)', minHeight: '50px' }}
      >
        <p className="text-white text-center font-alef font-bold text-sm md:text-base leading-tight">
          מרגישה שהתפילה שלך הפכה לעוד מטלה שצריך לסמן עליה וי?
        </p>
      </div>

      {/* Section 2: Hero with Background */}
      <div 
        className="relative w-full min-h-screen flex items-center justify-center px-4 py-16 md:py-24"
        style={{
          backgroundImage: `url('/lovable-uploads/04710e22-f223-434b-a8fe-d553816388a5.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 37, 58, 0.65), rgba(30, 20, 60, 0.7))'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Main Title */}
          <h1 className="text-white font-heebo text-2xl md:text-4xl lg:text-5xl leading-relaxed font-light">
            <span className="block">הסוד להפוך תפילה מעוד חובה</span>
            <span className="block">(שלא תמיד אנחנו מצליחים למלא),</span>
            <span className="block">למילים, לשיחה אמיתית שממלאת אותך בכוח.</span>
            <span className="block">גם כשהקטנים מושכים לך בחצאית והראש עמוס במטלות?</span>
          </h1>

          {/* Subtitle */}
          <div className="text-white font-heebo text-lg md:text-xl lg:text-2xl leading-relaxed font-light space-y-4 max-w-3xl mx-auto">
            <p>מה אם היית יכולה לפתוח את הסידור בקלות, להרגיש את הלב נפתח?</p>
            <p>לסיים כל תפילה בתחושת רוממות וחיבור, במקום בתחושת אשמה ותסכול.</p>
            <p>לגלות איך להכניס את כל החיים שלך, את כל הבלגן והעייפות, אל תוך המילים המוכרות, ולמצוא בהן אור חדש?</p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={scrollToForm}
            className="text-white font-bold text-lg md:text-xl px-8 py-6 md:px-12 md:py-8 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg max-w-2xl mx-auto h-auto"
            style={{ backgroundColor: 'var(--pink-vibrant)' }}
          >
            כן, אני רוצה לגלות איך להרגיש קרובה שוב ולהירשם לסדנה החינמית
          </Button>
        </div>
      </div>

      {/* Section 3: Empathy Bullets */}
      <div className="w-full bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h2 className="text-center font-alef font-bold text-2xl md:text-3xl lg:text-4xl mb-12 leading-relaxed purple-text">
            גם לך קורים הדברים האלה סביב התפילה, שמשאירים אותך מרוקנת במקום מלאה?
          </h2>

          {/* Bullet Points */}
          <div className="space-y-6">
            {[
              "את אומרת את המילים, אבל הראש שלך כבר עסוק ברשימת הקניות, בכביסות ובמה לבשל לצהריים.",
              "התפילה הפכה לעוד מטלה ברשימה האינסופית של היום, משהו שצריך רק לסיים ולסמן וי כדי להמשיך הלאה.",
              "את פותחת את הסידור ומרגישה ריקנות, לא מצליחה להתחבר למי שמקשיבי בצד השני.",
              "את מרגישה אשמה שאת לא מתרגשת, שהתפילה שלך הפכה למכנית, כמו רובוט שמדקלם טקסט.",
              "את מתגעגעת לתפילות של פעם, לימים שהתרגשת של מילה בלב, ותוהה לאן נעלמה כל ההתלהבות הזאת.",
              "את מרגישה כמעט זרה – כלפי חוץ את נראית כמו אישה מתפללת, אבל בפנים, הראש שלך נמצא במקום אחר לגמרי.",
              "אולי בכלל את לא מצליחה להתפלל....?"
            ].map((text, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm">
                <span className="text-2xl text-red-500 flex-shrink-0 mt-1">❌</span>
                <p className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800">
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
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              "להיות אמא מסורה ואישה עסוקה – וגם להרגיש קרובה למקור עליון.",
              "לנהל בית ועבודה תובעניים – וגם למצוא רגעים של שקט וחיבור רוחני.",
              "לעמוד בכל המטלות של היום – ולהתחיל אותו עם כוח ותחושת משמעות."
            ].map((text, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0 mt-1">🌀</span>
                  <p className="font-heebo text-lg leading-relaxed text-gray-800">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            onClick={scrollToForm}
            className="text-white font-bold text-lg md:text-xl px-8 py-6 md:px-12 md:py-8 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg max-w-2xl mx-auto h-auto"
            style={{ backgroundColor: 'var(--pink-vibrant)' }}
          >
            כן, אני רוצה לגלות איך להרגיש קרובה שוב ולהירשם לסדנה החינמית
          </Button>
        </div>
      </div>

      {/* Section 5: Deep Emotional Memory */}
      <div className="w-full py-16 px-4" style={{ backgroundColor: 'var(--cream-light)' }}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <h2 className="text-center font-alef font-bold text-2xl md:text-3xl lg:text-4xl mb-12 leading-relaxed purple-text">
            האם זו התפילה שחלמת עליה כשדמיינת את חייך הבוגרים?
          </h2>

          {/* Emotional Paragraph */}
          <div className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800">
            <p>
              את בטח זוכרת איזו שהיא פעם, אולי בימים נוראים, אולי ליד הכותל, אולי בסתם יום, כשהתפילה הייתה חיה לרגע.<br/>
              הלב היה פתוח, אולי זלגו כמה דמעות. הרגשת כל מילה חודרת עמוק פנימה.<br/>
              הרגשת שיש לך קשר ישיר, קו פתוח לבורא עולם. קיווית שכך ייראו חייך תמיד – מלאים ברוחניות, בקרבה, בתפילה חיה.<br/>
              אבל המציאות, איך נאמר בעדינות, קצת שונה.<br/>
              בדרך כלל, התפילה מרגישה כמו עוד פריט ברשימת המטלות האינסופית.<br/>
              היא נדחקת בין הכנת סנדוויצ'ים, מענה למיילים דחופים והרגעת הילדים.<br/>
              את מוצאת את עצמך ממלמלת את המילים במהירות, רק כדי לסיים, והראש כבר מזמן נודד לסידורים הבאים.<br/>
              במקום תחושת רוממות, את נשארת עם תחושת אשמה וריקנות.<br/>
              ולפעמים, מגלה שכבר עבר זמנה של שחרית, ואולי גם של מנחה, ואת עוד לא אמרת "מודה אני"...
            </p>
          </div>

          {/* Quote Block */}
          <div className="border-r-4 border-blue-400 bg-blue-50 p-6 rounded-lg shadow-sm">
            <div className="font-heebo text-lg md:text-xl leading-snug text-gray-800">
              <p>"התופעה הזו מוכרת וכואבת, להרבה מאוד נשים.</p>
              <p>היא נובעת ממקום גבוה וטהור. תמיד למדנו שתפילה היא מרוממת, ושהמילים קדושות כל כך.</p>
              <p>וקיבלנו איזו תחושה, שאם לא כיוונו את הכוונה הפנימית של כל מילה, אם לא התנתקנו מההווה הגשמי והעמוס שלנו, אז...</p>
              <p>מה 'שווה' התפילה שלנו?</p>
              <p className="font-bold">אבל האמת? הפוכה לגמרי!</p>
              <p>הקב"ה רוצה אותנו מתפללות מאיפה שאנחנו.</p>
              <p>הוא מחכה שנכניס את החיים האמיתיים שלנו, הגשמיים, הפשוטים, לתוך התפילה!</p>
              <p>את העייפות, את הדאגות, את האורז שנשרף והכתם שלא יורד. את הילד שיצא לטיול.</p>
              <p>את ההודיה על ציון טוב, את השמחות הקטנות של היום יום.</p>
              <p>להכניס את כולם לתוך המילים.</p>
              <p className="font-bold">למצוא אותם במילים."</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: The New Discovery */}
      <div className="w-full py-16 px-4" style={{ backgroundColor: 'var(--blue-very-light)' }}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Title */}
          <h2 className="font-alef font-bold text-2xl md:text-3xl lg:text-4xl leading-relaxed purple-text">
            הגילוי החדש שהופך תפילה מרוקנת לשיחה שממלאת את הלב
          </h2>

          {/* Text Block */}
          <div className="font-heebo text-lg md:text-xl leading-relaxed text-gray-800 space-y-4 max-w-3xl mx-auto">
            <p>הסדנה "חיבורים חדשים למילים מוכרות" היא לא עוד שיעור או הרצאה.</p>
            <p>זוהי מסגרת מעשית שנועדה לתת לך כלים פשוטים ושינויי תפיסה עמוקים</p>
            <p>שיאפשרו לך להתחבר לתפילה שלך כאן ועכשיו, בתוך החיים העמוסים שלך.</p>
            <p>אנחנו לא ננסה לחזור לתפילות של פעם, אלא ניצור סוג חדש של תפילה –</p>
            <p>תפילה בוגרת, אמיתית, כזו שמכילה את כל מי שאת היום.</p>
            <p>נלמד איך להפסיק להילחם במחשבות הנודדות,</p>
            <p>ובמקום זאת, לרתום אותן לתוך התפילה עצמה.</p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={scrollToForm}
            className="text-white font-bold text-lg md:text-xl px-8 py-6 md:px-12 md:py-8 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg max-w-2xl mx-auto h-auto"
            style={{ backgroundColor: 'var(--pink-vibrant)' }}
          >
            אני רוצה להירשם לסדנה החינמית
          </Button>
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
              className="text-white font-bold text-lg md:text-xl px-8 py-6 md:px-12 md:py-8 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg max-w-2xl mx-auto h-auto"
              style={{ backgroundColor: 'var(--pink-vibrant)' }}
            >
              אני רוצה לחיות את התפילה שלי ולהירשם עכשיו בחינם
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
          <div className="border-2 border-dashed border-blue-300 p-8 rounded-lg">
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
    </div>
  );
};

export default HebrewLandingPage;