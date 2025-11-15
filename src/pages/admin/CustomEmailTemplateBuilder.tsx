import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlocksList } from '@/components/admin/email-builder/BlocksList';
import { BlockEditor } from '@/components/admin/email-builder/BlockEditor';
import { EmailPreview } from '@/components/admin/email-builder/EmailPreview';
import { GradientPicker } from '@/components/admin/email-builder/GradientPicker';
import { EmailBlock, BlockType, DEFAULT_BLOCK_STYLES } from '@/types/emailBlock';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Download, 
  FileText, 
  Type, 
  Image, 
  MousePointerClick, 
  Minus, 
  FileCode,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function CustomEmailTemplateBuilder() {
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [htmlCode, setHtmlCode] = useState('');
  const [backgroundGradient, setBackgroundGradient] = useState('transparent');
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const createBlock = (type: BlockType): EmailBlock => {
    const defaultContent = type === 'header' ? 'כותרת חדשה'
      : type === 'subtitle' ? 'תת כותרת חדשה'
      : type === 'text' ? 'תוכן חדש'
      : type === 'footer' ? 'פוטר'
      : type === 'cta' ? 'לחץ כאן'
      : null;

    return {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      content: defaultContent,
      styles: {
        fontFamily: DEFAULT_BLOCK_STYLES[type]?.fontFamily || 'Heebo, Arial, sans-serif',
        fontSize: DEFAULT_BLOCK_STYLES[type]?.fontSize || '16px',
        color: DEFAULT_BLOCK_STYLES[type]?.color || '#333333',
        textAlign: DEFAULT_BLOCK_STYLES[type]?.textAlign || 'right',
        backgroundColor: DEFAULT_BLOCK_STYLES[type]?.backgroundColor || 'transparent',
        padding: DEFAULT_BLOCK_STYLES[type]?.padding || '20px',
        fontWeight: DEFAULT_BLOCK_STYLES[type]?.fontWeight || 'normal',
        lineHeight: DEFAULT_BLOCK_STYLES[type]?.lineHeight || '1.5',
      },
    };
  };

  const addBlock = (type: BlockType) => {
    const newBlock = createBlock(type);
    setBlocks([...blocks, newBlock]);
    setEditingIndex(blocks.length);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlock = (block: EmailBlock) => {
    if (editingIndex === null) return;
    const newBlocks = [...blocks];
    newBlocks[editingIndex] = block;
    setBlocks(newBlocks);
  };

  const deleteBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const duplicateBlock = (index: number) => {
    const blockToDuplicate = blocks[index];
    const newBlock: EmailBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}-${Math.random()}`,
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    
    toast({
      title: 'הצלחה',
      description: 'הבלוק שוכפל בהצלחה',
    });
  };

  const generateEmailHTML = (): string => {
    const blocksHTML = blocks.map((block) => {
      const styles = {
        fontFamily: block.styles.fontFamily,
        fontSize: block.styles.fontSize,
        color: block.styles.color,
        textAlign: block.styles.textAlign,
        background: block.styles.backgroundColor,
        padding: block.styles.padding,
        fontWeight: block.styles.fontWeight,
        lineHeight: block.styles.lineHeight || '1.6',
      };

      const styleString = Object.entries(styles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

      switch (block.type) {
        case 'header':
        case 'subtitle':
        case 'text':
        case 'footer':
          const content = (block.content || '').replace(/\n/g, '<br/>');
          return `<tr><td style="${styleString}">${content}</td></tr>`;

        case 'image':
          if (!block.imageUrl) return '';
          const imageWidth = block.imageWidth || '100%';
          const imageHeight = block.imageHeight || 'auto';
          const imageBorderRadius = block.imageBorderRadius || '0';
          return `<tr><td style="${styleString}"><img src="${block.imageUrl}" alt="" style="width: ${imageWidth}; height: ${imageHeight}; border-radius: ${imageBorderRadius}; display: block; margin: 0 auto;" /></td></tr>`;

        case 'cta':
          return `<tr><td style="text-align: ${block.styles.textAlign}; padding: ${block.styles.padding};"><a href="${block.buttonUrl || '#'}" style="display: inline-block; ${styleString} text-decoration: none; border-radius: 8px;">${block.content || 'לחץ כאן'}</a></td></tr>`;

        case 'spacer':
          return `<tr><td style="height: ${block.styles.padding}; background: ${block.styles.backgroundColor};"></td></tr>`;

        default:
          return '';
      }
    }).join('\n');

    return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateName || 'Email Template'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Heebo, Arial, sans-serif; direction: rtl; background: ${backgroundGradient};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; margin: 0 auto;">
    ${blocksHTML}
  </table>
</body>
</html>`;
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין שם לתבנית',
        variant: 'destructive',
      });
      return;
    }

    if (blocks.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'נא להוסיף לפחות בלוק אחד',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const html = generateEmailHTML();
      
      const templateData = {
        name: templateName,
        html: html,
        css: '', // We're using inline styles, so no separate CSS needed
        placeholders: JSON.stringify({ blocks, backgroundGradient }),
      };

      if (selectedTemplateId) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', selectedTemplateId);

        if (error) throw error;

        toast({
          title: 'הצלחה',
          description: 'התבנית עודכנה בהצלחה',
        });
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);

        if (error) throw error;

        toast({
          title: 'הצלחה',
          description: 'התבנית נשמרה בהצלחה',
        });
      }

      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשמירת התבנית',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      setTemplateName(data.name);
      setSelectedTemplateId(data.id);

      if (data.placeholders) {
        try {
          const parsed = typeof data.placeholders === 'string' 
            ? JSON.parse(data.placeholders) 
            : data.placeholders;
          
          // Handle both old format (array) and new format (object with blocks and backgroundGradient)
          if (Array.isArray(parsed)) {
            setBlocks(parsed);
            setBackgroundGradient('transparent');
          } else {
            setBlocks(parsed.blocks || []);
            setBackgroundGradient(parsed.backgroundGradient || 'transparent');
          }
        } catch (e) {
          console.error('Error parsing blocks:', e);
          setBlocks([]);
          setBackgroundGradient('transparent');
        }
      }

      toast({
        title: 'הצלחה',
        description: 'התבנית נטענה בהצלחה',
      });
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת התבנית',
        variant: 'destructive',
      });
    }
  };

  const exportHTML = () => {
    const html = generateEmailHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName || 'email-template'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const newTemplate = () => {
    setBlocks([]);
    setTemplateName('');
    setSelectedTemplateId('');
    setEditingIndex(null);
    setBackgroundGradient('transparent');
  };

  useEffect(() => {
    if (activeTab === 'code') {
      setHtmlCode(generateEmailHTML());
    }
  }, [activeTab, blocks, backgroundGradient]);

  return (
    <AdminLayout title="יוצר תבניות מייל מותאם אישית">
      <div className="space-y-4">
        {/* Top toolbar */}
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>שם התבנית</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="הזן שם לתבנית..."
                className="mt-1"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label>טעינת תבנית</Label>
              <div className="flex gap-2 mt-1">
                <Select value={selectedTemplateId} onValueChange={loadTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תבנית..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={newTemplate}>
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveTemplate} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                שמור
              </Button>
              <Button variant="outline" onClick={exportHTML}>
                <Download className="h-4 w-4 ml-2" />
                ייצוא HTML
              </Button>
            </div>
          </div>
        </Card>

        {/* Background settings */}
        <Card className="p-4">
          <GradientPicker value={backgroundGradient} onChange={setBackgroundGradient} />
        </Card>

        {/* Main content */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left panel - Add blocks */}
          <Card className="col-span-12 md:col-span-2 p-4">
            <h3 className="font-semibold mb-3 text-sm">הוסף בלוק</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('header')}
                className="w-full justify-start"
              >
                <Type className="h-4 w-4 ml-2" />
                כותרת
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('subtitle')}
                className="w-full justify-start"
              >
                <Type className="h-4 w-4 ml-2" />
                תת כותרת
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('text')}
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 ml-2" />
                טקסט
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('image')}
                className="w-full justify-start"
              >
                <Image className="h-4 w-4 ml-2" />
                תמונה
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('cta')}
                className="w-full justify-start"
              >
                <MousePointerClick className="h-4 w-4 ml-2" />
                כפתור
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('spacer')}
                className="w-full justify-start"
              >
                <Minus className="h-4 w-4 ml-2" />
                מרווח
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('footer')}
                className="w-full justify-start"
              >
                <FileCode className="h-4 w-4 ml-2" />
                פוטר
              </Button>
            </div>
          </Card>

          {/* Middle panel - Blocks list */}
          <Card className="col-span-12 md:col-span-4 p-4">
            <h3 className="font-semibold mb-3">הבלוקים שלי</h3>
            <BlocksList
              blocks={blocks}
              onMoveUp={(index) => moveBlock(index, 'up')}
              onMoveDown={(index) => moveBlock(index, 'down')}
              onEdit={(index) => setEditingIndex(index)}
              onDelete={deleteBlock}
              onDuplicate={duplicateBlock}
            />
          </Card>

          {/* Right panel - Preview or Editor or Code */}
          <Card className="col-span-12 md:col-span-6 p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="editor">עריכה</TabsTrigger>
                <TabsTrigger value="preview">תצוגה מקדימה</TabsTrigger>
                <TabsTrigger value="code">קוד HTML</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="mt-4">
                {editingIndex !== null && blocks[editingIndex] ? (
                  <BlockEditor
                    block={blocks[editingIndex]}
                    onUpdate={updateBlock}
                    onClose={() => setEditingIndex(null)}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>בחר בלוק לעריכה</p>
                    <p className="text-sm mt-1">לחץ על כפתור העריכה ליד הבלוק</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <EmailPreview blocks={blocks} backgroundGradient={backgroundGradient} />
              </TabsContent>

              <TabsContent value="code" className="mt-4">
                <Textarea
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="font-mono text-xs min-h-[500px]"
                  dir="ltr"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportHTML}
                  className="mt-2"
                >
                  <Download className="h-4 w-4 ml-2" />
                  הורד כקובץ HTML
                </Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
