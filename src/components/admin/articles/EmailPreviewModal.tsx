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
    
    console.log('[EmailPreviewModal] Generating email preview with:', {
      title,
      contentLength: content?.length || 0,
      hasStaticLinks: !!article.staticLinks,
      staticLinksCount: article.staticLinks?.length || 0
    });
    
    if (article.staticLinks && article.staticLinks.length > 0) {
      console.log('[EmailPreviewModal] Static links before processing:', JSON.stringify(article.staticLinks, null, 2));
    }
    
    // Create a preview that matches the actual email template
    return `
      <div dir="rtl" style="direction: rtl; font-family: 'Heebo', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: transparent; border-radius: 8px; overflow: hidden;">
        <div style="padding: 20px; text-align: center; border-bottom: 2px solid #eaeaea;">
          <h1 style="color: #4A148C; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); font-family: 'Alef', sans-serif; text-align: center;">${title}</h1>
        </div>
        
        <div style="padding: 30px 20px; text-align: center; line-height: 1.8; color: #4A148C; direction: rtl;">
          ${formatContent(content)}
        </div>
        
        ${article.staticLinks && article.staticLinks.length > 0 ? `
        <div style="padding: 20px; background-color: transparent; margin: 0 20px 20px; border-radius: 4px; text-align: right;">
          <ul style="list-style-type: disc; padding-right: 20px; text-align: right;">
            ${generateLinksPreview(article.staticLinks)}
          </ul>
        </div>
        ` : ''}
        
        <div style="padding: 20px; text-align: center; border-top: 2px solid #eaeaea; background-color: transparent;">
          <p style="margin: 5px 0; font-size: 14px; color: #4A148C; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); text-align: center;">נשלח באמצעות מערכת הפרסום האוטומטית.</p>
          <p style="margin: 5px 0; font-size: 14px; color: #4A148C; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); text-align: center;">© רות פריסמן ${new Date().getFullYear()} כל הזכויות שמורות.</p>
        </div>
      </div>
    `;
  };
  
  // Generate preview HTML for links
  const generateLinksPreview = (links: Array<{id: number, title: string, url: string}> = []) => {
    console.log('[EmailPreviewModal] generateLinksPreview called with:', JSON.stringify(links, null, 2));
    
    if (!links || links.length === 0) {
      console.log('[EmailPreviewModal] No links to preview');
      return '';
    }
    
    const linksHtml = links.map(link => {
      console.log('[EmailPreviewModal] Processing link in preview:', JSON.stringify(link, null, 2));
      
      if (!link.title) {
        console.log('[EmailPreviewModal] Skipping link with empty title');
        return '';
      }
      
      let linkHtml = '<li style="margin-bottom: 10px; text-align: right; direction: rtl;">';
      
      // Check if it's a WhatsApp link
      if (link.url && link.url.startsWith('https://wa.me/')) {
        console.log('[EmailPreviewModal] Creating WhatsApp link with icon');
        linkHtml += `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" 
                      style="display: inline-flex; align-items: center; color: #4A148C; font-weight: bold; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); font-family: 'Heebo', Arial, sans-serif;">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" style="margin-left: 5px;">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>${escapeHtml(link.title)}</a>`;
      } 
      // Regular link with URL
      else if (link.url) {
        console.log('[EmailPreviewModal] Creating regular link with URL:', link.url);
        linkHtml += `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" 
                    style="color: #4A148C; font-weight: bold; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); font-family: 'Heebo', Arial, sans-serif;">
                    ${escapeHtml(link.title)}</a>`;
      } 
      // Text only (no URL)
      else {
        console.log('[EmailPreviewModal] Creating text-only item (no URL)');
        linkHtml += `<strong style="color: #4A148C; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); font-family: 'Heebo', Arial, sans-serif;">
                    ${escapeHtml(link.title)}</strong>`;
      }
      
      linkHtml += '</li>';
      console.log('[EmailPreviewModal] Generated link HTML length:', linkHtml.length);
      return linkHtml;
    }).join('');
    
    console.log('[EmailPreviewModal] All links preview HTML generated, length:', linksHtml.length);
    return linksHtml;
  };
  
  // Simple HTML escaping for preview safety
  const escapeHtml = (text: string | null | undefined): string => {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
  
  // Simple formatting for the preview content
  const formatContent = (markdown: string) => {
    // This is a very basic parser just for preview purposes
    // The actual email formatting is handled by the existing email logic
    
    // Replace newlines with <br>
    let formatted = markdown.replace(/\n/g, '<br>');
    
    // Replace markdown headers
    formatted = formatted.replace(/^# (.*?)$/gm, '<h1 style="color: #4A148C; font-size: 22px; font-family: \'Alef\', sans-serif; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); text-align: right; direction: rtl;">$1</h1>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h2 style="color: #4A148C; font-size: 20px; font-family: \'Alef\', sans-serif; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); text-align: right; direction: rtl;">$1</h2>');
    formatted = formatted.replace(/^### (.*?)$/gm, '<h3 style="color: #4A148C; font-size: 18px; font-family: \'Alef\', sans-serif; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); text-align: right; direction: rtl;">$1</h3>');
    
    // Replace links (this is a simplified version)
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #4A148C; font-weight: bold; text-decoration: none; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.7); font-family: \'Heebo\', Arial, sans-serif; text-align: right; direction: rtl;">$1</a>');
    
    // Replace bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Add WhatsApp icon to all WhatsApp links (using the original WhatsApp SVG)
    formatted = formatted.replace(/<a href="(https:\/\/wa\.me\/.*?)"(.*?)>(.*?)<\/a>/g, 
      '<a href="$1"$2 style="display: inline-flex; align-items: center; text-align: right; direction: rtl; font-family: \'Heebo\', Arial, sans-serif;"><svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" style="margin-left: 5px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>$3</a>');
    
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
        
        <div className="py-4 border rounded-md p-4 bg-gray-50 overflow-auto max-h-[50vh]" 
             style={{backgroundImage: 'url(https://uwqwlltrfvokjlaufguz.supabase.co/storage/v1/object/public/site_imgs/email-background.jpg)', 
                     backgroundSize: 'cover', 
                     backgroundPosition: 'center'}}>
          <div dir="rtl" dangerouslySetInnerHTML={{ __html: generateEmailPreview() }} />
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
