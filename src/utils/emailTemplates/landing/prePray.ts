import { prePrayContent } from '@/content/landing/prePray';

// יצירת HTML ידידותי לגימייל עם תוכן מלא מדף הנחיתה דקה לפני העמידה
export function generatePrePrayEmailHTML(): string {
  const content = prePrayContent;
  const publicLandingUrl = "https://coach.ruthprissman.co.il/pre-pray";

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
      text-align: right;
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
      background-color: #ffffff;
      direction: rtl;
    }
    @media screen and (min-width: 600px) {
      .wrapper {
        max-width: 800px;
      }
    }
    .purple-deep { background-color: #3d4a5c; }
    .purple-text { color: #3d4a5c; }
    .pink-vibrant { background-color: #e91e63; }
    .bg-gray { background-color: #f9fafb; }
    .bg-cream { background-color: #fef7ed; }
    .bg-soft-pink { background-color: #fdf2f8; }
    .text-white { color: #ffffff; }
    .text-red { color: #ef4444; }
    .text-green { color: #10b981; }
    .text-pink { color: #e91e63; }
  </style>
</head>
<body>
  <table class="wrapper" dir="rtl" align="right">
    <!-- Hero Section -->
    <tr>
      <td class="purple-deep" style="padding: 48px 16px; text-align: center;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0 0 16px 0; color: #fbbf24; font-size: 16px; line-height: 1.6;">
                ${content.hero.introText}
              </p>
              
              <h1 style="margin: 0 0 24px 0; color: #ffffff; font-size: 22px; line-height: 1.5; font-weight: bold; white-space: pre-line;">
${content.hero.mainHeading}
              </h1>
              
              <table style="margin: 24px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px;">
                      ${content.hero.ctaButton}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Pain Section -->
    <tr>
      <td class="bg-gray" style="padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.8; color: #1f2937; white-space: pre-line;">
${content.pain.intro}
              </p>
              
              ${content.pain.feelings.map(feeling => `
                <table style="margin-bottom: 12px; background-color: #ffffff; border-radius: 8px; width: 100%;">
                  <tr>
                    <td style="padding: 12px 16px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 30px; vertical-align: top; padding-top: 4px;">
                            <span style="color: #ef4444; font-size: 18px;">❌</span>
                          </td>
                          <td style="vertical-align: top;">
                            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1f2937;">
                              ${feeling}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <p style="margin: 24px 0; font-size: 16px; line-height: 1.8; color: #1f2937; white-space: pre-line;">
${content.pain.closing}
              </p>
              
              <!-- Quote -->
              <table style="margin: 24px 0; background-color: #fef7ed; border-radius: 8px; border-right: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #92400e; font-style: italic;">
                      "${content.pain.quote}"
                    </p>
                  </td>
                </tr>
              </table>
              
              <table style="margin: 24px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
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

    <!-- Solution Section -->
    <tr>
      <td class="bg-soft-pink" style="padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.8; color: #1f2937; white-space: pre-line;">
${content.solution.content}
              </p>
              
              ${content.solution.benefits.map(benefit => `
                <table style="margin-bottom: 12px; background-color: #ffffff; border-radius: 8px; width: 100%;">
                  <tr>
                    <td style="padding: 12px 16px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 30px; vertical-align: top; padding-top: 4px;">
                            <span style="color: #10b981; font-size: 18px;">✓</span>
                          </td>
                          <td style="vertical-align: top;">
                            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1f2937;">
                              ${benefit}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <p style="margin: 24px 0 0 0; font-size: 18px; font-weight: bold; color: #3d4a5c; text-align: center;">
                ${content.solution.closing}
              </p>
              
              <table style="margin: 24px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
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

    <!-- How It Works Section -->
    <tr>
      <td style="background-color: #ffffff; padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.8; color: #1f2937; white-space: pre-line;">
${content.howItWorks.intro}
              </p>
              
              <h3 style="margin: 24px 0 16px 0; font-size: 20px; font-weight: bold; color: #3d4a5c; text-align: center;">
                ${content.howItWorks.secret.title}
              </h3>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.8; color: #1f2937;">
                ${content.howItWorks.secret.content}
              </p>
              
              ${content.howItWorks.secret.steps.map((step, index) => `
                <table style="margin-bottom: 16px; width: 100%;">
                  <tr>
                    <td style="width: 50px; vertical-align: top; padding-left: 12px;">
                      <table style="width: 40px; height: 40px; background-color: #3d4a5c; border-radius: 50%;">
                        <tr>
                          <td style="text-align: center; vertical-align: middle;">
                            <span style="color: #ffffff; font-size: 16px; font-weight: bold;">${index + 1}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="vertical-align: top; padding-right: 12px;">
                      <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #3d4a5c;">
                        ${step.title}
                      </h4>
                      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1f2937;">
                        ${step.content}
                      </p>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <p style="margin: 24px 0; font-size: 16px; line-height: 1.8; color: #1f2937;">
                ${content.howItWorks.closing}
              </p>
              
              <table style="margin: 24px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
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

    <!-- Process Section -->
    <tr>
      <td class="bg-cream" style="padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 32px 0; text-align: center; font-weight: bold; font-size: 24px; color: #3d4a5c;">
                ${content.process.title}
              </h2>
              
              ${content.process.steps.map(step => `
                <table style="margin-bottom: 24px; background-color: #ffffff; border-radius: 12px; width: 100%;">
                  <tr>
                    <td style="padding: 20px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 50px; vertical-align: top; padding-left: 12px;">
                            <table style="width: 40px; height: 40px; background-color: #e91e63; border-radius: 50%;">
                              <tr>
                                <td style="text-align: center; vertical-align: middle;">
                                  <span style="color: #ffffff; font-size: 18px; font-weight: bold;">${step.number}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align: top; padding-right: 12px;">
                            <h4 style="margin: 0 0 8px 0; font-size: 17px; font-weight: bold; color: #3d4a5c;">
                              ${step.title}
                            </h4>
                            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1f2937;">
                              ${step.content}
                            </p>
                            ${step.quote ? `
                              <table style="margin-top: 12px; background-color: #fef7ed; border-radius: 6px; border-right: 3px solid #f59e0b;">
                                <tr>
                                  <td style="padding: 12px;">
                                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #92400e; font-style: italic;">
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

    <!-- Offer Section -->
    <tr>
      <td class="purple-deep" style="padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px; background-color: #ffffff; border-radius: 16px;">
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0 0 24px 0; text-align: center; font-size: 16px; line-height: 1.6; color: #1f2937;">
                ${content.offer.intro}
              </p>
              
              ${content.offer.items.map(item => `
                <table style="margin-bottom: 20px; background-color: #f9fafb; border-radius: 8px; width: 100%;">
                  <tr>
                    <td style="padding: 16px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 30px; vertical-align: top; padding-top: 4px;">
                            <span style="color: #e91e63; font-size: 20px;">★</span>
                          </td>
                          <td style="vertical-align: top;">
                            <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #3d4a5c;">
                              ${item.title}
                            </h4>
                            <p style="margin: 0 0 4px 0; font-size: 14px; line-height: 1.6; color: #1f2937;">
                              ${item.description}
                            </p>
                            <p style="margin: 0; font-size: 13px; color: #6b7280;">(שווי: ${item.value})</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <table style="margin: 24px 0; padding: 24px 0; border-top: 2px solid #e5e7eb; width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; color: #6b7280;">שווי כולל: <span style="text-decoration: line-through;">${content.offer.totalValue}</span></p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">${content.offer.priceLabel}</p>
                    <p style="margin: 0 0 24px 0; font-size: 28px; font-weight: bold; color: #e91e63;">
                      ${content.offer.specialPrice}
                    </p>
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px;">
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

    <!-- FAQ Section -->
    <tr>
      <td style="background-color: #ffffff; padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 8px 0; text-align: center; font-weight: bold; font-size: 22px; color: #3d4a5c;">
                ${content.faq.title}
              </h2>
              <p style="margin: 0 0 32px 0; text-align: center; font-size: 15px; color: #6b7280;">
                ${content.faq.subtitle}
              </p>
              
              ${content.faq.items.map(item => `
                <table style="margin-bottom: 16px; background-color: #f9fafb; border-radius: 8px; width: 100%;">
                  <tr>
                    <td style="padding: 20px;">
                      <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #3d4a5c;">
                        ${item.question}
                      </h4>
                      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #1f2937;">
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

    <!-- Final CTA Section -->
    <tr>
      <td class="bg-soft-pink" style="padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.8; color: #1f2937; white-space: pre-line;">
${content.finalCta.content}
              </p>
              
              <table style="margin: 24px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 20px;">
                      ${content.finalCta.ctaButton}
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
      <td style="background-color: #1f2937; padding: 32px 16px; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">
          רות פריסמן | מאמנת רגשית
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          ruth@ruthprissman.co.il | 055-6620273
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
