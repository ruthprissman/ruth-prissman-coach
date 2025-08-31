export const generateWorkshopConfirmationHTML = (fullName: string): string => {
  const firstName = fullName.split(' ')[0];
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>רישום לסדנה אושר - רות פריסמן</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f5ff; color: #333; line-height: 1.6;">
      
      <!-- Header -->
      <table style="width: 100%; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 20px; text-align: center;">
        <tr>
          <td>
            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              🎉 נרשמת בהצלחה!
            </h1>
            <p style="margin: 12px 0 0 0; color: #e9d8fd; font-size: 18px; font-weight: 300;">
              ${firstName ? `${firstName} יקרה,` : 'יקרה,'} אני מחכה לך בסדנה
            </p>
          </td>
        </tr>
      </table>

      <!-- Main Content -->
      <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <tr>
          <td style="padding: 40px 30px;">
            
            <!-- Welcome Message -->
            <div style="text-align: center; margin-bottom: 40px; direction: rtl;">
              <h2 style="margin: 0 0 16px 0; color: #7c3aed; font-size: 24px; font-weight: bold; direction: rtl; text-align: center;">
                חיבורים חדשים למילים מוכרות
              </h2>
              <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.8; direction: rtl; text-align: center;">
                תודה שהרשמת לסדנה החינמית שלי! אני כל כך נרגשת לפגוש אותך ולחלוק איתך כלים עמוקים ומעשיים
                להפוך את התפילה לחוויה משמעותית ומחברת.
              </p>
            </div>

            <!-- Workshop Details -->
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 30px; margin-bottom: 40px; border-left: 4px solid #7c3aed; direction: rtl;">
              <h3 style="margin: 0 0 20px 0; color: #7c3aed; font-size: 20px; font-weight: bold; text-align: center; direction: rtl;">
                פרטי הסדנה 📅
              </h3>
              
              <div style="display: flex; flex-direction: column; gap: 16px; direction: rtl;">
                <div style="display: flex; align-items: center; gap: 12px; direction: rtl; justify-content: flex-start;">
                  <span style="background: #7c3aed; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">📅</span>
                  <div style="text-align: right; flex: 1;">
                    <strong style="color: #333; font-size: 16px;">תאריך:</strong>
                    <span style="color: #666; margin-left: 8px;">יום ראשון כא׳ אלול • 14.9.25</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px; direction: rtl; justify-content: flex-start;">
                  <span style="background: #d97706; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">⏰</span>
                  <div style="text-align: right; flex: 1;">
                    <strong style="color: #333; font-size: 16px;">שעה:</strong>
                    <span style="color: #666; margin-left: 8px;">21:30</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px; direction: rtl; justify-content: flex-start;">
                  <span style="background: #059669; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">💻</span>
                  <div style="text-align: right; flex: 1;">
                    <strong style="color: #333; font-size: 16px;">פלטפורמה:</strong>
                    <span style="color: #666; margin-left: 8px;">זום</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px; direction: rtl; justify-content: flex-start;">
                  <span style="background: #dc2626; color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">⏱️</span>
                  <div style="text-align: right; flex: 1;">
                    <strong style="color: #333; font-size: 16px;">משך:</strong>
                    <span style="color: #666; margin-left: 8px;">שעתיים</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Important Note -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-radius: 12px; padding: 24px; margin-bottom: 40px; text-align: center; border: 2px solid #f59e0b; direction: rtl;">
              <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px; font-weight: bold; direction: rtl;">
                חשוב לדעת 📧
              </h4>
              <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.6; direction: rtl;">
                לינק הזום לסדנה יישלח אלייך במייל נפרד 
                <strong>24 שעות לפני הסדנה</strong>
              </p>
            </div>

            <!-- What to Expect -->
            <div style="margin-bottom: 40px; direction: rtl;">
              <h3 style="margin: 0 0 20px 0; color: #7c3aed; font-size: 20px; font-weight: bold; text-align: center; direction: rtl;">
                מה מחכה לך בסדנה 💜
              </h3>
              
              <div style="display: flex; flex-direction: column; gap: 16px; direction: rtl;">
                <div style="display: flex; align-items: start; gap: 12px; direction: rtl;">
                  <span style="color: #7c3aed; font-size: 20px; margin-top: 2px;">✨</span>
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6; text-align: right;">
                    <strong>פרשנויות מרענות</strong> למילות התפילה שיחזירו להן את הקסם והמשמעות
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; gap: 12px; direction: rtl;">
                  <span style="color: #d97706; font-size: 20px; margin-top: 2px;">🎯</span>
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6; text-align: right;">
                    <strong>כלים יישומיים</strong> שתוכלי להשתמש בהם מיד בתפילות שלך
                  </p>
                </div>
                
                <div style="display: flex; align-items: start; gap: 12px; direction: rtl;">
                  <span style="color: #059669; font-size: 20px; margin-top: 2px;">📖</span>
                  <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6; text-align: right;">
                    <strong>תובנות וגילויים</strong> חדשים שיעשירו את החוויה הרוחנית שלך
                  </p>
                </div>
              </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 30px; direction: rtl;">
              <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; direction: rtl;">
                בינתיים, אשמח שתכירי את התוכן הנוסף שלי:
              </p>
              
              <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
                <a href="https://coach.ruthprissman.co.il/subscribe" 
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 0 8px 8px 0;">
                  📬 הירשמי לרשימת התפוצה
                </a>
                
                <a href="https://coach.ruthprissman.co.il/" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 0 8px 8px 0;">
                  🌟 גלי את כל התוכן באתר
                </a>
              </div>
            </div>

          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table style="width: 100%; background-color: #f8f5ff; padding: 30px 20px; text-align: center;">
        <tr>
          <td>
            <p style="margin: 0 0 12px 0; color: #666; font-size: 16px; font-weight: bold;">
              רות פריסמן - מאמנת רוחנית ומנטורית
            </p>
            <p style="margin: 0 0 16px 0; color: #888; font-size: 14px;">
              📧 ruth@ruthprissman.co.il • 📱 055-6620273
            </p>
            <p style="margin: 0; color: #888; font-size: 12px; line-height: 1.5;">
              מייל זה נשלח אליך כי נרשמת לסדנה החינמית שלי.<br>
              לכל שאלה או בקשה להסרה מהרשימה, פני אליי במייל או בטלפון.
            </p>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};