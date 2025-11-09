import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Eye, Send, Mail, RefreshCw, Play, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmailItem {
  id: number;
  title: string;
  subject: string;
  subtitle: string;
  hero_image_url: string;
  poem_text: string;
  section1_title: string;
  section1_text: string;
  section2_title: string;
  section2_text: string;
  section3_title: string;
  section3_text: string;
  links_ref: string;
  rights_text: string;
  template_id?: string;
  render_html?: string;
  legacy_prof_content_id?: number;
  scheduled_publish?: string;
  published_at?: string;
}

interface Template {
  id: string;
  name: string;
  html: string;
  css: string;
}

interface LinkItem {
  name: string;
  url: string;
  fixed_text: string;
}

const EmailComposer: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const editorRef = useRef<HTMLIFrameElement>(null);

  const [emailItems, setEmailItems] = useState<EmailItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [currentItem, setCurrentItem] = useState<EmailItem | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [composedHtml, setComposedHtml] = useState<string>('');
  const [editableSubject, setEditableSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Load email items
  const loadEmailItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_items')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEmailItems(data || []);
    } catch (error: any) {
      console.error('Error loading email items:', error);
      toast({
        title: 'שגיאה בטעינת פריטים',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: 'שגיאה בטעינת תבניות',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Convert plain text to HTML paragraphs
  const textToHtml = (text: string): string => {
    if (!text) return '';
    
    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    return paragraphs
      .map(p => {
        // Replace single newlines with <br>
        const withBreaks = p.trim().replace(/\n/g, '<br>');
        return withBreaks ? `<p style="margin: 0.5em 0; text-align: right; direction: rtl;">${withBreaks}</p>` : '';
      })
      .filter(Boolean)
      .join('');
  };

  // Generate links block HTML
  const generateLinksBlock = async (linksRef: string): Promise<string> => {
    if (!linksRef) return '';

    try {
      const { data, error } = await supabase
        .from('static_links')
        .select('*')
        .eq('list_type', linksRef);

      if (error) throw error;

      const links = data as LinkItem[];
      if (!links || links.length === 0) return '';

      return `
        <div style="text-align: center; direction: rtl; padding: 20px 0;">
          ${links.map(link => `
            <a href="${link.url}" style="display: inline-block; margin: 5px 10px; color: #4A148C; text-decoration: none;">
              ${link.fixed_text || link.name}
            </a>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Error generating links block:', error);
      return '';
    }
  };

  // Auto-map placeholders
  const autoMapPlaceholders = useCallback(async () => {
    if (!currentItem || !currentTemplate) {
      toast({
        title: 'חסר מידע',
        description: 'יש לבחור מאמר ותבנית תחילה',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      let html = currentTemplate.html;
      const css = currentTemplate.css;

      // Generate dynamic content
      const poemHtml = textToHtml(currentItem.poem_text);
      const section1Html = textToHtml(currentItem.section1_text);
      const section2Html = textToHtml(currentItem.section2_text);
      const section3Html = textToHtml(currentItem.section3_text);
      const linksBlock = await generateLinksBlock(currentItem.links_ref);

      // Replace placeholders (support both new and legacy naming)
      const replacements: Record<string, string> = {
        '{{title}}': currentItem.title || '',
        '{{subject}}': currentItem.subject || '',
        '{{subtitle}}': currentItem.subtitle || '',
        '{{hero_image}}': currentItem.hero_image_url || '',
        '{{poem_html}}': poemHtml,
        '{{song}}': poemHtml, // Legacy support
        '{{section1_title}}': currentItem.section1_title || '',
        '{{subtitle1}}': currentItem.section1_title || '', // Legacy support
        '{{section1_html}}': section1Html,
        '{{body1}}': section1Html, // Legacy support
        '{{section2_title}}': currentItem.section2_title || '',
        '{{subtitle2}}': currentItem.section2_title || '', // Legacy support
        '{{section2_html}}': section2Html,
        '{{body2}}': section2Html, // Legacy support
        '{{section3_title}}': currentItem.section3_title || '',
        '{{subtitle3}}': currentItem.section3_title || '', // Legacy support
        '{{section3_html}}': section3Html,
        '{{body3}}': section3Html, // Legacy support
        '{{links_block}}': linksBlock,
        '{{rights_text}}': currentItem.rights_text || '',
      };

      Object.entries(replacements).forEach(([placeholder, value]) => {
        html = html.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      });

      // Build full HTML with CSS
      const fullHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${css}</style>
        </head>
        <body>${html}</body>
        </html>
      `;

      setComposedHtml(fullHtml);

      // Update iframe
      if (editorRef.current && editorRef.current.contentWindow) {
        editorRef.current.contentWindow.document.open();
        editorRef.current.contentWindow.document.write(fullHtml);
        editorRef.current.contentWindow.document.close();
      }

      toast({
        title: 'מיפוי הושלם',
        description: 'התוכן מופה בהצלחה לתבנית',
      });
    } catch (error: any) {
      console.error('Error auto-mapping:', error);
      toast({
        title: 'שגיאה במיפוי',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentItem, currentTemplate, toast]);

  // Load content and template
  const loadComposeContext = useCallback(async () => {
    if (!selectedItemId || !selectedTemplateId) {
      toast({
        title: 'בחירה חסרה',
        description: 'יש לבחור גם מאמר וגם תבנית',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Load item
      const { data: itemData, error: itemError } = await supabase
        .from('email_items')
        .select('*')
        .eq('id', selectedItemId)
        .single();

      if (itemError) throw itemError;
      setCurrentItem(itemData);
      setEditableSubject(itemData.subject || '');

      // Load template
      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', selectedTemplateId)
        .single();

      if (templateError) throw templateError;
      setCurrentTemplate(templateData);

      toast({
        title: 'טעינה הושלמה',
        description: 'המאמר והתבנית נטענו בהצלחה',
      });
    } catch (error: any) {
      console.error('Error loading context:', error);
      toast({
        title: 'שגיאה בטעינה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedItemId, selectedTemplateId, toast]);

  // Save composed email
  const saveComposed = useCallback(async () => {
    if (!currentItem || !composedHtml) {
      toast({
        title: 'אין מה לשמור',
        description: 'יש למפות תוכן תחילה',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      // Update email_items
      const { data: updatedItem, error: updateError } = await supabase
        .from('email_items')
        .update({
          render_html: composedHtml,
          template_id: selectedTemplateId,
          subject: editableSubject,
        })
        .eq('id', currentItem.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Upsert to professional_content
      let legacyId = currentItem.legacy_prof_content_id;

      if (!legacyId) {
        // Insert new
        const { data: newContent, error: insertError } = await supabase
          .from('professional_content')
          .insert({
            title: currentItem.title,
            image_url: currentItem.hero_image_url,
            content_markdown: composedHtml,
            scheduled_publish: currentItem.scheduled_publish,
            published_at: currentItem.published_at,
            type: 'article',
            contact_email: 'ruth@ruthprissman.co.il',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        legacyId = newContent.id;

        // Update email_items with legacy_prof_content_id
        await supabase
          .from('email_items')
          .update({ legacy_prof_content_id: legacyId })
          .eq('id', currentItem.id);
      } else {
        // Update existing
        const { error: legacyUpdateError } = await supabase
          .from('professional_content')
          .update({
            title: currentItem.title,
            image_url: currentItem.hero_image_url,
            content_markdown: composedHtml,
            scheduled_publish: currentItem.scheduled_publish,
            published_at: currentItem.published_at,
          })
          .eq('id', legacyId);

        if (legacyUpdateError) throw legacyUpdateError;
      }

      toast({
        title: 'נשמר בהצלחה',
        description: `המייל נשמר (ID: ${currentItem.id}, Legacy: ${legacyId})`,
      });

      return { emailItemId: currentItem.id, legacyId };
    } catch (error: any) {
      console.error('Error saving composed email:', error);
      toast({
        title: 'שגיאה בשמירה',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentItem, composedHtml, selectedTemplateId, editableSubject, toast]);

  // Send test email
  const sendTest = useCallback(async () => {
    if (!composedHtml || !editableSubject) {
      toast({
        title: 'מידע חסר',
        description: 'יש למפות ולשמור תוכן תחילה',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'ruth@ruthprissman.co.il',
          subject: editableSubject,
          html: composedHtml,
        },
      });

      if (error) throw error;

      toast({
        title: 'נשלח בהצלחה',
        description: 'מייל הטסט נשלח ל-ruth@ruthprissman.co.il',
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: 'שגיאה בשליחה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [composedHtml, editableSubject, toast]);

  // Send to recipients
  const sendToRecipients = useCallback(async () => {
    if (!composedHtml || !editableSubject) {
      toast({
        title: 'מידע חסר',
        description: 'יש למפות ולשמור תוכן תחילה',
        variant: 'destructive',
      });
      return;
    }

    setShowSendDialog(true);
  }, [composedHtml, editableSubject, toast]);

  // Perform actual send
  const performSend = useCallback(async () => {
    setIsLoading(true);
    setShowSendDialog(false);

    try {
      // Get all subscribed recipients
      const { data: subscribers, error: subsError } = await supabase
        .from('content_subscribers')
        .select('email')
        .eq('is_subscribed', true);

      if (subsError) throw subsError;

      const recipients = subscribers?.map(s => s.email) || [];

      if (recipients.length === 0) {
        toast({
          title: 'אין נמענים',
          description: 'לא נמצאו נמענים פעילים',
          variant: 'destructive',
        });
        return;
      }

      // Use existing edge function
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          recipients,
          subject: editableSubject,
          html: composedHtml,
        },
      });

      if (error) throw error;

      toast({
        title: 'נשלח בהצלחה',
        description: `המייל נשלח ל-${recipients.length} נמענים`,
      });
    } catch (error: any) {
      console.error('Error sending to recipients:', error);
      toast({
        title: 'שגיאה בשליחה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [composedHtml, editableSubject, toast]);

  // Load data on mount
  useEffect(() => {
    loadEmailItems();
    loadTemplates();
  }, [loadEmailItems, loadTemplates]);

  // Expose window API
  useEffect(() => {
    (window as any).loadComposeContext = loadComposeContext;
    (window as any).autoMapPlaceholders = autoMapPlaceholders;
    (window as any).getComposedHtml = () => composedHtml;
    (window as any).saveComposed = saveComposed;
    (window as any).sendTest = sendTest;
    (window as any).sendToRecipients = sendToRecipients;

    return () => {
      delete (window as any).loadComposeContext;
      delete (window as any).autoMapPlaceholders;
      delete (window as any).getComposedHtml;
      delete (window as any).saveComposed;
      delete (window as any).sendTest;
      delete (window as any).sendToRecipients;
    };
  }, [loadComposeContext, autoMapPlaceholders, composedHtml, saveComposed, sendTest, sendToRecipients]);

  return (
    <AdminLayout title="הרכבת מייל ושליחה">
      <div className="space-y-6">
        {/* Top controls */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>בחרי מאמר</Label>
              <Select value={selectedItemId?.toString() || ''} onValueChange={(val) => setSelectedItemId(parseInt(val))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר מאמר..." />
                </SelectTrigger>
                <SelectContent>
                  {emailItems.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>בחרי תבנית</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר תבנית..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>נושא המייל (Subject)</Label>
              <Input
                value={editableSubject}
                onChange={(e) => setEditableSubject(e.target.value)}
                placeholder="נושא המייל..."
                className="mt-1"
                dir="rtl"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={loadComposeContext} disabled={isLoading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              טעינה
            </Button>
            <Button onClick={autoMapPlaceholders} disabled={isLoading || !currentItem || !currentTemplate} className="gap-2">
              <Play className="h-4 w-4" />
              מיפוי אוטומטי
            </Button>
            <Button onClick={saveComposed} disabled={isLoading || !composedHtml} variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              שמירה
            </Button>
            <Button onClick={() => setShowPreview(true)} disabled={!composedHtml} variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              תצוגה מקדימה
            </Button>
            <Button onClick={sendTest} disabled={isLoading || !composedHtml} variant="secondary" className="gap-2">
              <Send className="h-4 w-4" />
              שלח טסט
            </Button>
            <Button onClick={sendToRecipients} disabled={isLoading || !composedHtml} className="gap-2">
              <Mail className="h-4 w-4" />
              שליחה לנמענים
            </Button>
          </div>
        </Card>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Raw content */}
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-4">תוכן גולמי</h3>
            <ScrollArea className="h-[600px]">
              {currentItem ? (
                <div className="space-y-4 text-sm" dir="rtl">
                  <div>
                    <strong>כותרת:</strong>
                    <p className="mt-1 text-muted-foreground">{currentItem.title}</p>
                  </div>
                  <Separator />
                  <div>
                    <strong>כותרת משנית:</strong>
                    <p className="mt-1 text-muted-foreground">{currentItem.subtitle}</p>
                  </div>
                  <Separator />
                  <div>
                    <strong>שיר:</strong>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{currentItem.poem_text}</p>
                  </div>
                  <Separator />
                  <div>
                    <strong>{currentItem.section1_title}:</strong>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{currentItem.section1_text}</p>
                  </div>
                  <Separator />
                  <div>
                    <strong>{currentItem.section2_title}:</strong>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{currentItem.section2_text}</p>
                  </div>
                  <Separator />
                  <div>
                    <strong>{currentItem.section3_title}:</strong>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{currentItem.section3_text}</p>
                  </div>
                  <Separator />
                  <div>
                    <strong>זכויות:</strong>
                    <p className="mt-1 text-muted-foreground">{currentItem.rights_text}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  בחר מאמר לצפייה בתוכן
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Right: Template preview */}
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-4">תצוגה</h3>
            <div className="border rounded h-[600px] bg-gray-50">
              {composedHtml ? (
                <iframe
                  ref={editorRef}
                  className="w-full h-full"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  לחץ על "מיפוי אוטומטי" לצפייה בתבנית
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>תצוגה מקדימה</DialogTitle>
            <DialogDescription>
              <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="desktop">דסקטופ</TabsTrigger>
                  <TabsTrigger value="mobile">מובייל</TabsTrigger>
                </TabsList>
              </Tabs>
            </DialogDescription>
          </DialogHeader>
          <div className={`border rounded bg-white ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
            <iframe
              srcDoc={composedHtml}
              className="w-full h-[70vh]"
              title="Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שליחה לנמענים</DialogTitle>
            <DialogDescription>
              האם את בטוחה שברצונך לשלוח את המייל לכל הנמענים הפעילים?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              ביטול
            </Button>
            <Button onClick={performSend} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שלח'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default EmailComposer;