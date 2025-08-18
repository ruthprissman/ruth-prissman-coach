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
import { ChevronRight, SplitSquareVertical, Eye, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (content: string) => void;
  article: Article | null;
}

const PAGE_DELIMITER = '---page---';

const convertHtmlToText = (html: string): string => {
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
          return Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n\n';
        
        case 'div':
          return Array.from(element.childNodes)
            .map(processNode)
            .join('') + '\n\n';
        
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

const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  article,
}) => {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('edit');

  useEffect(() => {
    if (article && isOpen) {
      const plainText = convertHtmlToText(article.content_markdown || '');
      setContent(plainText);
    }
  }, [article, isOpen]);

  useEffect(() => {
    if (content.includes(PAGE_DELIMITER)) {
      const contentPages = content.split(PAGE_DELIMITER).map(page => page.trim());
      setPages(contentPages.filter(page => page.length > 0));
    } else {
      setPages([content]);
    }
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleInsertPageDelimiter = () => {
    const textarea = document.getElementById('pdf-content') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPos);
      const textAfterCursor = content.substring(cursorPos);
      
      const newContent = `${textBeforeCursor}\n\n${PAGE_DELIMITER}\n\n${textAfterCursor}`;
      setContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPos + PAGE_DELIMITER.length + 4;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
      
      toast({
        title: "מפריד עמוד נוסף",
        description: "המפריד נוסף בהצלחה. התוכן יחולק לעמודים לפי המיקום הזה.",
      });
    }
  };

  const handleExport = () => {
    if (pages.length === 0) {
      toast({
        title: "אין תוכן",
        description: "נא להוסיף תוכן לפני יצוא ל-PDF",
        variant: "destructive",
      });
      return;
    }
    
    onExport(content);
  };

  const renderFormattedContent = (content: string) => {
    return (
      <div className="whitespace-pre-line text-right font-heebo text-sm p-4 bg-white border rounded-lg shadow-sm" dir="rtl">
        {content}
      </div>
    );
  };

  const getPagePreviewStyle = () => {
    return {
      minHeight: '200px',
      maxHeight: '300px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: 'white',
      padding: '16px',
      fontSize: '12px',
      lineHeight: '1.5',
      overflow: 'hidden',
      position: 'relative' as const,
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl mx-auto font-heebo" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">יצוא ל-PDF</DialogTitle>
          <DialogDescription>
            ערוך את התוכן והוסף מפרידי עמודים כדי לחלק את המאמר לעמודים נפרדים ב-PDF
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
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="pdf-content" className="text-md font-medium">
                  תוכן המאמר
                </Label>
                <Button
                  onClick={handleInsertPageDelimiter}
                  variant="outline"
                  size="sm"
                  className="flex gap-1 items-center"
                >
                  <SplitSquareVertical className="h-4 w-4" />
                  הוסף מפריד עמוד
                </Button>
              </div>
              
              <Textarea
                id="pdf-content"
                value={content}
                onChange={handleContentChange}
                placeholder="תוכן המאמר..."
                dir="rtl"
                className="min-h-[400px] text-right font-heebo border-2 p-4"
              />
              
              <p className="text-sm text-gray-500">
                הוסף <code className="bg-gray-100 px-1 rounded">{PAGE_DELIMITER}</code> בכל מקום שבו תרצה לפצל את המאמר לעמוד חדש
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center mb-2 gap-2">
              <FileText className="h-5 w-5" />
              <Label className="text-md font-medium">תצוגה מקדימה של עמודי PDF</Label>
            </div>
            
            <ScrollArea className="border rounded-md h-[400px] p-4">
              <div className="space-y-6">
                {pages.map((page, index) => (
                  <div 
                    key={index}
                    className="relative"
                  >
                    <div className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded mb-2 inline-block">
                      עמוד {index + 1} מתוך {pages.length}
                    </div>
                    <div style={getPagePreviewStyle()}>
                      <div className="whitespace-pre-line text-right font-heebo text-xs" dir="rtl">
                        {page}
                      </div>
                      {page.length > 800 && (
                        <div className="absolute bottom-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          עמוד ארוך - עלול להיחתך
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {pages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    אין תוכן להצגה
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="text-sm text-gray-500 flex justify-between items-center">
              <span>סה״כ {pages.length} עמודים</span>
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
            onClick={handleExport}
            className="gap-2"
          >
            יצא ל-PDF
            <ChevronRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFExportModal;