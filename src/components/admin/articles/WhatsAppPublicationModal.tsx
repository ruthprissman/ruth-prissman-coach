
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

  // Initialize content from article
  useEffect(() => {
    if (article && isOpen) {
      setContent(article.content_markdown || '');
    }
  }, [article, isOpen]);

  // Process splits whenever content changes
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
      
      // Insert the delimiter with newlines before and after for clarity
      const newContent = `${textBeforeCursor}\n\n${SPLIT_DELIMITER}\n\n${textAfterCursor}`;
      setContent(newContent);
      
      // Set focus back to textarea and place cursor after the inserted delimiter
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPos + SPLIT_DELIMITER.length + 4; // +4 for the newlines
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
                    <div 
                      className="whitespace-pre-line text-right font-heebo" 
                      dir="rtl"
                      dangerouslySetInnerHTML={{ __html: split }}
                    />
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
