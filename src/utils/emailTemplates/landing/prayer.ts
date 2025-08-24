import { prayerLandingContent } from '@/content/landing/prayer';

// פונקציה לוידוא התאמת תוכן מילה במילה
export function verifyExactMatch(generatedHtml: string): { isValid: boolean; missingContent: string[] } {
  const content = prayerLandingContent;
  const missingContent: string[] = [];
  
  // בדיקת הכותרות והתיאורים הראשיים
  const textFieldsToCheck = [
    content.topBar.text,
    content.hero.titleLine1,
    content.hero.titleLine2,
    content.hero.titleLine3,
    content.hero.titleLine4,
    content.hero.cta,
    content.empathy.title,
    content.hope.title,
    ...content.hero.description,
    ...content.empathy.items,
    ...content.hope.description
  ];
  
  // בדיקה שכל טקסט מופיע ב-HTML
  textFieldsToCheck.forEach(text => {
    if (!generatedHtml.includes(text)) {
      missingContent.push(text);
    }
  });
  
  return {
    isValid: missingContent.length === 0,
    missingContent
  };
}

// יצירת HTML ידידותי לגימייל עם תוכן זהה לדף הנחיתה
export function generatePrayerLandingEmailHTML(): string {
  const content = prayerLandingContent;
  const publicLandingUrl = "https://coach.ruthprissman.co.il/prayer-landing";

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.meta.title}</title>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Tahoma', Arial, Helvetica, sans-serif;
      direction: rtl;
      background-color: #ffffff;
      line-height: 1.6;
      color: #333333;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
      width: 100%;
    }
    td {
      padding: 0;
      vertical-align: top;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }
    .wrapper {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .purple-deep {
      background-color: #3d4a5c;
    }
    .purple-text {
      color: #3d4a5c;
    }
    .pink-vibrant {
      background-color: #e91e63;
    }
    .bg-gray {
      background-color: #f9fafb;
    }
    .bg-blue-soft {
      background-color: #dbeafe;
    }
    .text-white {
      color: #ffffff;
    }
    .text-red {
      color: #ef4444;
    }
    .hero-overlay {
      background: linear-gradient(135deg, rgba(16, 37, 58, 0.65), rgba(30, 20, 60, 0.7));
    }
  </style>
</head>
<body>
  <table class="wrapper">
    <!-- Top Bar -->
    <tr>
      <td class="purple-deep" style="padding: 12px 16px; text-align: center;">
        <p style="margin: 0; color: #ffffff; font-weight: bold; font-size: 14px; line-height: 1.25;">
          ${content.topBar.text}
        </p>
      </td>
    </tr>

    <!-- Hero Section with Background Image -->
    <tr>
      <td style="position: relative;">
        <table style="width: 100%; position: relative;">
          <tr>
            <td style="position: relative;">
              <img src="${content.hero.heroImageUrl}" alt="סדנת תפילה" style="width: 600px; height: auto; display: block; margin: 0 auto;" />
              
              <!-- Hero Content Overlay -->
              <table style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%;">
                <tr>
                  <td class="hero-overlay" style="padding: 48px 16px; text-align: center; vertical-align: middle;">
                    <table style="margin: 0 auto; max-width: 500px;">
                      <tr>
                        <td style="text-align: center;">
                          <h1 style="margin: 0 0 24px 0; color: #ffffff; font-size: 20px; line-height: 1.4; font-weight: 300;">
                            <span style="display: block; margin-bottom: 8px;">${content.hero.titleLine1}</span>
                            <span style="display: block; margin-bottom: 8px; font-size: 16px;">${content.hero.titleLine2}</span>
                            <span style="display: block; margin-bottom: 8px;">${content.hero.titleLine3}</span>
                            <span style="display: block; font-size: 16px;">${content.hero.titleLine4}</span>
                          </h1>
                          
                          ${content.hero.description.map(desc => 
                            `<p style="margin: 0 0 12px 0; color: #ffffff; font-size: 16px; line-height: 1.6; font-weight: 300;">${desc}</p>`
                          ).join('')}
                          
                          <!-- CTA Button -->
                          <table style="margin: 32px auto 0 auto;">
                            <tr>
                              <td style="text-align: center;">
                                <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px;">
                                  ${content.hero.cta}
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Empathy Section -->
    <tr>
      <td class="bg-gray" style="padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 32px 0; text-align: center; font-weight: bold; font-size: 20px; line-height: 1.4; color: #3d4a5c;">
                ${content.empathy.title}
              </h2>
              
              ${content.empathy.items.map(item => `
                <table style="margin-bottom: 16px; background-color: #ffffff; border-radius: 8px; width: 100%;">
                  <tr>
                    <td style="padding: 12px 16px;">
                      <table>
                        <tr>
                          <td style="width: 30px; vertical-align: top; padding-top: 4px;">
                            <span style="color: #ef4444; font-size: 20px;">❌</span>
                          </td>
                          <td style="vertical-align: top;">
                            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                              ${item}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `).join('')}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Hope Section -->
    <tr>
      <td class="bg-blue-soft" style="padding: 64px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td style="text-align: center;">
              <h2 style="margin: 0 0 32px 0; font-weight: bold; font-size: 24px; line-height: 1.4; color: #3d4a5c;">
                ${content.hope.title}
              </h2>
              
              ${content.hope.description.map(desc => 
                `<p style="margin: 0 0 16px 0; font-size: 18px; line-height: 1.6; color: #3d4a5c;">${desc}</p>`
              ).join('')}
              
              <!-- Final CTA -->
              <table style="margin: 32px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px;">
                      לחצי כאן להרשמה לסדנה החינמית
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 32px 16px; text-align: center; background-color: #f9fafb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          רות פריסמן - מאמנת אישית ומנטורית לנשים<br>
          <a href="${publicLandingUrl}" style="color: #3d4a5c; text-decoration: none;">קישור לדף הנחיתה המלא</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}