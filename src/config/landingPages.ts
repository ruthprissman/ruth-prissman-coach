import { generatePrayerLandingEmailHTML } from '@/utils/emailTemplates/landing/prayer';
import { generatePrayerGuideEmailHTML } from '@/utils/emailTemplates/landing/prayerGuide';
import { generatePrePrayEmailHTML } from '@/utils/emailTemplates/landing/prePray';

export interface LandingPageConfig {
  id: string;
  name: string;
  publicPath: string;
  defaultEmailSubject: string;
  generateHtml: () => string;
}

export const landingPages: LandingPageConfig[] = [
  {
    id: 'prayer-workshop',
    name: 'סדנת תפילה',
    publicPath: '/prayer-landing',
    defaultEmailSubject: 'הסוד להפוך תפילה מעוד חובה למילים של חיבור אמיתי 🙏',
    generateHtml: generatePrayerLandingEmailHTML
  },
  {
    id: 'prayer-guide',
    name: 'מדריך תפילה',
    publicPath: '/prayer-guide',
    defaultEmailSubject: 'המדריך שלך בדרך! – להורדה: להתפלל כשאין זמן',
    generateHtml: generatePrayerGuideEmailHTML
  },
  {
    id: 'pre-pray',
    name: 'דקה לפני העמידה',
    publicPath: '/pre-pray',
    defaultEmailSubject: 'התפילה שלך היא מטלה או מתנה? 🙏',
    generateHtml: generatePrePrayEmailHTML
  }
];

export function getLandingPageById(id: string): LandingPageConfig | undefined {
  return landingPages.find(page => page.id === id);
}