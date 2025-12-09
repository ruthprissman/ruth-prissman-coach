import { prePrayContent } from '@/content/landing/prePray';

// יצירת HTML ידידותי לגימייל עם תוכן מלא מדף הנחיתה דקה לפני העמידה
// הצבעים מותאמים לנראות דף הנחיתה המקורי
export function generatePrePrayEmailHTML(): string {
  const content = prePrayContent;
  const publicLandingUrl = "https://coach.ruthprissman.co.il/pre-pray";

  // צבעים מדויקים מדף הנחיתה
  const colors = {
    purpleDarkest: '#4A148C',
    purpleDark: '#6E59A5',
    purpleLight: '#7E69AB',
    turquoise: '#5FA6A6',
    turquoiseHover: '#4a8585',
    gold: '#d4af37',
    background: '#f8f7ff',
    white: '#ffffff',
    textPrimary: '#1f2937',
    textSecondary: '#4a4a6a',
  };

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.meta.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&family=Heebo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Heebo', 'Tahoma', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      background-color: ${colors.background};
      line-height: 1.6;
      color: ${colors.textPrimary};
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
      width: 100%;
    }
    td {
      padding: 0;
      vertical-align: top;
      text-align: right;
      direction: rtl;
    }
    p {
      text-align: right;
      direction: rtl;
      unicode-bidi: plaintext;
    }
    .text-center, .text-center p {
      text-align: center;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }
    .wrapper {
      width: 100%;
      margin: 0 auto;
      background-color: ${colors.white};
      direction: rtl;
    }
    @media screen and (min-width: 600px) {
      .wrapper {
        max-width: 800px;
      }
    }
    .font-alef {
      font-family: 'Alef', Arial, sans-serif;
    }
    .font-heebo {
      font-family: 'Heebo', Arial, sans-serif;
    }
  </style>
</head>
<body style="background-color: ${colors.background};">
  <table class="wrapper" dir="rtl" align="center" style="background-color: ${colors.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(74, 20, 140, 0.1);">
    <!-- Hero Section - סגול מדורג -->
    <tr>
      <td style="background: linear-gradient(135deg, ${colors.purpleDarkest} 0%, ${colors.purpleDark} 50%, ${colors.purpleLight} 100%); padding: 50px 24px; text-align: center;">
        <table style="margin: 0 auto; max-width: 550px;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.85); font-size: 17px; line-height: 1.7; font-family: 'Heebo', Arial, sans-serif;">
                ${content.hero.introText}
              </p>
              
              <h1 style="margin: 0 0 20px 0; color: ${colors.white}; font-size: 30px; line-height: 1.4; font-weight: bold; font-family: 'Alef', Arial, sans-serif;">
                התפילה שלך היא מטלה או מתנה?
              </h1>
              
              <p style="margin: 0 0 30px 0; color: rgba(255,255,255,0.95); font-size: 18px; line-height: 1.8; font-family: 'Heebo', Arial, sans-serif;">
                גלי איך שתי דקות בבוקר יכולות להפוך מילים שנאמרות מעצמן<br/>
                לחוויה מרגשת, משמעותית וממלאת כוח<br/>
                עוד היום.
              </p>
              
              <table style="margin: 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: ${colors.turquoise}; color: ${colors.white}; padding: 16px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px; font-family: 'Alef', Arial, sans-serif; box-shadow: 0 4px 15px rgba(95, 166, 166, 0.4);">
                      ${content.hero.ctaButton} ⬇️
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Pain Section - רקע לבן -->
    <tr>
      <td style="background-color: ${colors.white}; padding: 50px 24px;">
        <table style="margin: 0 auto; max-width: 550px;">
          <tr>
            <td>
              <p style="margin: 0 0 30px 0; font-size: 17px; line-height: 1.9; color: ${colors.textPrimary}; white-space: pre-line; text-align: center; font-family: 'Heebo', Arial, sans-serif;">
