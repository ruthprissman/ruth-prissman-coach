import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Mail, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';

interface LandingPageEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LandingPageEmailModal: React.FC<LandingPageEmailModalProps> = ({ isOpen, onClose }) => {
  const [isSending, setIsSending] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isSpecificRecipientsMode, setIsSpecificRecipientsMode] = useState(false);
  const [allSubscribers, setAllSubscribers] = useState<Array<{email: string, firstName?: string}>>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [emailSubject, setEmailSubject] = useState('סדנת תפילה אישית - הזמנה מיוחדת');
  const { toast } = useToast();

  const generateLandingPageHTML = () => {
    return `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, Helvetica, sans-serif; line-height: 1.8; color: #333; max-width: 700px; margin: 0 auto; background-color: #ffffff;">
        <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #f8f4f1 0%, #f0ede8 100%); border-bottom: 3px solid #4A235A;">
          <h1 style="color: #4A235A; font-size: 32px; margin: 0; font-weight: 300; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
            סדנת תפילה אישית
          </h1>
          <h2 style="color: #6B4C57; font-size: 20px; margin: 10px 0; font-weight: 300;">
            גלי את הכוח הטיפולי שבתפילה שלך
          </h2>
        </div>
        
        <div style="padding: 30px 20px;">
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 15px; border-right: 5px solid #D4C5B9; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="margin: 0; font-size: 18px; line-height: 1.8; color: #2c3e50; text-align: center;">
              <strong>📅 תאריך:</strong> יום רביעי, 1 בינואר 2025<br>
              <strong>🕐 שעה:</strong> 20:00-21:30<br>
              <strong>💰 עלות:</strong> ללא תשלום<br>
              <strong>📍 פלטפורמה:</strong> זום
            </p>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <h3 style="color: #4A235A; font-size: 24px; margin-bottom: 20px;">איך זה יעזור לך?</h3>
            <div style="display: inline-block; text-align: right;">
              <div style="margin: 15px 0; padding: 15px; background-color: #fff8f0; border-radius: 10px; border-right: 4px solid #ff6b6b;">
                <strong style="color: #ff6b6b;">מרגישה לא מספיק טובה?</strong><br>
                נלמד איך להשתמש בתפילה כדי להגביר את הביטחון העצמי
              </div>
              <div style="margin: 15px 0; padding: 15px; background-color: #f0f8ff; border-radius: 10px; border-right: 4px solid #4ecdc4;">
                <strong style="color: #4ecdc4;">מתקשה להתמודד עם רגשות קשים?</strong><br>
                נגלה איך תפילה יכולה להביא רגיעה ושלווה פנימית
              </div>
              <div style="margin: 15px 0; padding: 15px; background-color: #fff0f8; border-radius: 10px; border-right: 4px solid #a8e6cf;">
                <strong style="color: #a8e6cf;">חשה תקועה או חסרת כיוון?</strong><br>
                נלמד להשתמש בתפילה כדי לקבל בהירות והכוונה
              </div>
            </div>
          </div>

          <div style="background-color: #f8f4f1; padding: 25px; border-radius: 15px; margin: 30px 0;">
            <h3 style="color: #4A235A; font-size: 22px; margin-bottom: 20px; text-align: center;">מה תקבלי בסדנה:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                ✨ <strong>הבנה עמוקה</strong> - איך תפילה יכולה לשמש ככלי טיפולי עוצמתי
              </li>
              <li style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                🎯 <strong>טכניקות מעשיות</strong> - שיטות פשוטות לשילוב תפילה בחיי היום-יום
              </li>
              <li style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                💝 <strong>חוויה אישית</strong> - התאמה אישית של התפילה לצרכים שלך
              </li>
              <li style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                🌟 <strong>חיבור רגשי</strong> - איך להגיע לעומק בתפילה ולחוות שינוי פנימי
              </li>
            </ul>
          </div>

          <div style="text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #4A235A 0%, #6B4C57 100%); border-radius: 15px; color: white;">
            <h3 style="color: white; font-size: 24px; margin-bottom: 20px;">מוכנה להתחיל?</h3>
            <p style="font-size: 16px; margin-bottom: 25px; line-height: 1.6;">
              הצטרפי אלינו לסדנה מיוחדת ותגלי את הכוח הטיפולי שבתפילה שלך
            </p>
            <a href="https://coach.ruthprissman.co.il/prayer-landing" 
               style="display: inline-block; background-color: #D4C5B9; color: #4A235A; padding: 15px 30px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease;">
              🌟 אני נרשמת לסדנה
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 50px; padding: 30px 20px; border-top: 1px solid #e0e0e0; background: linear-gradient(135deg, #f8f4f1 0%, #f0ede8 100%);">
          <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; text-align: center;">
            <tr>
              <td style="text-align: center;">
                <img src="https://drive.google.com/uc?export=view&id=1HSpCu_iV7E7uTk3rxtideWZd8FwHfaX1" 
                     alt="רות פריסמן - חתימה" 
                     style="max-width: 250px; width: 100%; height: auto; margin-bottom: 15px; border-radius: 10px; display: block;" />
              </td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <p style="margin: 5px 0; color: #4A235A; font-size: 18px; font-weight: 600;">רות פריסמן - קוד הנפש</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">מאמנת בגישה טיפולית | קוד הנפש | SEFT</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">מבט חדש על חיים מוכרים</p>
            <div style="margin-top: 15px;">
              <p style="margin: 3px 0; color: #4A235A; font-size: 14px;">
                📧 <a href="mailto:Ruth@RuthPrissman.co.il" style="color: #4A235A; text-decoration: none;">Ruth@RuthPrissman.co.il</a>
              </p>
              <p style="margin: 3px 0; color: #4A235A; font-size: 14px;">📱 0556620273</p>
              <p style="margin: 3px 0;">
                <a href="https://coach.ruthprissman.co.il" style="color: #4A235A; text-decoration: none; font-size: 14px;">🌐 https://coach.ruthprissman.co.il</a>
              </p>
            </div>
          </div>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
            <p style="margin: 0; color: #888; font-size: 12px;">
              <a href="${window.location.origin}/unsubscribe" style="color: #4A235A; text-decoration: underline;">לביטול המנוי לחץ כאן</a>
            </p>
          </div>
        </div>
      </div>
    `;
  };

  const handleSendLandingPageEmail = async () => {
    setIsSending(true);

    try {
      const supabase = supabaseClient();
      
      // Get article subscribers if not test mode
      let recipientEmails: string[] = [];
      
      if (isTestMode) {
        recipientEmails = ['ruth@ruthprissman.co.il'];
      } else if (isSpecificRecipientsMode) {
        recipientEmails = selectedRecipients;
      } else {
        // Get active article subscribers
        const { data: subscribers, error: subscribersError } = await supabase
          .from('subscribers')
          .select('email')
          .eq('is_subscribed', true);

        if (subscribersError) {
          throw subscribersError;
        }

        recipientEmails = subscribers?.map(sub => sub.email) || [];
      }

      if (recipientEmails.length === 0) {
        toast({
          title: "אין נמענים",
          description: isTestMode ? "לא נמצא כתובת מייל לבדיקה" : "לא נמצאו מנויים פעילים למאמרים",
          variant: "destructive"
        });
        return;
      }

      // Generate email content
      const emailContent = generateLandingPageHTML();

      // Call the send-email edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          emailList: recipientEmails,
          subject: emailSubject,
          sender: {
            email: "ruth@ruthprissman.co.il",
            name: "רות פריסמן"
          },
          htmlContent: emailContent
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);

      toast({
        title: isTestMode ? "מייל בדיקה נשלח" : "ההזמנה לסדנה נשלחה בהצלחה",
        description: isTestMode 
          ? "מייל הבדיקה נשלח לכתובת ruth@ruthprissman.co.il"
          : `ההזמנה נשלחה ל-${recipientEmails.length} נמענים`
      });

      onClose();
    } catch (error: any) {
      console.error('Error sending landing page email:', error);
      toast({
        title: "שגיאה בשליחת המייל",
        description: error.message || "אירעה שגיאה בשליחת המייל. נסה שוב מאוחר יותר.",
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
          <DialogTitle className="text-right">שליחת הזמנה לסדנה במייל</DialogTitle>
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