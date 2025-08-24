import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Mail, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { verifyExactMatch } from '@/utils/emailTemplates/landing/prayer';

interface LandingPageEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  generateHtml?: () => string;
  defaultSubject?: string;
  pageId?: string;
  pageName?: string;
}

const LandingPageEmailModal: React.FC<LandingPageEmailModalProps> = ({ 
  isOpen, 
  onClose, 
  generateHtml, 
  defaultSubject = 'סדנת תפילה אישית - הזמנה מיוחדת',
  pageId = 'default',
  pageName = 'דף נחיתה'
}) => {
  const [isSending, setIsSending] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isSpecificRecipientsMode, setIsSpecificRecipientsMode] = useState(false);
  const [allSubscribers, setAllSubscribers] = useState<Array<{email: string, firstName?: string}>>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [emailSubject, setEmailSubject] = useState(defaultSubject);
  const { toast } = useToast();
  
  React.useEffect(() => {
    setEmailSubject(defaultSubject);
  }, [defaultSubject]);

  const generateLandingPageHTML = () => {
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>הסוד להפוך תפילה מעוד חובה למילים של חיבור אמיתי - רות פריסמן</title>
</head>
<body style="margin:0; padding:0; font-family:'Tahoma', Arial, Helvetica, sans-serif; direction:rtl;">
  
  <!-- Root wrapper table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;" dir="rtl">
    <tr>
      <td align="right">
        
        <!-- Main container - max 600px -->
        <table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0" border="0" dir="rtl" align="right">
          
          <!-- Top Bar -->
          <tr>
            <td style="background-color:#3b4a5c; padding:12px 16px; text-align:center;">
              <p style="margin:0; color:#ffffff; font-size:14px; font-weight:bold; line-height:20px;">
                מרגישה שהתפילה שלך הפכה לעוד מטלה שצריך לסמן עליה וי?
              </p>
            </td>
          </tr>
          
          <!-- Hero Section with Background -->
          <tr>
             <td bgcolor="#374151" background="https://coach.ruthprissman.co.il/lovable-uploads/04710e22-f223-434b-a8fe-d553816388a5.png" style="background-color:#374151; background-image: linear-gradient(135deg, rgba(16, 37, 58, 0.95), rgba(30, 20, 60, 0.95)), url('https://coach.ruthprissman.co.il/lovable-uploads/04710e22-f223-434b-a8fe-d553816388a5.png'); background-size: cover; background-position: center; background-repeat: no-repeat;">
              <!-- Middle layer: nested table for Gmail compatibility -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#374151" style="background-color:#374151;">
                <tr>
                  <td style="padding: 48px 16px; text-align: center;">
                    <!-- Inner layer: content wrapper div with dark background fallback -->
                    <div style="background-color:#374151; margin:0; padding:0;">
                      
                      <!-- Hero content -->
                      <h1 style="margin:0 0 24px 0; color:#ffffff; font-size:24px; line-height:1.4; font-weight:300;">
                        <span style="display:block; margin-bottom:8px;">הסוד להפוך תפילה מעוד חובה</span>
                        <span style="display:block; margin-bottom:8px; font-size:20px;">(שלא תמיד אנחנו מצליחים למלא),</span>
                        <span style="display:block; margin-bottom:8px;">למילים, לשיחה אמיתית שממלאת אותך בכוח.</span>
                        <span style="display:block; font-size:20px;">גם כשהקטנים מושכים לך בחצאית והראש עמוס במטלות?</span>
                      </h1>
                      
                      <div style="margin-bottom:32px; font-size:16px; line-height:1.6; color:#ffffff;">
                        <p style="margin:0 0 16px 0;">מה אם היית יכולה לפתוח את הסידור בקלות, להרגיש את הלב נפתח?</p>
                        <p style="margin:0 0 16px 0;">לסיים כל תפילה בתחושת רוממות וחיבור, במקום בתחושת אשמה ותסכול.</p>
                        <p style="margin:0;">לגלות איך להכניס את כל החיים שלך, את כל הבלגן והעייפות, אל תוך המילים המוכרות, ולמצוא בהן אור חדש?</p>
                      </div>
                      
                      <!-- CTA Button -->
                      <table align="center" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background-color:#e91e63; border-radius:12px; padding:14px 24px;">
                            <a href="https://coach.ruthprissman.co.il/prayer-landing" style="display:inline-block; color:#ffffff; font-size:18px; line-height:24px; font-weight:700; text-decoration:none;">
                              אני נרשמת לסדנה החינמית עכשיו
                            </a>
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
            <td style="background-color:#f9fafb; padding:48px 16px;">
              
              <h2 style="margin:0 0 32px 0; text-align:center; color:#3b4a5c; font-size:22px; line-height:1.4; font-weight:700;">
                גם לך קורים הדברים האלה סביב התפילה, שמשאירים אותך מרוקנת במקום מלאה?
              </h2>
              
              <!-- Problem points -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background-color:#ffffff; padding:12px; border-radius:8px; border:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:top; padding-top:4px;">
                          <span style="font-size:20px; color:#ef4444;">❌</span>
                        </td>
                         <td style="font-size:16px; line-height:1.6; color:#1f2937; text-align:right; direction:rtl; unicode-bidi:plaintext;">
                          את אומרת את המילים, אבל הראש שלך כבר עסוק ברשימת הקניות, בכביסות ובמה לבשל לצהריים.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background-color:#ffffff; padding:12px; border-radius:8px; border:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:top; padding-top:4px;">
                          <span style="font-size:20px; color:#ef4444;">❌</span>
                        </td>
                        <td style="font-size:16px; line-height:1.6; color:#1f2937;">
                          התפילה הפכה לעוד מטלה ברשימה האינסופית של היום, משהו שצריך רק לסיים ולסמן וי כדי להמשיך הלאה.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background-color:#ffffff; padding:12px; border-radius:8px; border:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:top; padding-top:4px;">
                          <span style="font-size:20px; color:#ef4444;">❌</span>
                        </td>
                        <td style="font-size:16px; line-height:1.6; color:#1f2937;">
                          את פותחת את הסידור ומרגישה ריקנות, לא מצליחה להתחבר למי שמקשיבה בצד השני.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background-color:#ffffff; padding:12px; border-radius:8px; border:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:top; padding-top:4px;">
                          <span style="font-size:20px; color:#ef4444;">❌</span>
                        </td>
                        <td style="font-size:16px; line-height:1.6; color:#1f2937;">
                          את מרגישה אשמה שאת לא מתרגשת, שהתפילה שלך הפכה למכנית, כמו רובוט שמדקלם טקסט.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background-color:#ffffff; padding:12px; border-radius:8px; border:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:top; padding-top:4px;">
                          <span style="font-size:20px; color:#ef4444;">❌</span>
                        </td>
                        <td style="font-size:16px; line-height:1.6; color:#1f2937;">
                          את מתגעגעת לתפילות של פעם, לימים שהתרגשת מכל מילה בלב, ותוהה לאן נעלמה כל ההתלהבות הזאת.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#ffffff; padding:12px; border-radius:8px; border:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:top; padding-top:4px;">
                          <span style="font-size:20px; color:#ef4444;">❌</span>
                        </td>
                        <td style="font-size:16px; line-height:1.6; color:#1f2937;">
                          אולי בכלל את לא מצליחה להתפלל....?
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Hope Section -->
          <tr>
            <td style="background-color:#e8f4fd; padding:48px 16px; text-align:center;">
              
              <h2 style="margin:0 0 32px 0; color:#3b4a5c; font-size:22px; line-height:1.4; font-weight:700;">
                הגיע הזמן לגלות איך להחיות את התפילה שלך, ולהפוך אותה למקור הכוח הגדול ביותר ביום שלך.
              </h2>
              
              <div style="margin-bottom:32px; font-size:16px; line-height:1.6; color:#3b4a5c;">
                <p style="margin:0 0 16px 0;">מתוך עבודה עם נשים כמוך, ומתוך המסע האישי שלי כאישה, כאמא וכמאמנת – גיליתי שיש דרך אחרת. גיליתי שיש דרך אחרת.</p>
                <p style="margin:0 0 16px 0;">דרך שלא דורשת ממך להיות מושלמת או מנותקת מהמציאות.</p>
                <p style="margin:0 0 16px 0;">למדתי, ואני עדיין לומדת, איך להפוך את התפילה לחיה, נושמת ואמיתית.</p>
                <p style="margin:0; font-weight:700;">עזרתי כבר להרבה נשים לגלות מחדש את העוצמה והחיבור שבתפילה,</p>
                <p style="margin:0; font-weight:700;">ואני רוצה להראות גם לך איך לעשות את זה.</p>
              </div>
              
              <!-- Workshop details card -->
              <table align="center" width="100%" style="max-width:400px; background-color:#ffffff; border-radius:12px; border:1px solid #e5e7eb;" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:32px 24px; text-align:center;">
                    
                    <div style="width:64px; height:64px; background-color:#3b4a5c; border-radius:50%; color:#ffffff; margin:0 auto 24px auto; display:table;">
                      <span style="display:table-cell; vertical-align:middle; font-size:24px; font-weight:700; text-align:center;">פרטים</span>
                    </div>
                    
                    <h3 style="margin:0 0 16px 0; color:#3b4a5c; font-size:18px; font-weight:700;">
                      📅 יום ראשון יד' אלול תשפ"ה
                      07.09.2025
                    </h3>
                    
                    <h4 style="margin:0 0 16px 0; color:#3b4a5c; font-size:16px;">
                      🕐 שעה: 21:30-23:30 (שעתיים)
                    </h4>
                    
                    <div style="margin-bottom:24px; font-size:14px; line-height:1.6; color:#3b4a5c;">
                      <p style="margin:0 0 8px 0;">💰 <strong>עלות:</strong> ללא תשלום</p>
                      <p style="margin:0;">📍 <strong>פלטפורמה:</strong> זום</p>
                    </div>
                    
                    <!-- CTA Button -->
                    <table align="center" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#e91e63; border-radius:12px; padding:14px 24px;">
                          <a href="https://coach.ruthprissman.co.il/prayer-landing" style="display:inline-block; color:#ffffff; font-size:16px; line-height:20px; font-weight:700; text-decoration:none;">
                            אני נרשמת לסדנה
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- What You'll Learn Section -->
          <tr>
            <td style="background-color:#ffffff; padding:48px 16px;">
              
              <h2 style="margin:0 0 32px 0; text-align:center; color:#3b4a5c; font-size:22px; line-height:1.4; font-weight:700;">
הנה כל מה שתקבלי מיד עם ההרשמה לסדנה
              </h2>
              
              <!-- Benefit points -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background-color:#f0fdf4; padding:16px; border-radius:8px; border:1px solid #bbf7d0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:top; padding-top:4px;">
                          <span style="font-size:20px; color:#10b981;">✅</span>
                        </td>
                        <td style="font-size:16px; line-height:1.6; color:#1f2937;">
                          <strong>השתתפות מלאה בסדנה חיה "חיבורים חדשים למילים מוכרות</strong> "(שווי: 120 ₪)

                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background-color:#f0fdf4; padding:16px; border-radius:8px; border:1px solid #bbf7d0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:top; padding-top:4px;">
                          <span style="font-size:20px; color:#10b981;">✅</span>
                        </td>
                        <td style="font-size:16px; line-height:1.6; color:#1f2937;">
                          <strong>דפי עבודה וסיכום הסדנה להדפסה</strong> (שווי: 49 ₪)
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#f0fdf4; padding:16px; border-radius:8px; border:1px solid #bbf7d0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:32px; vertical-align:top; padding-top:4px;">
                          <span style="font-size:20px; color:#10b981;">✅</span>
                        </td>
                        <td style="font-size:16px; line-height:1.6; color:#1f2937;">
                          <strong>גישה להקלטת הסדנה למשך 7 ימים</strong>(שווי: 65 ₪)
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#e91e63; border-radius:12px; padding:14px 24px;">
                    <a href="https://coach.ruthprissman.co.il/prayer-landing" style="display:inline-block; color:#ffffff; font-size:18px; line-height:24px; font-weight:700; text-decoration:none;">
                      אני נרשמת לסדנה
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
         
          <!-- Final CTA Section -->
          <tr>
            <td style="background-color:#e8f4fd; padding:48px 16px; text-align:center;">
              
              <h2 style="margin:0 0 24px 0; color:#3b4a5c; font-size:22px; line-height:1.4; font-weight:700;">
                מוכנה להתחיל את המסע לתפילה חיה ומשמעותית?
              </h2>
              
              <p style="margin:0 0 32px 0; color:#3b4a5c; font-size:16px; line-height:1.6;">
                הצטרפי אליי לסדנה חינמית ובואי נגלה יחד איך להחיות את התפילות שלנו
              </p>
              
              <!-- Big CTA Button -->
              <table align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#e91e63; border-radius:12px; padding:20px 32px;">
                    <a href="https://coach.ruthprissman.co.il/prayer-landing" style="display:inline-block; color:#ffffff; font-size:20px; line-height:28px; font-weight:700; text-decoration:none;">
                      אני נרשמת לסדנה עכשיו!
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#374151; padding:32px 16px; text-align:center;">
              
              <p style="margin:0 0 16px 0; color:#9ca3af; font-size:14px; line-height:1.6;">
                שאלות? חסומה? כתבי לי: <a href="mailto:ruth@ruthprissman.co.il" style="color:#60a5fa; text-decoration:none;">ruth@ruthprissman.co.il</a>
              </p>
              
              <p style="margin:0 0 16px 0; color:#9ca3af; font-size:14px; line-height:1.6;">
                או התקשרי: <a href="tel:+972556620273" style="color:#60a5fa; text-decoration:none;">055-6620273</a>
              </p>
       
              
              <div style="font-size:12px; color:#6b7280; line-height:1.5;">
                <p style="margin:0 0 8px 0;">© 2025 רות פריסמן - מאמנת אישית</p>
                <p style="margin:0;">לביטול המנוי <a href="https://coach.ruthprissman.co.il/unsubscribe" style="color:#60a5fa; text-decoration:none;">לחצי כאן</a></p>
              </div>
              
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>`;
  };

  // Use provided HTML generator or fallback to the original function
  const getEmailHTML = () => {
    if (generateHtml) {
      return generateHtml();
    }
    return generateLandingPageHTML();
  };

  const handleSendLandingPageEmail = async () => {
    if (isTestMode && !emailSubject.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא הזיני נושא למייל",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const emailHTML = getEmailHTML();
      
      // בדיקת התאמה מילה במילה אם זה דף התפילה
      if (pageId === 'prayer-workshop' && verifyExactMatch) {
        const verification = verifyExactMatch(emailHTML);
        if (!verification.isValid) {
          toast({
            title: "שגיאת אימות תוכן",
            description: `חסר תוכן במייל: ${verification.missingContent.slice(0, 2).join(', ')}${verification.missingContent.length > 2 ? '...' : ''}`,
            variant: "destructive"
          });
          setIsSending(false);
          return;
        }
      }

      let recipients: string[] = [];
      
      if (isTestMode) {
        recipients = ['ruth@ruthprissman.co.il'];
      } else if (isSpecificRecipientsMode) {
        if (selectedRecipients.length === 0) {
          toast({
            title: "שגיאה",
            description: "אנא בחרי לפחות נמען אחד",
            variant: "destructive"
          });
          setIsSending(false);
          return;
        }
        recipients = selectedRecipients;
      } else {
        // Load all subscribers
        const { data: subscribers, error } = await supabaseClient()
          .from('subscribers')
          .select('email')
          .eq('is_active', true);

        if (error) throw error;
        
        recipients = subscribers?.map(s => s.email) || [];
      }

      const emailData = {
        emailList: recipients,
        subject: emailSubject,
        htmlContent: emailHTML,
        sender: {
          name: 'רות פריסמן',
          email: 'ruth@ruthprissman.co.il'
        }
      };

      const { error } = await supabaseClient().functions.invoke('send-email', {
        body: emailData
      });

      if (error) throw error;

      toast({
        title: "המייל נשלח בהצלחה! 🎉",
        description: `נשלח ל-${recipients.length} נמענים`
      });

      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "שגיאה בשליחת המייל",
        description: "נסי שוב או פני לתמיכה",
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
          <DialogTitle className="text-right">שליחת {pageName} במייל לרשימת התפוצה</DialogTitle>
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