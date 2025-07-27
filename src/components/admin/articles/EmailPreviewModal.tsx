
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Article } from '@/types/article';
import { generateEmailContent } from '@/utils/EmailGenerator';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Send, TestTube } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  article: Article;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  article,
}) => {
  const { toast } = useToast();
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSpecificRecipientsMode, setIsSpecificRecipientsMode] = useState(false);
  const [allSubscribers, setAllSubscribers] = useState<Array<{email: string, firstName?: string, alreadySent: boolean}>>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const emailContent = generateEmailContent(article);

  const loadSubscribersWithSentStatus = async () => {
    setIsLoadingSubscribers(true);
    try {
      const supabase = supabaseClient();
      
      // Get all active subscribers
      const { data: subscribers, error: subscribersError } = await supabase
        .from('content_subscribers')
        .select('email, first_name')
        .eq('is_subscribed', true);

      if (subscribersError) throw subscribersError;

      // Get emails that already received this article
      const { data: sentEmails, error: sentError } = await supabase
        .from('email_logs')
        .select('email')
        .eq('article_id', article.id)
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

  const handleSendToAll = async () => {
    try {
      const supabase = supabaseClient();
      let recipientEmails: string[] = [];

      if (isSpecificRecipientsMode) {
        recipientEmails = selectedRecipients;
        if (recipientEmails.length === 0) {
          toast({
            title: "אין נמענים נבחרים",
            description: "אנא בחר לפחות נמען אחד",
            variant: "destructive"
          });
          return;
        }
      } else {
        // Get all subscribers
        const { data: subscribers, error: subscribersError } = await supabase
          .from('content_subscribers')
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
          description: "לא נמצאו מנויים פעילים",
          variant: "destructive"
        });
        return;
      }

      // Call the regular publish function but first update the expected parameters
      // We need to modify the service to include the selected recipients
      if (isSpecificRecipientsMode && selectedRecipients.length > 0) {
        // Store the selected recipients globally or pass them through the publish process
        (window as any).selectedEmailRecipients = selectedRecipients;
      } else {
        // Clear any previous selection
        delete (window as any).selectedEmailRecipients;
      }
      
      onConfirm();
      
    } catch (error: any) {
      console.error('Error preparing to send emails:', error);
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהכנת השליחה",
        variant: "destructive"
      });
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const supabase = supabaseClient();
      
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          emailList: ['Ruth@Ruthprissman.co.il'],
          subject: `[טסט] ${article.title}`,
          articleId: article.id, // Add articleId for email_logs tracking
          sender: {
            email: 'ruth@ruthprissman.co.il',
            name: 'רות פריסמן'
          },
          htmlContent: emailContent
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "מייל טסט נשלח בהצלחה",
        description: "המייל נשלח לכתובת Ruth@Ruthprissman.co.il",
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "שגיאה בשליחת מייל טסט",
        description: error.message || "אנא נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">תצוגה מקדימה של המייל</DialogTitle>
          <DialogDescription>
            זו תצוגה מקדימה של איך המייל ייראה לקוראים
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 border rounded-md p-4 bg-gray-50">
          <div 
            className="max-w-2xl mx-auto bg-white shadow-sm"
            dangerouslySetInnerHTML={{ __html: emailContent }}
          />
        </ScrollArea>

        <div className="space-y-4 p-4 border-t">
          <div className="flex items-center space-x-2 justify-end">
            <label htmlFor="specificRecipients" className="text-sm font-medium text-right">
              בחירת נמענים ספציפיים
            </label>
            <Checkbox
              id="specificRecipients"
              checked={isSpecificRecipientsMode}
              onCheckedChange={handleSpecificRecipientsChange}
            />
          </div>

          {isSpecificRecipientsMode && (
            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-right">בחירת נמענים:</h4>
                {isLoadingSubscribers && <span className="text-sm text-gray-500">טוען...</span>}
              </div>
              
              {allSubscribers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 text-right mb-2">
                    נמענים שטרם קיבלו את המאמר מודגשים בכחול
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
        </div>

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              ביטול
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="gap-2"
            >
              {isSendingTest ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              שלח טסט
            </Button>
          </div>
          
          <Button
            type="button"
            onClick={handleSendToAll}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isSpecificRecipientsMode ? `שלח ל-${selectedRecipients.length} נמענים` : "שלח לכולם"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewModal;
