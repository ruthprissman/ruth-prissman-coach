import { generatePrayerLandingEmailHTML } from '@/utils/emailTemplates/landing/prayer';

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
  }
  // כאן אפשר להוסיף דפי נחיתה נוספים בעתיד
];

export function getLandingPageById(id: string): LandingPageConfig | undefined {
  return landingPages.find(page => page.id === id);
}