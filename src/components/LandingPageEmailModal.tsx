import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Mail, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';

interface LandingPageEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LandingPageEmailModal: React.FC<LandingPageEmailModalProps> = ({ isOpen, onClose }) => {
  const [isSending, setIsSending] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isSpecificRecipientsMode, setIsSpecificRecipientsMode] = useState(false);
  const [allSubscribers, setAllSubscribers] = useState<Array<{email: string, firstName?: string}>>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [emailSubject, setEmailSubject] = useState('סדנת תפילה אישית - הזמנה מיוחדת');
  const { toast } = useToast();

  const generateLandingPageHTML = () => {
    // נשתמש ב-HTML המלא של דף הנחיתה עם כל העיצוב
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>הסוד להפוך תפילה מעוד חובה למילים של חיבור אמיתי - רות פריסמן</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@100;300;400;500;700;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Alef:wght@400;700&display=swap');
    
    :root {
      --purple-deep: hsl(215, 25%, 27%);
      --blue-soft: hsl(210, 40%, 92%);
      --blue-very-light: hsl(210, 40%, 96%);
      --pink-vibrant: hsl(340, 82%, 52%);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Heebo', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      direction: rtl;
    }

    .font-heebo { font-family: 'Heebo', Arial, sans-serif; }
    .font-alef { font-family: 'Alef', Arial, sans-serif; }
    .purple-text { color: var(--purple-deep); }
    
    .w-full { width: 100%; }
    .max-w-4xl { max-width: 56rem; margin: 0 auto; }
    .max-w-5xl { max-width: 64rem; margin: 0 auto; }
    .max-w-6xl { max-width: 72rem; margin: 0 auto; }
    .max-w-2xl { max-width: 42rem; margin: 0 auto; }
    .max-w-3xl { max-width: 48rem; margin: 0 auto; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-white { color: white; }
    .text-gray-800 { color: #1f2937; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-500 { color: #6b7280; }
    .text-red-500 { color: #ef4444; }
    .text-green-600 { color: #059669; }
    .text-blue-400 { color: #60a5fa; }
    
    .bg-white { background-color: white; }
    .bg-gray-50 { background-color: #f9fafb; }
    
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
    .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
    .px-8 { padding-left: 2rem; padding-right: 2rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .p-8 { padding: 2rem; }
    
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mb-12 { margin-bottom: 3rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-8 { margin-top: 2rem; }
    
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-3 > * + * { margin-top: 0.75rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .space-y-6 > * + * { margin-top: 1.5rem; }
    .space-y-8 > * + * { margin-top: 2rem; }
    
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    
    .flex { display: flex; }
    .flex-1 { flex: 1; }
    .flex-shrink-0 { flex-shrink: 0; }
    .items-start { align-items: flex-start; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .rounded-full { border-radius: 9999px; }
    
    .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
    .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05); }
    
    .font-light { font-weight: 300; }
    .font-bold { font-weight: 700; }
    
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-base { font-size: 1rem; line-height: 1.5rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    .text-2xl { font-size: 1.5rem; line-height: 2rem; }
    .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
    .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
    .text-5xl { font-size: 3rem; line-height: 1; }
    
    .leading-tight { line-height: 1.25; }
    .leading-relaxed { line-height: 1.625; }
    .leading-snug { line-height: 1.375; }
    
    .border-t { border-top-width: 1px; }
    .border-gray-200 { border-color: #e5e7eb; }
    .border-2 { border-width: 2px; }
    
    .min-h-screen { min-height: 100vh; }
    .h-16 { height: 4rem; }
    .w-16 { width: 4rem; }
    
    .relative { position: relative; }
    .absolute { position: absolute; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .z-10 { z-index: 10; }
    
    .block { display: block; }
    
    .cta-button {
      background-color: var(--pink-vibrant);
      color: white;
      padding: 1rem 2rem;
      border-radius: 0.75rem;
      text-decoration: none;
      display: inline-block;
      font-weight: bold;
      font-size: 1.125rem;
      transition: all 0.3s ease;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      text-align: center;
      margin: 0 auto;
      max-width: 32rem;
      width: 100%;
    }
    
    .cta-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .hero-section {
      background-image: url('https://coach.ruthprissman.co.il/lovable-uploads/04710e22-f223-434b-a8fe-d553816388a5.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .hero-overlay {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: linear-gradient(135deg, rgba(16, 37, 58, 0.65), rgba(30, 20, 60, 0.7));
    }
    
    .hero-content {
      position: relative;
      z-index: 10;
      text-align: center;
      color: white;
      max-width: 64rem;
      margin: 0 auto;
    }
    
    .step-number {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background-color: var(--purple-deep);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
      flex-shrink: 0;
    }
    
    .testimonial-quote::before {
      content: '"';
      font-size: 1.5rem;
      color: #60a5fa;
      vertical-align: top;
    }
    
    .icon {
      width: 24px;
      height: 24px;
      display: inline-block;
      vertical-align: middle;
      margin-left: 0.5rem;
    }
    
    .icon-star { color: var(--pink-vibrant); }
    .icon-check { color: #10b981; }
    .icon-x { color: #ef4444; }
    
    @media (min-width: 640px) {
      .sm\\:text-lg { font-size: 1.125rem; line-height: 1.75rem; }
      .sm\\:text-xl { font-size: 1.25rem; line-height: 1.75rem; }
      .sm\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
      .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .sm\\:py-16 { padding-top: 4rem; padding-bottom: 4rem; }
      .sm\\:space-y-4 > * + * { margin-top: 1rem; }
      .sm\\:space-y-6 > * + * { margin-top: 1.5rem; }
      .sm\\:space-y-8 > * + * { margin-top: 2rem; }
      .sm\\:gap-6 { gap: 1.5rem; }
      .sm\\:p-4 { padding: 1rem; }
      .sm\\:p-6 { padding: 1.5rem; }
      .sm\\:p-8 { padding: 2rem; }
      .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
      .sm\\:py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
      .sm\\:mb-8 { margin-bottom: 2rem; }
      .sm\\:mb-12 { margin-bottom: 3rem; }
    }
    
    @media (min-width: 768px) {
      .md\\:text-xl { font-size: 1.25rem; line-height: 1.75rem; }
      .md\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
      .md\\:text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
      .md\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
      .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .md\\:py-8 { padding-top: 2rem; padding-bottom: 2rem; }
      .md\\:py-24 { padding-top: 6rem; padding-bottom: 6rem; }
      .md\\:px-12 { padding-left: 3rem; padding-right: 3rem; }
      .md\\:max-w-2xl { max-width: 42rem; }
    }
    
    @media (min-width: 1024px) {
      .lg\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
      .lg\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
      .lg\\:text-5xl { font-size: 3rem; line-height: 1; }
    }
  </style>
</head>
<body>
  <!-- Top Bar -->
  <div style="background-color: var(--purple-deep); min-height: 50px; display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem;">
    <p style="color: white; text-align: center; font-family: 'Alef', Arial, sans-serif; font-weight: bold; font-size: 0.875rem; line-height: 1.25;">
      מרגישה שהתפילה שלך הפכה לעוד מטלה שצריך לסמן עליה וי?
    </p>
  </div>

  <!-- Hero Section -->
  <div class="hero-section">
    <div class="hero-overlay"></div>
    <div class="hero-content py-12 px-4">
      <h1 class="text-white font-heebo text-xl leading-relaxed font-light mb-6 sm:text-2xl md:text-4xl lg:text-5xl">
        <span class="block mb-2">הסוד להפוך תפילה מעוד חובה</span>
        <span class="block mb-2 text-lg sm:text-xl md:text-3xl lg:text-4xl">(שלא תמיד אנחנו מצליחים למלא),</span>
        <span class="block mb-2">למילים, לשיחה אמיתית שממלאת אותך בכוח.</span>
        <span class="block text-lg sm:text-xl md:text-3xl lg:text-4xl">גם כשהקטנים מושכים לך בחצאית והראש עמוס במטלות?</span>
      </h1>

      <div class="text-white font-heebo text-base leading-relaxed font-light space-y-3 max-w-4xl mx-auto px-2 sm:text-lg md:text-xl lg:text-2xl sm:space-y-4">
        <p>מה אם היית יכולה לפתוח את הסידור בקלות, להרגיש את הלב נפתח?</p>
        <p>לסיים כל תפילה בתחושת רוממות וחיבור, במקום בתחושת אשמה ותסכול.</p>
        <p>לגלות איך להכניס את כל החיים שלך, את כל הבלגן והעייפות, אל תוך המילים המוכרות, ולמצוא בהן אור חדש?</p>
      </div>

      <div class="mt-8">
        <a href="https://coach.ruthprissman.co.il/prayer-landing" class="cta-button">
          אני נרשמת לסדנה החינמית עכשיו
        </a>
      </div>
    </div>
  </div>

  <!-- Empathy Bullets Section -->
  <div style="background-color: #f9fafb; padding: 3rem 1rem;" class="sm:py-16">
    <div class="max-w-4xl">
      <h2 class="text-center font-alef font-bold text-xl purple-text mb-8 leading-relaxed px-2 sm:text-2xl md:text-3xl lg:text-4xl sm:mb-12">
        גם לך קורים הדברים האלה סביב התפילה, שמשאירים אותך מרוקנת במקום מלאה?
      </h2>

      <div class="space-y-4 sm:space-y-6">
        <div class="flex items-start gap-3 p-3 rounded-lg bg-white shadow-sm sm:gap-4 sm:p-4">
          <span class="text-xl text-red-500 flex-shrink-0 mt-1 sm:text-2xl">❌</span>
          <p class="font-heebo text-base text-gray-800 leading-relaxed sm:text-lg md:text-xl">
            את אומרת את המילים, אבל הראש שלך כבר עסוק ברשימת הקניות, בכביסות ובמה לבשל לצהריים.
          </p>
        </div>
        
        <div class="flex items-start gap-3 p-3 rounded-lg bg-white shadow-sm sm:gap-4 sm:p-4">
          <span class="text-xl text-red-500 flex-shrink-0 mt-1 sm:text-2xl">❌</span>
          <p class="font-heebo text-base text-gray-800 leading-relaxed sm:text-lg md:text-xl">
            התפילה הפכה לעוד מטלה ברשימה האינסופית של היום, משהו שצריך רק לסיים ולסמן וי כדי להמשיך הלאה.
          </p>
        </div>
        
        <div class="flex items-start gap-3 p-3 rounded-lg bg-white shadow-sm sm:gap-4 sm:p-4">
          <span class="text-xl text-red-500 flex-shrink-0 mt-1 sm:text-2xl">❌</span>
          <p class="font-heebo text-base text-gray-800 leading-relaxed sm:text-lg md:text-xl">
            את פותחת את הסידור ומרגישה ריקנות, לא מצליחה להתחבר למי שמקשיבי בצד השני.
          </p>
        </div>
        
        <div class="flex items-start gap-3 p-3 rounded-lg bg-white shadow-sm sm:gap-4 sm:p-4">
          <span class="text-xl text-red-500 flex-shrink-0 mt-1 sm:text-2xl">❌</span>
          <p class="font-heebo text-base text-gray-800 leading-relaxed sm:text-lg md:text-xl">
            את מרגישה אשמה שאת לא מתרגשת, שהתפילה שלך הפכה למכנית, כמו רובוט שמדקלם טקסט.
          </p>
        </div>
        
        <div class="flex items-start gap-3 p-3 rounded-lg bg-white shadow-sm sm:gap-4 sm:p-4">
          <span class="text-xl text-red-500 flex-shrink-0 mt-1 sm:text-2xl">❌</span>
          <p class="font-heebo text-base text-gray-800 leading-relaxed sm:text-lg md:text-xl">
            את מתגעגעת לתפילות של פעם, לימים שהתרגשת של מילה בלב, ותוהה לאן נעלמה כל ההתלהבות הזאת.
          </p>
        </div>
        
        <div class="flex items-start gap-3 p-3 rounded-lg bg-white shadow-sm sm:gap-4 sm:p-4">
          <span class="text-xl text-red-500 flex-shrink-0 mt-1 sm:text-2xl">❌</span>
          <p class="font-heebo text-base text-gray-800 leading-relaxed sm:text-lg md:text-xl">
            את מרגישה כמעט זרה – כלפי חוץ את נראית כמו אישה מתפללת, אבל בפנים, הראש שלך נמצא במקום אחר לגמרי.
          </p>
        </div>
        
        <div class="flex items-start gap-3 p-3 rounded-lg bg-white shadow-sm sm:gap-4 sm:p-4">
          <span class="text-xl text-red-500 flex-shrink-0 mt-1 sm:text-2xl">❌</span>
          <p class="font-heebo text-base text-gray-800 leading-relaxed sm:text-lg md:text-xl">
            אולי בכלל את לא מצליחה להתפלל....?
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Hope and Promise Section -->
  <div style="background-color: var(--blue-soft); padding: 4rem 1rem;">
    <div class="max-w-4xl text-center space-y-8">
      <h2 class="font-alef font-bold text-2xl leading-relaxed purple-text md:text-3xl lg:text-4xl">
        הגיע הזמן לגלות איך להחיות את התפילה שלך, ולהפוך אותה למקור הכוח הגדול ביותר ביום שלך.
      </h2>

      <div class="font-heebo text-lg leading-relaxed max-w-3xl mx-auto space-y-4 purple-text md:text-xl">
        <p>מתוך עבודה עם נשים כמוך, ומתוך המסע האישי שלי כאישה, כאמא וכמאמנת – גיליתי שיש דרך אחרת.</p>
        <p>דרך שלא דורשת ממך להיות מושלמת או מנותקת מהמציאות.</p>
        <p>למדתי, ואני עדיין לומדת, איך להפוך את התפילה לחיה, נושמת ואמיתית.</p>
        <p><strong>איך להתפלל מתוך החיים שלך, ולא בהשעייה מהם.</strong></p>
      </div>

      <div class="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
        <div class="flex justify-center items-center mb-6">
          <div class="step-number">1</div>
        </div>
        
        <h3 class="font-alef font-bold text-xl purple-text mb-4 md:text-2xl">
          📅 יום רביעי, 1 בינואר 2025
        </h3>
        
        <h4 class="font-heebo text-lg purple-text mb-4 md:text-xl">
          🕐 שעה: 20:00-21:30 (שעה וחצי)
        </h4>
        
        <div class="space-y-3 text-right">
          <p class="font-heebo text-base leading-relaxed purple-text md:text-lg">
            💰 <strong>עלות:</strong> ללא תשלום
          </p>
          <p class="font-heebo text-base leading-relaxed purple-text md:text-lg">
            📍 <strong>פלטפורמה:</strong> זום
          </p>
        </div>

        <div class="mt-6">
          <a href="https://coach.ruthprissman.co.il/prayer-landing" class="cta-button w-full">
            אני נרשמת עכשיו
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Benefits Section -->
  <div class="w-full py-16 px-4 bg-white">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-center font-alef font-bold text-2xl purple-text mb-12 leading-relaxed md:text-3xl lg:text-4xl">
        איך זה יעזור לך?
      </h2>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        <div class="bg-red-50 p-6 rounded-xl border-r-4 border-red-400 shadow-sm">
          <div class="flex items-start gap-3 mb-4">
            <span class="text-2xl">😔</span>
            <h3 class="font-alef font-bold text-lg purple-text">מרגישה לא מספיק טובה?</h3>
          </div>
          <p class="font-heebo text-base leading-relaxed text-gray-800">
            נלמד איך להשתמש בתפילה כדי להגביר את הביטחון העצמי ולהרגיש יותר חזקה ובטוחה.
          </p>
        </div>

        <div class="bg-blue-50 p-6 rounded-xl border-r-4 border-blue-400 shadow-sm">
          <div class="flex items-start gap-3 mb-4">
            <span class="text-2xl">😰</span>
            <h3 class="font-alef font-bold text-lg purple-text">מתקשה להתמודד עם רגשות קשים?</h3>
          </div>
          <p class="font-heebo text-base leading-relaxed text-gray-800">
            נגלה איך תפילה יכולה להביא רגיעה ושלווה פנימית גם בזמנים הכי מאתגרים.
          </p>
        </div>

        <div class="bg-green-50 p-6 rounded-xl border-r-4 border-green-400 shadow-sm">
          <div class="flex items-start gap-3 mb-4">
            <span class="text-2xl">😕</span>
            <h3 class="font-alef font-bold text-lg purple-text">חשה תקועה או חסרת כיוון?</h3>
          </div>
          <p class="font-heebo text-base leading-relaxed text-gray-800">
            נלמד להשתמש בתפילה כדי לקבל בהירות והכוונה לצעדים הבאים בחיים.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- What You'll Get Section -->
  <div class="w-full py-16 px-4" style="background-color: var(--blue-very-light);">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-center font-alef font-bold text-2xl purple-text mb-12 leading-relaxed md:text-3xl lg:text-4xl">
        מה תקבלי בסדנה הזאת:
      </h2>

      <div class="space-y-6">
        <div class="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
          <span class="text-2xl flex-shrink-0">✨</span>
          <div>
            <h3 class="font-alef font-bold text-lg purple-text mb-2">הבנה עמוקה</h3>
            <p class="font-heebo text-base leading-relaxed text-gray-800">
              איך תפילה יכולה לשמש ככלי טיפולי עוצמתי לחיזוק האמונה העצמית ויצירת שינוי פנימי.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
          <span class="text-2xl flex-shrink-0">🎯</span>
          <div>
            <h3 class="font-alef font-bold text-lg purple-text mb-2">טכניקות מעשיות</h3>
            <p class="font-heebo text-base leading-relaxed text-gray-800">
              שיטות פשוטות ויעילות לשילוב תפילה בחיי היום-יום, גם כשהזמן מוגבל והמחשבות מתרוצצות.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
          <span class="text-2xl flex-shrink-0">💝</span>
          <div>
            <h3 class="font-alef font-bold text-lg purple-text mb-2">חוויה אישית</h3>
            <p class="font-heebo text-base leading-relaxed text-gray-800">
              איך להתאים את התפילה לצרכים שלך הספציפיים ולמצב הנפשי והחיים שלך כרגע.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
          <span class="text-2xl flex-shrink-0">🌟</span>
          <div>
            <h3 class="font-alef font-bold text-lg purple-text mb-2">חיבור רגשי</h3>
            <p class="font-heebo text-base leading-relaxed text-gray-800">
              איך להגיע לעומק בתפילה, לחוות חיבור אמיתי ולצאת מכל תפילה מחוזקת ומלאה כוח.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CTA Section -->
  <div class="w-full py-16 px-4 bg-white">
    <div class="max-w-3xl mx-auto text-center space-y-8">
      <h2 class="font-alef font-bold text-2xl leading-relaxed purple-text md:text-3xl lg:text-4xl">
        מוכנה להתחיל?
      </h2>

      <p class="font-heebo text-lg leading-relaxed max-w-2xl mx-auto purple-text md:text-xl">
        הצטרפי אלינו לסדנה מיוחדת הזאת ותגלי את הכוח הטיפולי שבתפילה שלך.
        <br><strong>זו הזדמנות לחבר מחדש עם עצמך ועם התפילה.</strong>
      </p>

      <div class="bg-purple-50 p-8 rounded-xl shadow-lg">
        <h3 class="font-alef font-bold text-xl purple-text mb-4">פרטי הסדנה:</h3>
        <div class="space-y-2 text-right max-w-md mx-auto">
          <p class="font-heebo text-base purple-text">📅 <strong>תאריך:</strong> יום רביעי, 1 בינואר 2025</p>
          <p class="font-heebo text-base purple-text">🕐 <strong>שעה:</strong> 20:00-21:30</p>
          <p class="font-heebo text-base purple-text">🎥 <strong>פלטפורמה:</strong> זום</p>
          <p class="font-heebo text-base purple-text">💰 <strong>עלות:</strong> ללא תשלום</p>
        </div>
      </div>

      <div class="mt-8">
        <a href="https://coach.ruthprissman.co.il/prayer-landing" class="cta-button">
          🌟 אני נרשמת לסדנה עכשיו
        </a>
      </div>
    </div>
  </div>

  <!-- About Ruth Section -->
  <div class="w-full py-16 px-4" style="background-color: var(--blue-soft);">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-center font-alef font-bold text-2xl purple-text mb-12 leading-relaxed md:text-3xl lg:text-4xl">
        מי אני ומדוע זה חשוב לי?
      </h2>

      <div class="bg-white p-8 rounded-xl shadow-lg">
        <div class="flex flex-col md:flex-row md:gap-8 items-start">
          <div class="flex-1 text-right">
            <h3 class="font-alef font-bold text-xl purple-text mb-4">רות פריסמן</h3>
            <p class="font-heebo text-base leading-relaxed text-gray-800 mb-4">
              <strong>מאמנת בגישה טיפולית | קוד הנפש | SEFT</strong>
            </p>
            
            <div class="space-y-4 font-heebo text-base leading-relaxed text-gray-800">
              <p>
                כאישה דתייה, אמא לשלושה ילדים ומאמנת – אני מכירה מקרוב את המאבק להתחבר לתפילה בעומק החיים היומיומיים.
              </p>
              
              <p>
                במשך שנים חוויתי בעצמי את התחושה שהתפילה הפכה למכנית, לעוד פעולה שצריך לעשות במרוץ היום.
              </p>
              
              <p>
                דרך הכלים שלמדתי ופיתחתי, גיליתי איך להפוך את התפילה למקום של חיבור אמיתי ושינוי פנימי.
              </p>
              
              <p>
                <strong>היום אני מלווה נשים לגלות את הכוח הטיפולי שבתפילה שלהן.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Contact Section -->
  <div class="w-full py-12 px-4 bg-white border-t border-gray-200">
    <div class="max-w-4xl mx-auto text-center">
      <h3 class="font-alef font-bold text-lg purple-text mb-6">יש שאלות? אשמח לעזור!</h3>
      
      <div class="space-y-2 font-heebo text-base text-gray-600">
        <p>📧 Ruth@RuthPrissman.co.il</p>
        <p>📱 0556620273</p>
        <p>🌐 https://coach.ruthprissman.co.il</p>
      </div>
      
      <div class="mt-8">
        <a href="https://coach.ruthprissman.co.il/prayer-landing" class="cta-button">
          אני נרשמת לסדנה עכשיו 🌟
        </a>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="w-full py-8 px-4 bg-gray-50 border-t border-gray-200">
    <div class="max-w-4xl mx-auto text-center">
      <p class="text-gray-500 font-heebo text-sm">
        © כל הזכויות שמורות | רות פריסמן | Ruth@RuthPrissman.co.il
      </p>
    </div>
  </div>
</body>
</html>`;
  };

  const handleSendLandingPageEmail = async () => {
    setIsSending(true);

    try {
      const supabase = supabaseClient();
      
      // Get article subscribers if not test mode
      let recipientEmails: string[] = [];
      
      if (isTestMode) {
        recipientEmails = ['ruth@ruthprissman.co.il'];
      } else if (isSpecificRecipientsMode) {
        recipientEmails = selectedRecipients;
      } else {
        // Get active article subscribers
        const { data: subscribers, error: subscribersError } = await supabase
          .from('subscribers')
          .select('email')
          .eq('is_subscribed', true);

        if (subscribersError) {
          throw subscribersError;
        }

        recipientEmails = subscribers?.map(sub => sub.email) || [];
      }

      if (recipientEmails.length === 0) {
        toast({
          title: "אין נמענים",
          description: isTestMode ? "לא נמצא כתובת מייל לבדיקה" : "לא נמצאו מנויים פעילים למאמרים",
          variant: "destructive"
        });
        return;
      }

      // Generate email content
      const emailContent = generateLandingPageHTML();

      // Call the send-email edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          emailList: recipientEmails,
          subject: emailSubject,
          sender: {
            email: "ruth@ruthprissman.co.il",
            name: "רות פריסמן"
          },
          htmlContent: emailContent
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);

      toast({
        title: isTestMode ? "מייל בדיקה נשלח" : "ההזמנה לסדנה נשלחה בהצלחה",
        description: isTestMode 
          ? "מייל הבדיקה נשלח לכתובת ruth@ruthprissman.co.il"
          : `ההזמנה נשלחה ל-${recipientEmails.length} נמענים`
      });

      onClose();
    } catch (error: any) {
      console.error('Error sending landing page email:', error);
      toast({
        title: "שגיאה בשליחת המייל",
        description: error.message || "אירעה שגיאה בשליחת המייל. נסה שוב מאוחר יותר.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const loadSubscribersWithSentStatus = async () => {
    setIsLoadingSubscribers(true);
    try {
      const supabase = supabaseClient();
      
      // Get all active article subscribers
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('email, first_name')
        .eq('is_subscribed', true);

      if (subscribersError) throw subscribersError;

      const subscribersWithStatus = subscribers?.map(sub => ({
        email: sub.email,
        firstName: sub.first_name
      })) || [];

      setAllSubscribers(subscribersWithStatus);
      setSelectedRecipients(subscribersWithStatus.map(s => s.email));
      
    } catch (error: any) {
      console.error('Error loading subscribers:', error);
      toast({
        title: "שגיאה בטעינת נמענים",
        description: error.message || "לא ניתן לטעון את רשימת הנמענים",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  const handleSpecificRecipientsChange = async (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setIsSpecificRecipientsMode(isChecked);
    
    if (isChecked && allSubscribers.length === 0) {
      await loadSubscribersWithSentStatus();
    }
  };

  const handleRecipientToggle = (email: string) => {
    setSelectedRecipients(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleTestModeChange = (checked: boolean | "indeterminate") => {
    setIsTestMode(checked === true);
    if (checked) {
      setIsSpecificRecipientsMode(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">שליחת הזמנה לסדנה במייל</DialogTitle>
          <DialogDescription className="text-right">
            שליחת דף הנחיתה של הסדנה כמייל מעוצב לרשימת התפוצה
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-right">כותרת המייל</Label>
            <Input
              id="subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="הכנס כותרת למייל..."
              className="text-right"
              dir="rtl"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-right mb-2">תצוגה מקדימה:</h4>
            <p className="text-sm text-right">המייל יכלול את כל התוכן של דף הנחיתה</p>
            <p className="text-sm text-right">עם לינק להרשמה שמוביל לאתר שלך</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 justify-end">
              <label htmlFor="testMode" className="text-sm font-medium text-right">
                שליחת מייל בדיקה (רק לכתובת ruth@ruthprissman.co.il)
              </label>
              <Checkbox
                id="testMode"
                checked={isTestMode}
                onCheckedChange={handleTestModeChange}
              />
            </div>

            <div className="flex items-center space-x-2 justify-end">
              <label htmlFor="specificRecipients" className="text-sm font-medium text-right">
                בחירת נמענים ספציפיים
              </label>
              <Checkbox
                id="specificRecipients"
                checked={isSpecificRecipientsMode}
                onCheckedChange={handleSpecificRecipientsChange}
                disabled={isTestMode}
              />
            </div>
          </div>

          {isSpecificRecipientsMode && !isTestMode && (
            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-right">בחירת נמענים:</h4>
                {isLoadingSubscribers && <span className="text-sm text-gray-500">טוען...</span>}
              </div>
              
              {allSubscribers.length > 0 && (
                <div className="space-y-2">
                  {allSubscribers.map((subscriber) => (
                    <div key={subscriber.email} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {subscriber.firstName || subscriber.email}
                        </div>
                        {subscriber.firstName && (
                          <div className="text-xs text-gray-500">{subscriber.email}</div>
                        )}
                      </div>
                      <Checkbox
                        checked={selectedRecipients.includes(subscriber.email)}
                        onCheckedChange={() => handleRecipientToggle(subscriber.email)}
                      />
                    </div>
                  ))}
                  
                  <div className="text-sm text-gray-600 text-right mt-3">
                    נבחרו {selectedRecipients.length} מתוך {allSubscribers.length} נמענים
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button
              onClick={handleSendLandingPageEmail}
              disabled={isSending || !emailSubject.trim()}
              className="bg-[#4A235A] hover:bg-[#5d2a6e] text-white"
            >
              {isSending ? (
                "שולח..."
              ) : (
                <>
                  {isTestMode ? <TestTube className="ml-2 h-4 w-4" /> : <Send className="ml-2 h-4 w-4" />}
                  {isTestMode ? "שלח מייל בדיקה" : "שלח לרשימת התפוצה"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LandingPageEmailModal;