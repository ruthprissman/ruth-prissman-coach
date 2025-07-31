import React, { useState, useEffect } from 'react';
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
import { EmailGenerator } from '@/utils/EmailGenerator';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Send, TestTube, Users, Eye, Clock } from 'lucide-react';
import EmailScheduleModal from './EmailScheduleModal';

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
  const [isSending, setIsSending] = useState(false);
  const [isSpecificRecipientsMode, setIsSpecificRecipientsMode] = useState(false);
  const [allSubscribers, setAllSubscribers] = useState<Array<{email: string, firstName?: string, alreadySent: boolean}>>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [showRecipientsList, setShowRecipientsList] = useState(false);
  const [finalRecipientsList, setFinalRecipientsList] = useState<Array<{email: string, firstName?: string}>>([]);
  const emailGenerator = new EmailGenerator();
  const [emailContent, setEmailContent] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  console.log('[EmailPreviewModal] Article data:', {
    id: article.id,
    title: article.title,
    hasImageUrl: !!article.image_url,
    imageUrl: article.image_url,
    staticLinksCount: article.staticLinks?.length || 0
  });
  
  useEffect(() => {
    const generateContent = async () => {
      const content = await emailGenerator.generateEmailContent({
        title: article.title,
        content: article.content_markdown,
        staticLinks: article.staticLinks,
        image_url: article.image_url
      });
      setEmailContent(content);
    };
    
    generateContent();
  }, [article.id, article.title, article.content_markdown, article.image_url]);

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

  const handleDeselectAll = () => {
    setSelectedRecipients([]);
  };

  const handleShowRecipientsList = async () => {
    try {
      const supabase = supabaseClient();
      let recipientsData: Array<{email: string, firstName?: string}> = [];

      if (isSpecificRecipientsMode) {
        recipientsData = allSubscribers
          .filter(sub => selectedRecipients.includes(sub.email))
          .map(sub => ({ email: sub.email, firstName: sub.firstName }));
      } else {
        // Get all subscribers
        const { data: subscribers, error: subscribersError } = await supabase
          .from('content_subscribers')
          .select('email, first_name')
          .eq('is_subscribed', true);

        if (subscribersError) {
          throw subscribersError;
        }

        recipientsData = subscribers?.map(sub => ({
          email: sub.email,
          firstName: sub.first_name
        })) || [];
      }

      if (recipientsData.length === 0) {
        toast({
          title: "אין נמענים",
          description: "לא נמצאו נמענים פעילים",
          variant: "destructive"
        });
        return;
      }

      setFinalRecipientsList(recipientsData);
      setShowRecipientsList(true);
      
    } catch (error: any) {
      console.error('Error loading final recipients:', error);
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בטעינת הנמענים",
        variant: "destructive"
      });
    }
  };

  const handleSendToAll = async () => {
    setIsSending(true);
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

      console.log('[EmailPreview] About to call onConfirm with selected recipients:', selectedRecipients);
      
      // Store the selected recipients for the service - THIS IS THE KEY FIX
      if (isSpecificRecipientsMode && selectedRecipients.length > 0) {
        (window as any).selectedEmailRecipients = selectedRecipients;
        console.log('[EmailPreview] Stored selected recipients:', (window as any).selectedEmailRecipients);
      } else {
        delete (window as any).selectedEmailRecipients;
        console.log('[EmailPreview] Using all subscribers - cleared specific recipients');
      }
      
      onConfirm();
      
    } catch (error: any) {
      console.error('Error preparing to send emails:', error);
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהכנת השליחה",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToSelectedFromList = async () => {
    setIsSending(true);
    try {
      // Use the final recipients list that was already prepared
      const emailsToSend = finalRecipientsList.map(recipient => recipient.email);
      
      if (emailsToSend.length === 0) {
        toast({
          title: "אין נמענים",
          description: "לא נמצאו נמענים לשליחה",
          variant: "destructive"
        });
        return;
      }

      // Store the exact recipients for the service
      (window as any).selectedEmailRecipients = emailsToSend;
      
      // Close the recipients list view and trigger the send
      setShowRecipientsList(false);
      onConfirm();
      
    } catch (error: any) {
      console.error('Error preparing to send emails:', error);
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהכנת השליחה",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleEmail = async (scheduledDate: Date) => {
    try {
      const supabase = supabaseClient();
      
      let finalRecipients: string[] = [];
      if (isSpecificRecipientsMode) {
        finalRecipients = selectedRecipients;
      } else {
        // Get all active subscribers
        const { data: subscribers, error: subscribersError } = await supabase
          .from('content_subscribers')
          .select('email')
          .eq('is_subscribed', true);

        if (subscribersError) throw subscribersError;
        finalRecipients = subscribers?.map(sub => sub.email) || [];
      }

      if (finalRecipients.length === 0) {
        toast({
          title: "אין נמענים",
          description: "לא נמצאו נמענים פעילים",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.functions.invoke('schedule-email', {
        body: {
          recipients: finalRecipients,
          subject: `מאמר חדש: ${article.title}`,
          htmlContent: emailContent,
          articleId: article.id,
          scheduledDatetime: scheduledDate.toISOString()
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "המייל נתזמן בהצלחה",
        description: `המייל ישלח ב-${scheduledDate.toLocaleDateString('he-IL')} בשעה ${scheduledDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
      });

      onClose();
    } catch (error: any) {
      console.error('Error scheduling email:', error);
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בתזמון המייל",
        variant: "destructive",
      });
    }
  };

  const handleSendNow = () => {
    setShowScheduleModal(false);
    handleSendToAll();
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const supabase = supabaseClient();
      
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          emailList: ['Ruth@Ruthprissman.co.il'], // Fixed: array of strings, not objects
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

  if (showRecipientsList) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">רשימת נמענים לשליחה</DialogTitle>
            <DialogDescription>
              המייל יישלח לנמענים הבאים:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              סה"כ {finalRecipientsList.length} נמענים
            </div>
            
            <ScrollArea className="h-64 border rounded-md p-4">
              <div className="space-y-2">
                {finalRecipientsList.map((recipient, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="text-right">
                      <div className="font-medium">
                        {recipient.firstName || recipient.email}
                      </div>
                      {recipient.firstName && (
                        <div className="text-sm text-gray-500">{recipient.email}</div>
                      )}
                    </div>
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRecipientsList(false)}
            >
              חזור
            </Button>
            
            <Button
              type="button"
              onClick={handleSendToSelectedFromList}
              disabled={isSending}
              className="gap-2"
            >
              {isSending ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              שלח ל-{finalRecipientsList.length} נמענים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

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
          {emailContent ? (
            <div 
              className="max-w-2xl mx-auto bg-white shadow-sm"
              dangerouslySetInnerHTML={{ __html: emailContent }}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-600">יוצר תצוגה מקדימה...</p>
              </div>
            </div>
          )}
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
                  <div className="flex justify-between items-center mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                      className="text-xs h-7"
                    >
                      בטל בחירה מכל הנמענים
                    </Button>
                    <div className="text-xs text-gray-500 text-right">
                      נמענים שטרם קיבלו את המאמר מודגשים בכחול
                    </div>
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
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleShowRecipientsList}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              הצג רשימת נמענים
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowScheduleModal(true)}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              תזמן שליחה
            </Button>
            
            <Button
              type="button"
              onClick={handleSendToAll}
              disabled={isSending}
              className="gap-2"
            >
              {isSending ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              שלח עכשיו
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <EmailScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleScheduleEmail}
        onSendNow={handleSendNow}
        title={`מאמר: ${article?.title || ''}`}
      />
    </Dialog>
  );
};

export default EmailPreviewModal;
