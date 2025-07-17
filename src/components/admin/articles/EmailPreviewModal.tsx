
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
  const emailContent = generateEmailContent(article);

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const supabase = supabaseClient();
      
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          emailList: ['Ruth@Ruthprissman.co.il'],
          subject: `[טסט] ${article.title}`,
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
            onClick={onConfirm}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            שלח לכולם
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewModal;
