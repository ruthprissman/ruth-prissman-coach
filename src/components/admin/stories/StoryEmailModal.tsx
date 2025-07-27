import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Mail, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabaseClient } from '@/lib/supabaseClient';
import { Story } from '@/types/story';

interface StoryEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story | null;
}

const StoryEmailModal: React.FC<StoryEmailModalProps> = ({ isOpen, onClose, story }) => {
  const [isSending, setIsSending] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isSpecificRecipientsMode, setIsSpecificRecipientsMode] = useState(false);
  const [allSubscribers, setAllSubscribers] = useState<Array<{email: string, firstName?: string, alreadySent: boolean}>>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const { toast } = useToast();

  const handleSendStoryEmail = async () => {
    if (!story) return;

    setIsSending(true);

    try {
      const supabase = supabaseClient();
      
      // Get story subscribers if not test mode
      let recipientEmails: string[] = [];
      
      if (isTestMode) {
        recipientEmails = ['ruth@ruthprissman.co.il'];
      } else if (isSpecificRecipientsMode) {
        recipientEmails = selectedRecipients;
      } else {
        const { data: subscribers, error: subscribersError } = await supabase
          .from('story_subscribers')
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
          description: isTestMode ? "לא נמצא כתובת מייל לבדיקה" : "לא נמצאו מנויים פעילים לסיפורים",
          variant: "destructive"
        });
        return;
      }

      // Prepare email content with improved styling and Google Drive signature image
      const subject = `סיפור חדש: ${story.title}`;
      const emailContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, Helvetica, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #4A235A;">
            <h1 style="color: #4A235A; font-size: 28px; margin: 0; font-weight: 300;">${story.title}</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 15px; border-right: 5px solid #D4C5B9; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #2c3e50; white-space: pre-line;">${story.description}</p>
            </div>
            
            <div style="text-align: center; margin: 40px 0; padding: 20px; background-color: #f8f4f1; border-radius: 10px;">
              <p style="margin: 0; font-size: 16px; color: #4A235A; font-weight: 500;">📖 הסיפור המלא מצורף כקובץ PDF</p>
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

      // Prepare attachments array - make sure PDF URL is valid
      let attachments = undefined;
      if (story.pdf_url) {
        console.log('Preparing PDF attachment:', story.pdf_url);
        attachments = [{
          filename: `${story.title}.pdf`,
          url: story.pdf_url
        }];
      }

      // Call the send-email edge function with attachment
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          emailList: recipientEmails,
          subject: subject,
          sender: {
            email: "ruth@ruthprissman.co.il",
            name: "רות פריסמן"
          },
          htmlContent: emailContent,
          attachments: attachments
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);

      toast({
        title: isTestMode ? "מייל בדיקה נשלח" : "הסיפור נשלח בהצלחה",
        description: isTestMode 
          ? "מייל הבדיקה נשלח לכתובת ruth@ruthprissman.co.il"
          : `הסיפור נשלח ל-${recipientEmails.length} נמענים${data?.attachmentsProcessed ? ` עם ${data.attachmentsProcessed} קבצים מצורפים` : ''}`
      });

      onClose();
    } catch (error: any) {
      console.error('Error sending story email:', error);
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
    if (!story) return;
    
    setIsLoadingSubscribers(true);
    try {
      const supabase = supabaseClient();
      
      // Get all active subscribers
      const { data: subscribers, error: subscribersError } = await supabase
        .from('story_subscribers')
        .select('email, first_name')
        .eq('is_subscribed', true);

      if (subscribersError) throw subscribersError;

      // Get emails that already received this story
      const { data: sentEmails, error: sentError } = await supabase
        .from('email_logs')
        .select('email')
        .eq('article_id', story.id)
        .eq('status', 'success');

      if (sentError) throw sentError;

      const sentEmailSet = new Set(sentEmails?.map(log => log.email) || []);
      
      const subscribersWithStatus = subscribers?.map(sub => ({
        email: sub.email,
        firstName: sub.first_name,
        alreadySent: sentEmailSet.has(sub.email)
      })) || [];

      setAllSubscribers(subscribersWithStatus);
      // Pre-select recipients who haven't received the email yet
      setSelectedRecipients(subscribersWithStatus.filter(s => !s.alreadySent).map(s => s.email));
      
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

  if (!story) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">שליחת סיפור במייל</DialogTitle>
          <DialogDescription className="text-right">
            שליחת הסיפור "{story.title}" לרשימת התפוצה
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-right mb-2">פרטי הסיפור:</h4>
            <p className="text-sm text-right"><strong>כותרת:</strong> {story.title}</p>
            <p className="text-sm text-right mt-2"><strong>תיאור:</strong></p>
            <p className="text-sm text-gray-600 text-right mt-1">{story.description.substring(0, 150)}...</p>
            {story.pdf_url && (
              <p className="text-sm text-right mt-2"><strong>קובץ PDF:</strong> <span className="text-green-600">✓ קיים</span></p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="text-xs text-gray-500 text-right mb-2">
                    נמענים שטרם קיבלו את הסיפור מודגשים בכחול
                  </div>
                  
                  {allSubscribers.map((subscriber) => (
                    <div key={subscriber.email} className={`flex items-center justify-between p-2 rounded ${
                      !subscriber.alreadySent ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {subscriber.firstName || subscriber.email}
                        </div>
                        {subscriber.firstName && (
                          <div className="text-xs text-gray-500">{subscriber.email}</div>
                        )}
                        {subscriber.alreadySent && (
                          <div className="text-xs text-green-600">✓ כבר נשלח</div>
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
              onClick={handleSendStoryEmail}
              disabled={isSending}
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

export default StoryEmailModal;
