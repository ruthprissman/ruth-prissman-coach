
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Article } from '@/types/article';
import { Check, X } from 'lucide-react';

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
  article
}) => {
  // Generate the email preview HTML
  const generateEmailPreview = () => {
    const title = article.title || '';
    const content = article.content_markdown || '';
    
    // Create a simple HTML email preview
    return `
      <div style="direction: rtl; text-align: center; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #4a5568; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #2d3748; font-size: 24px; margin-bottom: 8px;">${title}</h1>
          <p style="color: #718096; font-size: 14px;">נשלח מאת: רות פריסמן</p>
        </div>
        
        <div style="line-height: 1.6; color: #4a5568; text-align: center;">
          ${formatContent(content)}
        </div>
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 12px;">
          <p>נשלח באמצעות מערכת הפרסום האוטומטית.</p>
          <p>© רות פריסמן ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;
  };
  
  // Simple formatting for the preview content
  const formatContent = (markdown: string) => {
    // This is a very basic parser just for preview purposes
    // The actual email formatting is handled by the existing email logic
    
    // Replace newlines with <br>
    let formatted = markdown.replace(/\n/g, '<br>');
    
    // Replace markdown headers
    formatted = formatted.replace(/^# (.*?)$/gm, '<h1 style="color: #2d3748; font-size: 22px;">$1</h1>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h2 style="color: #2d3748; font-size: 20px;">$1</h2>');
    formatted = formatted.replace(/^### (.*?)$/gm, '<h3 style="color: #2d3748; font-size: 18px;">$1</h3>');
    
    // Replace links (this is a simplified version)
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #4299e1; text-decoration: none;">$1</a>');
    
    // Replace bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Add WhatsApp icon to all WhatsApp links (simulating the actual email template behavior)
    formatted = formatted.replace(/<a href="(https:\/\/wa\.me\/.*?)"(.*?)>(.*?)<\/a>/g, 
      '<a href="$1"$2 style="display: inline-flex; align-items: center;"><span style="margin-left: 5px;">📱</span>$3</a>');
    
    return formatted;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>תצוגה מקדימה של המייל</DialogTitle>
          <DialogDescription>
            בדוק שהמייל נראה כמו שאת/ה רוצה לפני שליחתו
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 border rounded-md p-4 bg-gray-50 overflow-auto max-h-[50vh]">
          <div dangerouslySetInnerHTML={{ __html: generateEmailPreview() }} />
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            ביטול
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            אשר ושלח
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewModal;
