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
import { Article } from '@/types/article';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronRight, SplitSquareVertical, Eye, Smartphone, ImageIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WhatsAppPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (splits: string[]) => void;
  article: Article | null;
}

const SPLIT_DELIMITER = '---split---';

const convertHtmlToText= (html: string): string => {
  console.log('[HtmlToText Debug] Starting conversion for input HTML:', html ? `Length: ${html.length}` : 'Empty input');
  
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  console.log('[HtmlToText Debug] Created temp element with parsed HTML');
  
  const processNode = (node: Node): string => {
    console.log(`[HtmlToText Debug] Processing node: ${node.nodeType === Node.TEXT_NODE ? 'TEXT_NODE' : 'ELEMENT_NODE'}`, 
      node.nodeType === Node.ELEMENT_NODE ? `tag=<${(node as HTMLElement).tagName.toLowerCase()}>` : '');
    
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || '';
      console.log(`[HtmlToText Debug] TEXT_NODE content: "${textContent}"`);
      return textContent;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      console.log(`[HtmlToText Debug] Processing ELEMENT_NODE with tag: <${tagName}>`);
      
      switch (tagName) {
        case 'p':
          console.log('[HtmlToText Debug] Handling <p> tag');
          return Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n\n';
        
        case 'div':
          console.log('[HtmlToText Debug] Handling <div> tag');
          return Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n\n';
        
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          console.log(`[HtmlToText Debug] Handling <${tagName}> heading tag`);
          return Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n\n';
        
        case 'br':
          console.log('[HtmlToText Debug] Handling <br> tag - adding line break');
          return '\n';
        
        case 'blockquote':
          console.log('[HtmlToText Debug] Handling <blockquote> tag');
          return '> ' + Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n\n';
        
        case 'ul':
        case 'ol':
          console.log(`[HtmlToText Debug] Handling <${tagName}> list tag`);
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
            
        case 'li':
          console.log('[HtmlToText Debug] Handling <li> tag');
          return '• ' + Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n';
        
        case 'strong':
        case 'b':
          console.log(`[HtmlToText Debug] Handling <${tagName}> (bold) tag`);
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
        
        case 'em':
        case 'i':
          console.log(`[HtmlToText Debug] Handling <${tagName}> (italic) tag`);
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
          
        case 'a':
          console.log('[HtmlToText Debug] Handling <a> tag');
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
          
        case 'span':
          console.log('[HtmlToText Debug] Handling <span> tag');
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
          
        case 'u':
          console.log('[HtmlToText Debug] Handling <u> (underline) tag');
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
          
        case 'code':
          console.log('[HtmlToText Debug] Handling <code> tag');
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
          
        case 'mark':
          console.log('[HtmlToText Debug] Handling <mark> tag');
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
        
        default:
          console.log(`[HtmlToText Debug] Handling unknown tag <${tagName}>`);
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
      }
    }
    
    console.log('[HtmlToText Debug] Node is neither TEXT_NODE nor ELEMENT_NODE');
    return '';
  };
  
  let text = processNode(temp);
  console.log('[HtmlToText Debug] Combined text before cleanup:', text);
  
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n[ \t]+/g, '\n');
  
  const cleanedText = text.trim();
  console.log('[HtmlToText Debug] Final cleaned text:', cleanedText);
  
  return cleanedText;
};

const convertHtmlToText55 = (html: string): string => {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '').replace(/\s+/g, ' ').trim();
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li'];

      const childText = Array.from(element.childNodes)
        .map(processNode)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (blockTags.includes(tagName)) {
        return childText + '\n\n';
      }

      if (tagName === 'br') {
        return '\n';
      }

      return childText;
    }

    return '';
  };

  let text = processNode(temp);
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n[ \t]+/g, '\n');
  return text.trim();
};

