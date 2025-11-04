import { prayerGuideLandingContent } from '@/content/landing/prayerGuide';

export function generatePrayerGuideEmailHTML(): string {
  const publicLandingUrl = `https://coach.ruthprissman.co.il${prayerGuideLandingContent.publicPath}`;
  
  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${prayerGuideLandingContent.meta.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Heebo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%);
      color: #4A5568;
      line-height: 1.8;
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #52327D 0%, #8C4FB9 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .header::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url('https://coach.ruthprissman.co.il/assets/pearl-hero-bg.png');
      background-size: cover;
      background-position: center;
      opacity: 0.15;
    }
    .header-content {
      position: relative;
      z-index: 1;
    }
    .header h1 {
      font-family: 'Alef', 'Heebo', sans-serif;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .header p {
      font-size: 17px;
      opacity: 0.95;
      line-height: 1.7;
    }
    .content {
      padding: 40px 30px;
      direction: rtl;
    }
    .section {
      margin-bottom: 40px;
      direction: rtl;
    }
    .section-title {
      font-family: 'Alef', 'Heebo', sans-serif;
      font-size: 24px;
      font-weight: bold;
      color: #52327D;
      margin-bottom: 20px;
      line-height: 1.4;
      text-align: right;
    }
    .pain-questions {
      background: #faf8f5;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .pain-question {
      display: flex;
      align-items: start;
      margin-bottom: 12px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      border-right: 3px solid #5FA6A6;
      direction: rtl;
    }
    .pain-question:last-child {
      margin-bottom: 0;
    }
    .pain-icon {
      font-size: 20px;
      margin-right: 12px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .pain-text {
      font-size: 15px;
      color: #4a4a4a;
      line-height: 1.6;
      text-align: right;
    }
    .guide-intro {
      font-weight: 600;
      color: #52327D;
      font-size: 16px;
      margin-bottom: 12px;
      text-align: right;
    }
    .guide-description {
      font-weight: 500;
      margin-bottom: 16px;
      font-size: 15px;
      text-align: right;
    }
    .guide-features {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .guide-feature {
      display: flex;
      align-items: start;
      margin-bottom: 10px;
      font-size: 15px;
      text-align: right;
      direction: rtl;
    }
    .guide-feature:last-child {
      margin-bottom: 0;
    }
    .feature-icon {
      color: #5FA6A6;
      font-size: 18px;
      margin-right: 10px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .weekly-content {
      font-size: 15px;
      line-height: 1.7;
      margin-top: 16px;
      text-align: right;
    }
    .weekly-content p {
      margin-bottom: 8px;
      text-align: right;
    }
    .benefits-grid {
      display: grid;
      gap: 20px;
      margin-top: 24px;
    }
    .benefit-card {
      background: #faf8f5;
      padding: 24px;
      border-radius: 12px;
      border: 2px solid rgba(82, 50, 125, 0.1);
      text-align: right;
    }
    .benefit-icon {
      font-size: 36px;
      margin-bottom: 12px;
      color: #5FA6A6;
      text-align: center;
    }
    .benefit-title {
      font-family: 'Alef', 'Heebo', sans-serif;
      font-weight: bold;
      font-size: 18px;
      color: #52327D;
      margin-bottom: 10px;
      text-align: right;
    }
    .benefit-description {
      font-size: 15px;
      color: #4A5568;
      line-height: 1.7;
      white-space: pre-line;
      text-align: right;
    }
    .author-section {
      background: linear-gradient(135deg, rgba(82, 50, 125, 0.05) 0%, rgba(95, 166, 166, 0.05) 100%);
      border-radius: 12px;
      padding: 30px;
    }
    .author-title {
      font-family: 'Alef', 'Heebo', sans-serif;
      font-size: 24px;
      font-weight: bold;
      color: #52327D;
      margin-bottom: 8px;
      text-align: center;
    }
    .author-subtitle {
      font-size: 16px;
      color: #4A5568;
      margin-bottom: 20px;
      text-align: center;
    }
    .author-paragraph {
      font-size: 15px;
      color: #4a4a4a;
      line-height: 1.8;
      margin-bottom: 16px;
      text-align: right;
    }
    .author-paragraph:last-of-type {
      margin-bottom: 0;
    }
    .author-paragraph strong {
      color: #52327D;
      font-weight: 600;
    }
    .cta-section {
      text-align: center;
      padding: 40px 30px;
      background: linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%);
      margin: 40px -30px -40px -30px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #8C4FB9 0%, #52327D 100%);
      color: white;
      padding: 18px 40px;
      font-size: 19px;
      font-weight: bold;
      text-decoration: none;
      border-radius: 50px;
      box-shadow: 0 6px 20px rgba(82, 50, 125, 0.3);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(82, 50, 125, 0.4);
    }
    .butterfly-image {
      max-width: 100%;
      height: auto;
      border-radius: 16px;
      margin: 24px 0;
      box-shadow: 0 8px 20px rgba(82, 50, 125, 0.15);
    }
    .footer {
      text-align: center;
      padding: 24px;
      background: #2d1810;
      color: #f5f0e8;
      font-size: 14px;
      margin: 0 -30px -40px -30px;
    }
    @media (max-width: 600px) {
      .header h1 {
        font-size: 24px;
      }
      .header p {
        font-size: 16px;
      }
      .section-title {
        font-size: 22px;
      }
      .content {
        padding: 30px 20px;
      }
      .cta-button {
        padding: 16px 32px;
        font-size: 17px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header" dir="rtl">
      <div class="header-content" dir="rtl">
        <h1 dir="rtl">
          <span dir="rtl">${prayerGuideLandingContent.hero.titleLine1}</span><br />
          <span dir="rtl">${prayerGuideLandingContent.hero.titleLine2}</span><br />
          <span dir="rtl">${prayerGuideLandingContent.hero.titleLine3}</span>
        </h1>
        <p dir="rtl">${prayerGuideLandingContent.hero.description}</p>
      </div>
    </div>

    <!-- Content -->
    <div class="content" dir="rtl">
      <!-- Pain Section -->
      <div class="section" dir="rtl">
        <h2 class="section-title" dir="rtl">${prayerGuideLandingContent.painSection.title}</h2>
        
        <div class="pain-questions" dir="rtl">
          ${prayerGuideLandingContent.painSection.questions.map(q => `
            <div class="pain-question" dir="rtl">
              <div class="pain-icon">💭</div>
              <div class="pain-text" dir="rtl">${q.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
            </div>
          `).join('')}
        </div>

        <p class="guide-intro" dir="rtl">${prayerGuideLandingContent.painSection.guideIntro}</p>
        
        <p class="guide-description" dir="rtl">${prayerGuideLandingContent.painSection.guideDescription}</p>
        
        <div class="guide-features" dir="rtl">
          <div class="guide-feature" dir="rtl">
            <div class="feature-icon">📋</div>
            <div dir="rtl">${prayerGuideLandingContent.painSection.guideFeatures[0]}</div>
          </div>
          <div class="guide-feature" dir="rtl">
            <div class="feature-icon">💡</div>
            <div dir="rtl">${prayerGuideLandingContent.painSection.guideFeatures[1]}</div>
          </div>
          <div class="guide-feature" dir="rtl">
            <div class="feature-icon">🛡️</div>
            <div dir="rtl">${prayerGuideLandingContent.painSection.guideFeatures[2]}</div>
          </div>
        </div>

        <div class="weekly-content" dir="rtl">
          ${prayerGuideLandingContent.painSection.weeklyContent.map(p => `<p dir="rtl">${p}</p>`).join('')}
        </div>

        <img src="https://coach.ruthprissman.co.il${prayerGuideLandingContent.painSection.butterflyImage}" alt="פרפר - סמל לחופש ושחרור" class="butterfly-image" />
      </div>

      <!-- Benefits Section -->
      <div class="section" dir="rtl">
        <h2 class="section-title" dir="rtl">${prayerGuideLandingContent.benefits.title}</h2>
        <div class="benefits-grid" dir="rtl">
          ${prayerGuideLandingContent.benefits.items.map((benefit, index) => {
            const icons = ['📄', '✉️', '👥'];
            return `
            <div class="benefit-card" dir="rtl">
              <div class="benefit-icon">${icons[index]}</div>
              <div class="benefit-title" dir="rtl">${benefit.title}</div>
              <div class="benefit-description" dir="rtl">${benefit.description}</div>
            </div>
          `}).join('')}
        </div>
      </div>

      <!-- Author Section -->
      <div class="section" dir="rtl">
        <div class="author-section" dir="rtl">
          <div class="author-title" dir="rtl">${prayerGuideLandingContent.author.title}</div>
          <div class="author-subtitle" dir="rtl">${prayerGuideLandingContent.author.subtitle}</div>
          ${prayerGuideLandingContent.author.paragraphs.map(p => `
            <p class="author-paragraph" dir="rtl">${p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="cta-section">
      <a href="${publicLandingUrl}" class="cta-button">
        ${prayerGuideLandingContent.hero.cta} ←
      </a>
    </div>

    <!-- Footer -->
    <div class="footer" dir="rtl">
      ${prayerGuideLandingContent.footer.text}
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function verifyPrayerGuideEmailContent(generatedHtml: string): { isValid: boolean; missingContent: string[] } {
  const requiredTexts = [
    prayerGuideLandingContent.hero.titleLine1,
    prayerGuideLandingContent.hero.titleLine2,
    prayerGuideLandingContent.painSection.title,
    prayerGuideLandingContent.benefits.title,
    prayerGuideLandingContent.author.title,
    prayerGuideLandingContent.author.subtitle
  ];

  const missingContent: string[] = [];
  
  for (const text of requiredTexts) {
    if (!generatedHtml.includes(text)) {
      missingContent.push(text);
    }
  }

  return {
    isValid: missingContent.length === 0,
    missingContent
  };
}