${content.pain.intro}
              </p>
              
              ${content.pain.feelings.map(feeling => `
                <table style="margin-bottom: 12px; background-color: ${colors.purpleDarkest}08; border-radius: 12px; width: 100%;">
                  <tr>
                    <td style="padding: 14px 18px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 35px; vertical-align: top; padding-top: 2px;">
                            <span style="color: ${colors.purpleDark}; font-size: 18px;">💭</span>
                          </td>
                          <td style="vertical-align: top;">
                            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: ${colors.textSecondary}; font-family: 'Heebo', Arial, sans-serif;">
                              "${feeling}"
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <p style="margin: 30px 0; font-size: 16px; line-height: 1.9; color: ${colors.textPrimary}; white-space: pre-line; text-align: center; font-family: 'Heebo', Arial, sans-serif;">
${content.pain.closing}
              </p>
              
              <!-- Quote - בורדר זהב -->
              <table style="margin: 30px 0; background: linear-gradient(135deg, ${colors.purpleLight}15 0%, ${colors.turquoise}10 100%); border-radius: 16px; border-right: 4px solid ${colors.gold};">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.8; color: ${colors.purpleDark}; font-style: italic; font-family: 'Alef', Arial, sans-serif;">
                      "${content.pain.quote}"
                    </p>
                  </td>
                </tr>
              </table>
              
              <table style="margin: 30px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: ${colors.turquoise}; color: ${colors.white}; padding: 14px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 17px; font-family: 'Alef', Arial, sans-serif; box-shadow: 0 4px 15px rgba(95, 166, 166, 0.4);">
                      ${content.pain.ctaButton}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Solution Section - רקע טורקיז בהיר -->
    <tr>
      <td style="background: linear-gradient(180deg, ${colors.turquoise}10 0%, ${colors.white} 100%); padding: 50px 24px;">
        <table style="margin: 0 auto; max-width: 550px;">
          <tr>
            <td>
              <p style="margin: 0 0 30px 0; font-size: 17px; line-height: 1.9; color: ${colors.textPrimary}; white-space: pre-line; text-align: center; font-family: 'Heebo', Arial, sans-serif;">
${content.solution.content}
              </p>
              
              ${content.solution.benefits.map(benefit => `
                <table style="margin-bottom: 15px; background-color: ${colors.white}; border-radius: 12px; width: 100%; box-shadow: 0 2px 10px rgba(95, 166, 166, 0.15); border-right: 4px solid ${colors.turquoise};">
                  <tr>
                    <td style="padding: 18px 20px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                            <span style="color: ${colors.turquoise}; font-size: 18px;">✓</span>
                          </td>
                          <td style="vertical-align: top;">
                            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: ${colors.textPrimary}; font-family: 'Heebo', Arial, sans-serif;">
                              ${benefit}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <p style="margin: 35px 0 20px 0; font-size: 22px; font-weight: bold; color: ${colors.purpleDarkest}; text-align: center; font-family: 'Alef', Arial, sans-serif;">
                ${content.solution.closing}
              </p>
              
              <table style="margin: 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: ${colors.turquoise}; color: ${colors.white}; padding: 14px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 17px; font-family: 'Alef', Arial, sans-serif; box-shadow: 0 4px 15px rgba(95, 166, 166, 0.4);">
                      ${content.solution.ctaButton}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- How It Works Section - רקע סגול כהה -->
    <tr>
      <td style="background-color: ${colors.purpleDarkest}; padding: 50px 24px;">
        <table style="margin: 0 auto; max-width: 550px;">
          <tr>
            <td>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.9; color: rgba(255,255,255,0.9); white-space: pre-line; text-align: center; font-family: 'Heebo', Arial, sans-serif;">
${content.howItWorks.intro}
              </p>
              
              <!-- Secret Box -->
              <table style="margin: 0 0 30px 0; background-color: rgba(255,255,255,0.1); border-radius: 16px; width: 100%;">
                <tr>
                  <td style="padding: 30px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 22px; font-weight: bold; color: ${colors.gold}; text-align: center; font-family: 'Alef', Arial, sans-serif;">
                      🔑 ${content.howItWorks.secret.title}
                    </h3>
                    
                    <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.9); text-align: center; font-family: 'Heebo', Arial, sans-serif;">
                      ${content.howItWorks.secret.content}
                    </p>
                    
                    ${content.howItWorks.secret.steps.map((step, index) => `
                      <table style="margin-bottom: 15px; background-color: rgba(255,255,255,0.1); border-radius: 12px; width: 100%;">
                        <tr>
                          <td style="padding: 18px;">
                            <table style="width: 100%;">
                              <tr>
                                <td style="width: 45px; vertical-align: top; padding-left: 15px;">
                                  <table style="width: 32px; height: 32px; background-color: ${colors.turquoise}; border-radius: 50%;">
                                    <tr>
                                      <td style="text-align: center; vertical-align: middle;">
                                        <span style="color: ${colors.white}; font-size: 16px; font-weight: bold; font-family: 'Alef', Arial, sans-serif;">${index + 1}</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                                <td style="vertical-align: top;">
                                  <h4 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: ${colors.white}; font-family: 'Alef', Arial, sans-serif;">
                                    ${step.title}
                                  </h4>
                                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.85); font-family: 'Heebo', Arial, sans-serif;">
                                    ${step.content}
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
              
              <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.9); text-align: center; font-family: 'Heebo', Arial, sans-serif;">
                ${content.howItWorks.closing}
              </p>
              
              <table style="margin: 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: ${colors.turquoise}; color: ${colors.white}; padding: 14px 35px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 17px; font-family: 'Alef', Arial, sans-serif; box-shadow: 0 4px 15px rgba(95, 166, 166, 0.4);">
                      ${content.howItWorks.ctaButton}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Process Section - רקע לבן -->
    <tr>
      <td style="background-color: ${colors.white}; padding: 50px 24px;">
        <table style="margin: 0 auto; max-width: 550px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 35px 0; text-align: center; font-weight: bold; font-size: 28px; color: ${colors.purpleDarkest}; font-family: 'Alef', Arial, sans-serif;">
                ${content.process.title}
              </h2>
              
              ${content.process.steps.map(step => `
                <table style="margin-bottom: 20px; background: linear-gradient(135deg, ${colors.purpleLight}10 0%, ${colors.turquoise}08 100%); border-radius: 16px; border-right: 4px solid ${colors.turquoise}; width: 100%;">
                  <tr>
                    <td style="padding: 25px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 55px; vertical-align: top; padding-left: 15px;">
                            <table style="width: 40px; height: 40px; background: linear-gradient(135deg, ${colors.purpleDark}, ${colors.turquoise}); border-radius: 50%;">
                              <tr>
                                <td style="text-align: center; vertical-align: middle;">
                                  <span style="color: ${colors.white}; font-size: 18px; font-weight: bold; font-family: 'Alef', Arial, sans-serif;">${step.number}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: ${colors.purpleDarkest}; font-family: 'Alef', Arial, sans-serif;">
                              ${step.title}
                            </h4>
                            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: ${colors.textSecondary}; font-family: 'Heebo', Arial, sans-serif;">
                              ${step.content}
                            </p>
                            ${step.quote ? `
                              <table style="margin-top: 15px; background-color: ${colors.gold}10; border-radius: 10px; border-right: 3px solid ${colors.gold}; width: 100%;">
                                <tr>
                                  <td style="padding: 15px;">
                                    <p style="margin: 0; font-size: 13px; line-height: 1.7; color: ${colors.purpleDark}; font-style: italic; font-family: 'Alef', Arial, sans-serif;">
                                      "${step.quote}"
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            ` : ''}
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

    <!-- Offer Section - רקע טורקיז -->
    <tr>
      <td style="background: linear-gradient(135deg, ${colors.turquoise} 0%, ${colors.turquoiseHover} 100%); padding: 50px 24px;">
        <table style="margin: 0 auto; max-width: 550px;">
          <tr>
            <td>
              <p style="margin: 0 0 30px 0; text-align: center; font-size: 17px; line-height: 1.8; color: ${colors.white}; font-family: 'Heebo', Arial, sans-serif;">
                ${content.offer.intro}
              </p>
              
              ${content.offer.items.map(item => `
                <table style="margin-bottom: 15px; background-color: rgba(255,255,255,0.95); border-radius: 12px; width: 100%;">
                  <tr>
                    <td style="padding: 20px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 8px 0; font-size: 17px; font-weight: bold; color: ${colors.purpleDarkest}; font-family: 'Alef', Arial, sans-serif;">
                              ✨ ${item.title}
                            </h4>
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${colors.textSecondary}; font-family: 'Heebo', Arial, sans-serif;">
                              ${item.description}
                            </p>
                          </td>
                          <td style="vertical-align: top; text-align: left; white-space: nowrap; padding-right: 15px; width: 80px;">
                            <span style="font-size: 16px; font-weight: bold; color: ${colors.turquoise}; font-family: 'Alef', Arial, sans-serif;">
                              ${item.value}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <!-- Price Box -->
              <table style="margin-top: 30px; background-color: ${colors.white}; border-radius: 16px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: ${colors.textSecondary}; font-family: 'Heebo', Arial, sans-serif;">
                      שווי מלא: <span style="text-decoration: line-through;">${content.offer.totalValue}</span>
                    </p>
                    <p style="margin: 0 0 15px 0; font-size: 16px; color: ${colors.textPrimary}; font-family: 'Heebo', Arial, sans-serif;">
                      ${content.offer.priceLabel}
                    </p>
                    <p style="margin: 0 0 25px 0; font-size: 42px; font-weight: bold; color: ${colors.turquoise}; font-family: 'Alef', Arial, sans-serif;">
                      ${content.offer.specialPrice}
                    </p>
                    <a href="${publicLandingUrl}" style="display: inline-block; background: linear-gradient(135deg, ${colors.purpleDarkest}, ${colors.purpleDark}); color: ${colors.white}; padding: 18px 45px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px; font-family: 'Alef', Arial, sans-serif; box-shadow: 0 4px 20px rgba(74, 20, 140, 0.4);">
                      ${content.offer.ctaButton}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FAQ Section - רקע לבן -->
    <tr>
      <td style="background-color: ${colors.white}; padding: 50px 24px;">
        <table style="margin: 0 auto; max-width: 550px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 10px 0; text-align: center; font-weight: bold; font-size: 26px; color: ${colors.purpleDarkest}; font-family: 'Alef', Arial, sans-serif;">
                ${content.faq.title}
              </h2>
              <p style="margin: 0 0 35px 0; text-align: center; font-size: 16px; color: ${colors.textSecondary}; font-family: 'Heebo', Arial, sans-serif;">
                ${content.faq.subtitle}
              </p>
              
              ${content.faq.items.map(item => `
                <table style="margin-bottom: 20px; background: linear-gradient(135deg, ${colors.purpleLight}08 0%, ${colors.turquoise}05 100%); border-radius: 12px; border: 1px solid ${colors.purpleLight}20; width: 100%;">
                  <tr>
                    <td style="padding: 25px;">
                      <h4 style="margin: 0 0 12px 0; font-size: 17px; font-weight: bold; color: ${colors.purpleDarkest}; font-family: 'Alef', Arial, sans-serif;">
                        💬 ${item.question}
                      </h4>
                      <p style="margin: 0; font-size: 15px; line-height: 1.8; color: ${colors.textSecondary}; font-family: 'Heebo', Arial, sans-serif;">
                        ${item.answer}
                      </p>
                    </td>
                  </tr>
                </table>
              `).join('')}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Final CTA Section - רקע סגול מדורג -->
    <tr>
      <td style="background: linear-gradient(135deg, ${colors.purpleDarkest} 0%, ${colors.purpleDark} 100%); padding: 50px 24px;">
        <table style="margin: 0 auto; max-width: 550px;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0 0 30px 0; font-size: 17px; line-height: 1.9; color: rgba(255,255,255,0.95); white-space: pre-line; font-family: 'Heebo', Arial, sans-serif;">
${content.finalCta.content}
              </p>
              
              <a href="${publicLandingUrl}" style="display: inline-block; background-color: ${colors.turquoise}; color: ${colors.white}; padding: 18px 45px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px; font-family: 'Alef', Arial, sans-serif; box-shadow: 0 4px 20px rgba(95, 166, 166, 0.5);">
                ${content.finalCta.ctaButton}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: ${colors.purpleDarkest}; padding: 30px 24px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.7); font-family: 'Heebo', Arial, sans-serif; text-align: center;">
          רות פריסמן | מאמנת רגשית ומומחית NLP
        </p>
        <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.5); font-family: 'Heebo', Arial, sans-serif; text-align: center;">
          📧 ruth@ruthprissman.co.il | 📱 055-6620273
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}
