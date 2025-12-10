import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { BlocksList } from '@/components/admin/email-builder/BlocksList';
import { BlockEditor } from '@/components/admin/email-builder/BlockEditor';
import { EmailPreview } from '@/components/admin/email-builder/EmailPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmailBlock, BlockType, DEFAULT_BLOCK_STYLES, EmailBlockStyles } from '@/types/emailBlock';
import { 
  Loader2, 
  Send, 
  Eye, 
  Edit3, 
  Plus, 
  Type, 
  Image, 
  MousePointer, 
  Minus, 
  AlignRight,
  Heading1,
  Heading2,
  FileText,
  Paperclip,
  X,
  File,
  FileAudio,
  FileImage,
  Upload
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  html: string;
  css: string;
  placeholders: any;
}

interface Subscriber {
  email: string;
  first_name: string | null;
}

interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export default function MarketingEmailSender() {
  const { toast } = useToast();
  
  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // Email content
  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [backgroundGradient, setBackgroundGradient] = useState('transparent');
  
  // View mode
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
  // Sending options
  const [sendMode, setSendMode] = useState<'test' | 'specific' | 'all'>('test');
  const [testEmail, setTestEmail] = useState('ruthprissman@gmail.com');
  const [specificEmails, setSpecificEmails] = useState('');
  const [sending, setSending] = useState(false);
  
  // Subscribers
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  
  // Attachments
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  
  // Max file size for email: 10MB per file, 25MB total
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון תבניות',
        variant: 'destructive',
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const { data, error } = await supabase
        .from('content_subscribers')
        .select('email, first_name')
        .eq('is_subscribed', true);
      
      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון רשימת נמענים',
        variant: 'destructive',
      });
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    if (sendMode === 'all') {
      fetchSubscribers();
    }
  }, [sendMode]);

  // File attachment handlers
  const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new Blob with the file name stored separately
              const compressedFile = new Blob([blob], { type: 'image/jpeg' }) as File;
              Object.defineProperty(compressedFile, 'name', { value: file.name });
              Object.defineProperty(compressedFile, 'lastModified', { value: Date.now() });
              resolve(compressedFile as unknown as File);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentTotalSize = attachments.reduce((sum, a) => sum + a.size, 0);
    const newAttachments: AttachmentFile[] = [];

    for (const file of Array.from(files)) {
      // Check individual file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'קובץ גדול מדי',
          description: `${file.name} גדול מ-10MB. אנא בחר קובץ קטן יותר.`,
          variant: 'destructive',
        });
        continue;
      }

      // Check total size
      const newTotalSize = currentTotalSize + newAttachments.reduce((s, a) => s + a.size, 0) + file.size;
      if (newTotalSize > MAX_TOTAL_SIZE) {
        toast({
          title: 'גודל כולל חורג',
          description: 'סך כל הקבצים לא יכול לעלות על 25MB',
          variant: 'destructive',
        });
        break;
      }

      newAttachments.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploading: false,
        uploaded: false,
      });
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }

    // Reset input
    e.target.value = '';
  };

  const uploadAttachment = async (attachment: AttachmentFile): Promise<string | null> => {
    try {
      let fileToUpload = attachment.file;

      // Compress images if needed
      if (attachment.type.startsWith('image/') && attachment.size > 500 * 1024) {
        fileToUpload = await compressImage(attachment.file, 1200, 0.7);
        console.log(`Image compressed from ${attachment.size} to ${fileToUpload.size}`);
      }

      const fileExt = attachment.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `email-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site_file')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site_file')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }
  };

  const uploadAllAttachments = async (): Promise<Array<{ filename: string; url: string }>> => {
    const uploadedFiles: Array<{ filename: string; url: string }> = [];
    
    setUploadingAttachments(true);
    
    for (const attachment of attachments) {
      if (attachment.uploaded && attachment.url) {
        uploadedFiles.push({ filename: attachment.name, url: attachment.url });
        continue;
      }

      setAttachments(prev => 
        prev.map(a => a.id === attachment.id ? { ...a, uploading: true } : a)
      );

      const url = await uploadAttachment(attachment);
      
      if (url) {
        uploadedFiles.push({ filename: attachment.name, url });
        setAttachments(prev => 
          prev.map(a => a.id === attachment.id ? { ...a, uploading: false, uploaded: true, url } : a)
        );
      } else {
        setAttachments(prev => 
          prev.map(a => a.id === attachment.id ? { ...a, uploading: false, error: 'שגיאה בהעלאה' } : a)
        );
      }
    }
    
    setUploadingAttachments(false);
    return uploadedFiles;
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template?.placeholders) {
      try {
        const parsed = typeof template.placeholders === 'string' 
          ? JSON.parse(template.placeholders) 
          : template.placeholders;
        
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          setBlocks(parsed.blocks);
        }
        if (parsed.backgroundGradient) {
          setBackgroundGradient(parsed.backgroundGradient);
        }
      } catch (e) {
        console.error('Error parsing template placeholders:', e);
      }
    }
  };

  const createBlock = (type: BlockType): EmailBlock => ({
    id: crypto.randomUUID(),
    type,
    content: type === 'spacer' ? '' : 'תוכן חדש',
    styles: { ...DEFAULT_BLOCK_STYLES[type] } as EmailBlockStyles,
  });

  const addBlock = (type: BlockType) => {
    const newBlock = createBlock(type);
    setBlocks([...blocks, newBlock]);
    setEditingBlockIndex(blocks.length);
  };

  const updateBlock = (index: number, updatedBlock: EmailBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
  };

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
    if (editingBlockIndex === index) {
      setEditingBlockIndex(null);
    }
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setBlocks(newBlocks);
  };

  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const duplicateBlock = (index: number) => {
    const blockToDuplicate = blocks[index];
    const duplicatedBlock = {
      ...blockToDuplicate,
      id: crypto.randomUUID(),
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicatedBlock);
    setBlocks(newBlocks);
  };

  const generateEmailHTML = (): string => {
    const generateBlockHTML = (block: EmailBlock): string => {
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
          return `<div style="${styleString}">${content}</div>`;

        case 'image':
          if (!block.imageUrl) return '';
          const imageWidth = block.imageWidth || '100%';
          const imageHeight = block.imageHeight || 'auto';
          const imageBorderRadius = block.imageBorderRadius || '0';
          return `
            <div style="${styleString}">
              <img src="${block.imageUrl}" alt="Email image" style="width: ${imageWidth}; height: ${imageHeight}; border-radius: ${imageBorderRadius}; display: block; margin: 0 auto;" />
            </div>
          `;

        case 'cta':
          return `
            <div style="text-align: ${block.styles.textAlign}; padding: ${block.styles.padding}; background: transparent;">
              <a href="${block.buttonUrl || '#'}" 
                 style="display: inline-block; ${styleString} text-decoration: none; border-radius: 8px;">
                ${block.content || 'לחץ כאן'}
              </a>
            </div>
          `;

        case 'spacer':
          return `<div style="height: ${block.styles.padding}; background: ${block.styles.backgroundColor};"></div>`;

        default:
          return '';
      }
    };

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; direction: rtl; background: ${backgroundGradient};">
        <div style="padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            ${blocks.map(generateBlockHTML).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין נושא למייל',
        variant: 'destructive',
      });
      return;
    }

    if (blocks.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'יש להוסיף לפחות בלוק אחד למייל',
        variant: 'destructive',
      });
      return;
    }

    let emailList: string[] = [];
    
    if (sendMode === 'test') {
      emailList = [testEmail];
    } else if (sendMode === 'specific') {
      emailList = specificEmails.split(',').map(e => e.trim()).filter(e => e);
      if (emailList.length === 0) {
        toast({
          title: 'שגיאה',
          description: 'יש להזין כתובות מייל',
          variant: 'destructive',
        });
        return;
      }
    } else if (sendMode === 'all') {
      emailList = subscribers.map(s => s.email);
      if (emailList.length === 0) {
        toast({
          title: 'שגיאה',
          description: 'אין נמענים ברשימת התפוצה',
          variant: 'destructive',
        });
        return;
      }
    }

    setSending(true);
    try {
      // Upload attachments first
      let uploadedAttachments: Array<{ filename: string; url: string }> = [];
      if (attachments.length > 0) {
        toast({
          title: 'מעלה קבצים...',
          description: `מעלה ${attachments.length} קבצים`,
        });
        uploadedAttachments = await uploadAllAttachments();
      }

      const htmlContent = generateEmailHTML();
      
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          emailList,
          subject,
          htmlContent,
          sender: {
            name: 'רות פריסמן',
            email: 'ruth@ruthprissman.co.il',
          },
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: 'נשלח בהצלחה',
        description: `המייל נשלח ל-${emailList.length} נמענים${uploadedAttachments.length > 0 ? ` עם ${uploadedAttachments.length} קבצים` : ''}`,
      });
      
      // Clear attachments after successful send
      setAttachments([]);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'שגיאה בשליחה',
        description: 'לא ניתן לשלוח את המייל',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const blockTypes: { type: BlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'header', label: 'כותרת', icon: <Heading1 className="h-4 w-4" /> },
    { type: 'subtitle', label: 'תת כותרת', icon: <Heading2 className="h-4 w-4" /> },
    { type: 'text', label: 'טקסט', icon: <Type className="h-4 w-4" /> },
    { type: 'image', label: 'תמונה', icon: <Image className="h-4 w-4" /> },
    { type: 'cta', label: 'כפתור', icon: <MousePointer className="h-4 w-4" /> },
    { type: 'spacer', label: 'מרווח', icon: <Minus className="h-4 w-4" /> },
    { type: 'footer', label: 'פוטר', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <AdminLayout title="מייל שיווקי מותאם">
      <div className="space-y-6" dir="rtl">
        {/* Header with template selection and subject */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              הגדרות מייל
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>טעינת תבנית קיימת (אופציונלי)</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleTemplateSelect}
                  disabled={loadingTemplates}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר תבנית..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>נושא המייל *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="הזן נושא למייל..."
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main editor area */}
        <div className={`grid grid-cols-1 gap-6 ${selectedTemplateId ? 'lg:grid-cols-10' : 'lg:grid-cols-12'}`}>
          {/* Add blocks panel - only show when no template is loaded */}
          {!selectedTemplateId && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">הוספת בלוקים</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {blockTypes.map(({ type, label, icon }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock(type)}
                      className="w-full justify-start gap-2"
                    >
                      {icon}
                      {label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Blocks list */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">רשימת בלוקים</CardTitle>
                <span className="text-xs text-muted-foreground">{blocks.length} בלוקים</span>
              </CardHeader>
              <CardContent>
                <BlocksList
                  blocks={blocks}
                  onMoveUp={moveBlockUp}
                  onMoveDown={moveBlockDown}
                  onEdit={setEditingBlockIndex}
                  onDelete={deleteBlock}
                  onDuplicate={duplicateBlock}
                  editOnly={!!selectedTemplateId}
                />
              </CardContent>
            </Card>

            {/* Block editor dialog */}
            <Dialog open={editingBlockIndex !== null} onOpenChange={(open) => !open && setEditingBlockIndex(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>עריכת בלוק</DialogTitle>
                </DialogHeader>
                {editingBlockIndex !== null && blocks[editingBlockIndex] && (
                  <BlockEditor
                    block={blocks[editingBlockIndex]}
                    onUpdate={(block) => updateBlock(editingBlockIndex, block)}
                    onClose={() => setEditingBlockIndex(null)}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Preview */}
          <div className="lg:col-span-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  תצוגה מקדימה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmailPreview blocks={blocks} backgroundGradient={backgroundGradient} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              קבצים מצורפים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label 
                htmlFor="file-upload" 
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Upload className="h-4 w-4" />
                בחר קבצים
              </Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.wav,.m4a,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground">
                PDF, מסמכים, תמונות, שמע (עד 10MB לקובץ, 25MB סה"כ)
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div 
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg"
                  >
                    {getFileIcon(attachment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)}
                        {attachment.uploaded && <span className="text-green-600 mr-2">✓ הועלה</span>}
                        {attachment.error && <span className="text-destructive mr-2">{attachment.error}</span>}
                      </p>
                    </div>
                    {attachment.uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(attachment.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  סה"כ: {formatFileSize(attachments.reduce((sum, a) => sum + a.size, 0))}
                  {attachments.some(a => a.type.startsWith('image/')) && (
                    <span className="mr-2">(תמונות ידחסו אוטומטית)</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sending options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              אפשרויות שליחה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="test"
                  checked={sendMode === 'test'}
                  onCheckedChange={() => setSendMode('test')}
                />
                <Label htmlFor="test">מייל בדיקה</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="specific"
                  checked={sendMode === 'specific'}
                  onCheckedChange={() => setSendMode('specific')}
                />
                <Label htmlFor="specific">נמענים ספציפיים</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="all"
                  checked={sendMode === 'all'}
                  onCheckedChange={() => setSendMode('all')}
                />
                <Label htmlFor="all">
                  כל רשימת התפוצה
                  {sendMode === 'all' && !loadingSubscribers && (
                    <span className="text-muted-foreground mr-1">
                      ({subscribers.length} נמענים)
                    </span>
                  )}
                </Label>
              </div>
            </div>

            {sendMode === 'test' && (
              <div>
                <Label>כתובת לבדיקה</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="mt-1 max-w-md"
                  dir="ltr"
                />
              </div>
            )}

            {sendMode === 'specific' && (
              <div>
                <Label>כתובות מייל (מופרדות בפסיק)</Label>
                <Textarea
                  value={specificEmails}
                  onChange={(e) => setSpecificEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="mt-1"
                  dir="ltr"
                />
              </div>
            )}

            {sendMode === 'all' && loadingSubscribers && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                טוען רשימת נמענים...
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={sending || blocks.length === 0 || !subject.trim()}
              className="gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  שלח מייל
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
