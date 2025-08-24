import { prayerLandingContent } from '@/content/landing/prayer';

// פונקציה לוידוא התאמת תוכן מילה במילה
export function verifyExactMatch(generatedHtml: string): { isValid: boolean; missingContent: string[] } {
  const content = prayerLandingContent;
  const missingContent: string[] = [];
  
  // בדיקת כל הכותרות והתיאורים מכל הסעיפים
  const textFieldsToCheck = [
    content.topBar.text,
    content.hero.titleLine1,
    content.hero.titleLine2,
    content.hero.titleLine3,
    content.hero.titleLine4,
    content.hero.cta,
    content.empathy.title,
    content.hope.title,
    content.hope.cta,
    content.visualization.title,
    content.visualization.cta,
    content.testimonials.title,
    content.method.title,
    content.offer.title,
    content.offer.cta,
    content.comparison.title,
    content.comparison.cta,
    content.finalCta.title,
    content.finalCta.cta,
    content.registration.title,
    content.registration.supportNote,
    content.footer.text,
    ...content.hero.description,
    ...content.empathy.items,
    ...content.hope.description,
    ...content.hope.benefits,
    ...content.visualization.content,
    ...content.testimonials.items,
    ...content.method.steps.flatMap(step => [step.title, ...step.description]),
    ...content.offer.items.map(item => item.text),
    ...content.comparison.whatWeDo.items,
    ...content.comparison.yourResult.items,
    ...content.finalCta.subtitle
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

// יצירת HTML ידידותי לגימייל עם תוכן מלא מדף הנחיתה
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
    @media screen and (min-width: 768px) {
      .wrapper {
        max-width: 1000px;
      }
    }
    .purple-deep { background-color: #3d4a5c; }
    .purple-text { color: #3d4a5c; }
    .pink-vibrant { background-color: #e91e63; }
    .bg-gray { background-color: #f9fafb; }
    .bg-blue-soft { background-color: #dbeafe; }
    .bg-blue-very-light { background-color: #eff6ff; }
    .text-white { color: #ffffff; }
    .text-red { color: #ef4444; }
    .text-green { color: #10b981; }
    .text-pink { color: #e91e63; }
  </style>
</head>
<body>
  <table class="wrapper" dir="rtl" align="right">
    <!-- Top Bar -->
    <tr>
      <td class="purple-deep" style="padding: 12px 16px; text-align: center;">
        <p style="margin: 0; color: #ffffff; font-weight: bold; font-size: 14px; line-height: 1.25;">
          ${content.topBar.text}
        </p>
      </td>
    </tr>

    <!-- Hero Section -->
    <tr>
      <td bgcolor="#2d3748" background="${content.hero.heroImageUrl}" style="background-color:#2d3748; background-image: linear-gradient(135deg, rgba(16, 37, 58, 0.95), rgba(30, 20, 60, 0.95)), url('${content.hero.heroImageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;">
        <!-- Middle layer: nested table for Gmail compatibility -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#2d3748" style="background-color:#2d3748;">
          <tr>
            <td style="padding: 48px 16px; text-align: center;">
              <!-- Inner layer: content wrapper div with dark background fallback -->
              <div style="background-color:#2d3748; margin:0; padding:0;">
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
               </div>
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
                      <table style="width: 100%;">
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
              
              <!-- Benefits -->
              ${content.hope.benefits.map(benefit => `
                <table style="margin-bottom: 16px; background-color: #ffffff; border-radius: 8px; width: 100%;">
                  <tr>
                    <td style="padding: 12px 16px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 30px; vertical-align: top; padding-top: 4px;">
                            <span style="color: #3d4a5c; font-size: 20px;">🌀</span>
                          </td>
                          <td style="vertical-align: top;">
                            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                              ${benefit}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <table style="margin: 32px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px;">
                      ${content.hope.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Visualization Section -->
    <tr>
      <td style="background-color: #ffffff; padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 32px 0; text-align: center; font-weight: bold; font-size: 22px; line-height: 1.4; color: #3d4a5c;">
                ${content.visualization.title}
              </h2>
              
              ${content.visualization.content.map(paragraph => 
                `<p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #1f2937;">${paragraph}</p>`
              ).join('')}
              
              <table style="margin: 32px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px;">
                      ${content.visualization.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Testimonials Section -->
    <tr>
      <td class="bg-blue-very-light" style="padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 32px 0; text-align: center; font-weight: bold; font-size: 22px; line-height: 1.4; color: #3d4a5c;">
                ${content.testimonials.title}
              </h2>
              
              ${content.testimonials.items.map(testimonial => `
                <table style="margin-bottom: 16px; background-color: #ffffff; border-radius: 8px; width: 100%;">
                  <tr>
                    <td style="padding: 16px;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="width: 30px; vertical-align: top; padding-top: 4px;">
                            <span style="color: #60a5fa; font-size: 24px;">"</span>
                          </td>
                          <td style="vertical-align: top;">
                            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                              ${testimonial}
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

    <!-- Method Section -->
    <tr>
      <td style="background-color: #ffffff; padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 32px 0; text-align: center; font-weight: bold; font-size: 22px; line-height: 1.4; color: #3d4a5c;">
                ${content.method.title}
              </h2>
              
              ${content.method.steps.map(step => `
                <table style="margin-bottom: 32px; width: 100%;">
                  <tr>
                    <td style="width: 60px; vertical-align: top; padding-left: 16px;">
                      <table style="width: 48px; height: 48px; background-color: #3d4a5c; border-radius: 50%;">
                        <tr>
                          <td style="text-align: center; vertical-align: middle;">
                            <span style="color: #ffffff; font-size: 20px; font-weight: bold;">${step.number}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="vertical-align: top; padding-right: 16px;">
                      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #3d4a5c;">
                        ${step.title}
                      </h3>
                      ${step.description.map(desc => 
                        `<p style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.6; color: #1f2937;">${desc}</p>`
                      ).join('')}
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
        <table style="margin: 0 auto; max-width: 500px; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="margin: 0 0 32px 0; text-align: center; font-weight: bold; font-size: 22px; line-height: 1.4; color: #3d4a5c;">
                ${content.offer.title}
              </h2>
              
              ${content.offer.items.map(item => `
                <table style="margin-bottom: 16px; width: 100%;">
                  <tr>
                    <td style="width: 30px; vertical-align: top; padding-top: 4px;">
                      <span style="color: #e91e63; font-size: 20px;">★</span>
                    </td>
                    <td style="vertical-align: top;">
                      <p style="margin: 0 0 4px 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                        ${item.text}
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">(שווי: ${item.value})</p>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <table style="margin: 24px 0; padding: 24px 0; border-top: 1px solid #e5e7eb; width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 18px; color: #1f2937;">שווי כולל: ${content.offer.totalValue}</p>
                    <p style="margin: 0 0 24px 0; font-size: 20px; font-weight: bold; color: #e91e63;">
                      המחיר שלך היום: ${content.offer.currentPrice}
                    </p>
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px;">
                      ${content.offer.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Comparison Section -->
    <tr>
      <td style="background-color: #ffffff; padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px; border: 2px solid #e5e7eb; border-radius: 12px;">
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="margin: 0 0 32px 0; text-align: center; font-weight: bold; font-size: 20px; line-height: 1.4; color: #3d4a5c;">
                ${content.comparison.title}
              </h2>
              
              <!-- What We Do -->
              <h3 style="margin: 0 0 16px 0; text-align: center; font-size: 18px; font-weight: bold; color: #3d4a5c;">
                ${content.comparison.whatWeDo.title}
              </h3>
              ${content.comparison.whatWeDo.items.map(item => `
                <table style="margin-bottom: 8px; width: 100%;">
                  <tr>
                    <td style="width: 30px; vertical-align: top; padding-top: 4px;">
                      <span style="color: #10b981; font-size: 16px;">✓</span>
                    </td>
                    <td style="vertical-align: top;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1f2937;">${item}</p>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <!-- Separator -->
              <table style="margin: 24px 0; width: 100%;">
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #e5e7eb;"></td>
                </tr>
              </table>
              
              <!-- Your Result -->
              <h3 style="margin: 0 0 16px 0; text-align: center; font-size: 18px; font-weight: bold; color: #3d4a5c;">
                ${content.comparison.yourResult.title}
              </h3>
              ${content.comparison.yourResult.items.map(item => `
                <table style="margin-bottom: 8px; width: 100%;">
                  <tr>
                    <td style="width: 30px; vertical-align: top; padding-top: 4px;">
                      <span style="color: #e91e63; font-size: 16px;">★</span>
                    </td>
                    <td style="vertical-align: top;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1f2937;">${item}</p>
                    </td>
                  </tr>
                </table>
              `).join('')}
              
              <table style="margin: 32px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px;">
                      ${content.comparison.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Final CTA Section -->
    <tr>
      <td class="pink-vibrant" style="padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px;">
          <tr>
            <td style="text-align: center;">
              ${content.finalCta.subtitle.map(line => 
                `<p style="margin: 0 0 12px 0; color: #ffffff; font-size: 16px; line-height: 1.6;">${line}</p>`
              ).join('')}
              
              <table style="margin: 32px auto 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #ffffff; color: #e91e63; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px; border: 2px solid #ffffff;">
                      ${content.finalCta.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Registration Section -->
    <tr>
      <td class="bg-blue-very-light" style="padding: 48px 16px;">
        <table style="margin: 0 auto; max-width: 500px; background-color: #ffffff; border-radius: 12px;">
          <tr>
            <td style="padding: 32px 24px; text-align: center;">
              <h2 style="margin: 0 0 32px 0; font-weight: bold; font-size: 20px; line-height: 1.4; color: #3d4a5c;">
                ${content.registration.title}
              </h2>
              
              <table style="margin: 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${publicLandingUrl}" style="display: inline-block; background-color: #e91e63; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px;">
                      אני נרשמת עכשיו לסדנה
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 16px; font-weight: bold; color: #1f2937;">
                ${content.registration.supportNote}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 32px 16px; text-align: center; background-color: #f9fafb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          ${content.footer.text}<br>
          <a href="${publicLandingUrl}" style="color: #3d4a5c; text-decoration: none;">קישור לדף הנחיתה המלא</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}