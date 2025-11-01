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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%);
      color: #2d1810;
      line-height: 1.7;
      padding: 20px;
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
      background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .header p {
      font-size: 18px;
      opacity: 0.95;
      margin-bottom: 8px;
    }
    .content {
      padding: 40px 30px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 24px;
      font-weight: bold;
      color: #8B4513;
      margin-bottom: 20px;
      text-align: center;
    }
    .section-subtitle {
      font-size: 18px;
      color: #5a4a3a;
      margin-bottom: 20px;
      text-align: center;
    }
    .items-list {
      background: #faf8f5;
      border-radius: 12px;
      padding: 24px;
    }
    .item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      border-right: 4px solid #D2691E;
    }
    .item:last-child {
      margin-bottom: 0;
    }
    .item-icon {
      font-size: 24px;
      margin-left: 12px;
      flex-shrink: 0;
    }
    .item-content {
      flex: 1;
    }
    .item-title {
      font-weight: bold;
      font-size: 18px;
      color: #8B4513;
      margin-bottom: 4px;
    }
    .item-text {
      font-size: 16px;
      color: #4a4a4a;
      line-height: 1.6;
    }
    .benefits-grid {
      display: grid;
      gap: 20px;
      margin-top: 24px;
    }
    .benefit-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      border: 2px solid #D2691E;
      text-align: center;
    }
    .benefit-icon {
      font-size: 36px;
      margin-bottom: 12px;
    }
    .benefit-title {
      font-weight: bold;
      font-size: 18px;
      color: #8B4513;
      margin-bottom: 8px;
    }
    .benefit-description {
      font-size: 15px;
      color: #5a4a3a;
      line-height: 1.6;
    }
    .author-section {
      background: #faf8f5;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
    }
    .author-name {
      font-size: 22px;
      font-weight: bold;
      color: #8B4513;
      margin-bottom: 16px;
    }
    .author-text {
      font-size: 16px;
      color: #4a4a4a;
      line-height: 1.7;
      margin-bottom: 12px;
    }
    .cta-section {
      text-align: center;
      padding: 40px 30px;
      background: linear-gradient(135deg, #f5f0e8 0%, #e8dcc8 100%);
      margin: 40px -30px -40px -30px;
      border-radius: 0 0 16px 16px;
    }
    .cta-title {
      font-size: 26px;
      font-weight: bold;
      color: #8B4513;
      margin-bottom: 12px;
    }
    .cta-subtitle {
      font-size: 18px;
      color: #5a4a3a;
      margin-bottom: 24px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #D2691E 0%, #8B4513 100%);
      color: white;
      padding: 18px 40px;
      font-size: 20px;
      font-weight: bold;
      text-decoration: none;
      border-radius: 50px;
      box-shadow: 0 6px 20px rgba(139, 69, 19, 0.3);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(139, 69, 19, 0.4);
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
        font-size: 18px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>${prayerGuideLandingContent.hero.title}</h1>
      <p>${prayerGuideLandingContent.hero.subtitle}</p>
      <p style="font-size: 16px; margin-top: 16px;">${prayerGuideLandingContent.hero.description}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Problem Section -->
      <div class="section">
        <h2 class="section-title">${prayerGuideLandingContent.problem.title}</h2>
        <p class="section-subtitle">${prayerGuideLandingContent.problem.subtitle}</p>
        <div class="items-list">
          ${prayerGuideLandingContent.problem.items.map(item => `
            <div class="item">
              <div class="item-icon">💭</div>
              <div class="item-content">
                <div class="item-text">${item}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Solution Section -->
      <div class="section">
        <h2 class="section-title">${prayerGuideLandingContent.solution.title}</h2>
        <div class="benefits-grid">
          ${prayerGuideLandingContent.solution.items.map(item => `
            <div class="benefit-card">
              <div class="benefit-icon">${item.icon}</div>
              <div class="benefit-title">${item.title}</div>
              <div class="benefit-description">${item.description}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Author Section -->
      <div class="section">
        <h2 class="section-title">${prayerGuideLandingContent.author.title}</h2>
        <div class="author-section">
          <div class="author-name">${prayerGuideLandingContent.author.name}</div>
          ${prayerGuideLandingContent.author.description.map(paragraph => `
            <p class="author-text">${paragraph}</p>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="cta-section">
      <div class="cta-title">${prayerGuideLandingContent.finalCta.title}</div>
      <div class="cta-subtitle">${prayerGuideLandingContent.finalCta.subtitle}</div>
      <a href="${publicLandingUrl}" class="cta-button">
        ${prayerGuideLandingContent.finalCta.cta}
      </a>
    </div>

    <!-- Footer -->
    <div class="footer">
      ${prayerGuideLandingContent.footer.text}
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function verifyPrayerGuideEmailContent(generatedHtml: string): { isValid: boolean; missingContent: string[] } {
  const requiredTexts = [
    prayerGuideLandingContent.hero.title,
    prayerGuideLandingContent.hero.subtitle,
    prayerGuideLandingContent.problem.title,
    prayerGuideLandingContent.solution.title,
    prayerGuideLandingContent.author.title,
    prayerGuideLandingContent.author.name,
    prayerGuideLandingContent.finalCta.title
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
