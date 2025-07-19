
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

      // Prepare email content
      const subject = `סיפור חדש: ${story.title}`;
      const emailContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4A235A; text-align: center;">${story.title}</h2>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-right: 4px solid #D4C5B9;">
            <p style="margin: 0; white-space: pre-line;">${story.description}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p>הסיפור המלא מצורף כקובץ PDF</p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>נשלח מאת רות פריסמן - קוד הנפש</p>
            <p>
              <a href="${window.location.origin}/unsubscribe" style="color: #4A235A;">לביטול המנוי</a>
            </p>
          </div>
        </div>
      `;

      // Call the send-email edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          emailList: recipientEmails,
          subject: subject,
          sender: {
            email: "ruth@ruthprissman.co.il",
            name: "רות פריסמן"
          },
          htmlContent: emailContent,
          attachments: story.pdf_url ? [{
            filename: `${story.title}.pdf`,
            url: story.pdf_url
          }] : undefined
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: isTestMode ? "מייל בדיקה נשלח" : "הסיפור נשלח בהצלחה",
        description: isTestMode 
          ? "מייל הבדיקה נשלח לכתובת ruth@ruthprissman.co.il"
          : `הסיפור נשלח ל-${recipientEmails.length} נמענים`
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
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <label htmlFor="testMode" className="text-sm font-medium text-right">
              שליחת מייל בדיקה (רק לכתובת ruth@ruthprissman.co.il)
            </label>
            <Checkbox
              id="testMode"
              checked={isTestMode}
              onCheckedChange={setIsTestMode}
            />
          </div>

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