const WhatsAppPublicationModal: React.FC<WhatsAppPublicationModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  article,
}) => {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [splits, setSplits] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('edit');

  useEffect(() => {
    if (article && isOpen) {
      const plainText = convertHtmlToText(article.content_markdown || '');
      setContent(plainText);
    }
  }, [article, isOpen]);

  useEffect(() => {
    if (content.includes(SPLIT_DELIMITER)) {
      const contentSplits = content.split(SPLIT_DELIMITER).map(split => split.trim());
      setSplits(contentSplits.filter(split => split.length > 0));
    } else {
      setSplits([content]);
    }
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleInsertSplitDelimiter = () => {
    const textarea = document.getElementById('whatsapp-content') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPos);
      const textAfterCursor = content.substring(cursorPos);
      
      const newContent = `${textBeforeCursor}\n\n${SPLIT_DELIMITER}\n\n${textAfterCursor}`;
      setContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPos + SPLIT_DELIMITER.length + 4;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
      
      toast({
        title: "מפריד נוסף",
        description: "המפריד נוסף בהצלחה. התוכן יחולק לפי המיקום הזה.",
      });
    }
  };

  const generateStatusImages = async () => {
    if (!article || !article.image_url) {
      toast({
        title: "שגיאה",
        description: "חייבת להיות תמונה מצורפת למאמר כדי ליצור תמונות סטטוס",
        variant: "destructive",
      });
      return;
    }

    if (splits.length === 0) {
      toast({
        title: "שגיאה",
        description: "אין תוכן לייצוא. נא להוסיף תוכן תחילה",
        variant: "destructive",
      });
      return;
    }

    try {
      // טעינת התמונה הרקע
      const backgroundImage = new Image();
      backgroundImage.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        backgroundImage.onload = resolve;
        backgroundImage.onerror = reject;
        backgroundImage.src = article.image_url!;
      });

      // יצירת תמונות לכל חלק
      for (let i = 0; i < splits.length; i++) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        // הגדרת גודל 1:1 (מתאים לסטטוס WhatsApp)
        const size = 1080;
        canvas.width = size;
        canvas.height = size;

        // ציור רקע התמונה (מתיחה למילוי המסגרת)
        ctx.drawImage(backgroundImage, 0, 0, size, size);

        // הוספת שכבת שקיפות כהה לקריאות טובה יותר
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, size, size);

        // הגדרות טקסט
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // חלוקת הטקסט לשורות
        const splitContent = splits[i];
        const lines = splitContent.split('\n').filter(line => line.trim() !== '');
        
        // חישוב גודל פונט בהתאם לכמות השורות
        const lineCount = lines.length;
        const baseFontSize = Math.max(28, Math.min(48, size / (lineCount + 8)));
        ctx.font = `bold ${baseFontSize}px Arial, sans-serif`;

        // ציור הטקסט ממורכז
        const startY = size / 2 - (lineCount * baseFontSize * 1.3) / 2;
        
        lines.forEach((line, lineIndex) => {
          const y = startY + (lineIndex * baseFontSize * 1.3);
          ctx.fillText(line.trim(), size / 2, y);
        });

        // הורדת התמונה
        const link = document.createElement('a');
        link.download = `status-${i + 1}-of-${splits.length}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }

      toast({
        title: "תמונות נוצרו בהצלחה",
        description: `נוצרו ${splits.length} תמונות לסטטוס WhatsApp`,
      });

    } catch (error) {
      console.error('Error generating status images:', error);
      toast({
        title: "שגיאה ביצירת תמונות",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

  const handleContinue = () => {
    if (splits.length === 0) {
      toast({
        title: "אין תוכן",
        description: "נא להוסיף תוכן לפני שממשיכים",
        variant: "destructive",
      });
      return;
    }
    
    onContinue(splits);
  };

  const renderFormattedContent = (content: string) => {
    return (
      <div className="whitespace-pre-line text-right font-heebo" dir="rtl">
        {content}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl mx-auto font-heebo" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">פרסום ב-WhatsApp</DialogTitle>
          <DialogDescription>
            ערוך את התוכן והוסף מפרידים כדי לחלק את המאמר לחלקים נפרדים לפרסום ב-WhatsApp
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <SplitSquareVertical className="h-4 w-4" />
              עריכה וחלוקה
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              תצוגה מקדימה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="whatsapp-content" className="text-md font-medium">
                  תוכן המאמר
                </Label>
                <Button
                  onClick={handleInsertSplitDelimiter}
                  variant="outline"
                  size="sm"
                  className="flex gap-1 items-center"
                >
                  <SplitSquareVertical className="h-4 w-4" />
                  הוסף מפריד
                </Button>
              </div>
              
              <Textarea
                id="whatsapp-content"
                value={content}
                onChange={handleContentChange}
                placeholder="תוכן המאמר..."
                dir="rtl"
                className="min-h-[350px] text-right font-heebo border-2 p-4"
              />
              
              <p className="text-sm text-gray-500">
                הוסף <code className="bg-gray-100 px-1 rounded">{SPLIT_DELIMITER}</code> בכל מקום שבו תרצה לפצל את המאמר לחלקים נפרדים
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center mb-2 gap-2">
              <Smartphone className="h-5 w-5" />
              <Label className="text-md font-medium">תצוגה מקדימה של חלקי WhatsApp</Label>
            </div>
            
            <ScrollArea className="border rounded-md h-[350px] p-4">
              <div className="space-y-6">
                {splits.map((split, index) => (
                  <div 
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-md border border-gray-100"
                  >
                    <div className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded mb-2 inline-block">
                      חלק {index + 1} מתוך {splits.length}
                    </div>
                    {renderFormattedContent(split)}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="text-sm text-gray-500 flex justify-between items-center">
              <span>סה״כ {splits.length} חלקים</span>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('edit')}
                size="sm"
              >
                חזרה לעריכה
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between sm:justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            ביטול
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={generateStatusImages}
              variant="outline"
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              יצר תמונות לסטטוס
            </Button>
            
            <Button
              type="button"
              onClick={handleContinue}
              className="gap-2"
            >
              המשך
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppPublicationModal;
