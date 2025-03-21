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
import { ChevronRight, SplitSquareVertical, Eye, Smartphone } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WhatsAppPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (splits: string[]) => void;
  article: Article | null;
}

const SPLIT_DELIMITER = '---split---';

const convertHtmlToText555 = (html: string): string => {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      switch (tagName) {
        case 'p':
        case 'div':
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n\n';
        
        case 'br':
          return '\n';
        
        case 'blockquote':
          return '> ' + Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n\n';
        
        case 'ul':
        case 'ol':
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
            
        case 'li':
          return '• ' + Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n';
        
        case 'strong':
        case 'b':
        case 'em':
        case 'i':
        case 'a':
        case 'span':
        case 'u':
        case 'code':
        case 'mark':
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
        
        default:
          return Array.from(element.childNodes)
            .map(processNode)
            .join('');
      }
    }
    
    return '';
  };
  
  let text = processNode(temp);
  
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n[ \t]+/g, '\n');
  
  return text.trim();
};

const convertHtmlToText = (html: string): string => {
  console.log('[HtmlToText Debug] Starting conversion for input HTML:', html);
  
  if (!html) {
    console.log('[HtmlToText Debug] Empty HTML input, returning empty string');
    return '';
  }

  const temp = document.createElement('div');
  temp.innerHTML = html;
  console.log('[HtmlToText Debug] Created temporary DOM element with HTML content');

  const processNode = (node: Node): string => {
    console.log('[HtmlToText Debug] Processing node type:', node.nodeType);
    
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = (node.textContent || '').replace(/\s+/g, ' ').trim();
      console.log('[HtmlToText Debug] Processing TEXT_NODE, content:', textContent);
      return textContent;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      console.log('[HtmlToText Debug] Processing ELEMENT_NODE, tag:', tagName);

      // List block-level tags
      const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li'];
      console.log('[HtmlToText Debug] Is block tag?', blockTags.includes(tagName));

      // Process child nodes
      console.log('[HtmlToText Debug] Beginning to process children of', tagName);
      const childNodes = Array.from(element.childNodes);
      console.log('[HtmlToText Debug] Number of child nodes:', childNodes.length);
      
      const processedChildren = childNodes.map(child => {
        const result = processNode(child);
        console.log('[HtmlToText Debug] Processed child result:', result);
        return result;
      });
      
      const childText = processedChildren.join(' ').replace(/\s+/g, ' ').trim();
      console.log('[HtmlToText Debug] Combined children text for', tagName, ':', childText);

      if (blockTags.includes(tagName)) {
        console.log('[HtmlToText Debug] Adding block-level line breaks for tag:', tagName);
        return childText + '\n\n';
      }

      if (tagName === 'br') {
        console.log('[HtmlToText Debug] Processing <br> tag, adding line break');
        return '\n';
      }

      // Inline tags shouldn't break lines
      console.log('[HtmlToText Debug] Processing inline tag', tagName, 'no line breaks added');
      return childText;
    }

    console.log('[HtmlToText Debug] Unhandled node type, returning empty string');
    return '';
  };

  console.log('[HtmlToText Debug] Starting to process root node');
  let text = processNode(temp);
  console.log('[HtmlToText Debug] Text after processing all nodes:', text);
  
  console.log('[HtmlToText Debug] Applying regex cleanup for consecutive line breaks');
  text = text.replace(/\n{3,}/g, '\n\n');
  
  console.log('[HtmlToText Debug] Cleaning up whitespace before line breaks');
  text = text.replace(/[ \t]+\n/g, '\n');
  
  console.log('[HtmlToText Debug] Cleaning up whitespace after line breaks');
  text = text.replace(/\n[ \t]+/g, '\n');
  
  const finalText = text.trim();
  console.log('[HtmlToText Debug] Final cleaned text:', finalText);
  
  return finalText;
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
          
          <Button
            type="button"
            onClick={handleContinue}
            className="gap-2"
          >
            המשך
            <ChevronRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppPublicationModal;
