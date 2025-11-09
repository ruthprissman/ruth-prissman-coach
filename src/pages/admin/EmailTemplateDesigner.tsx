import React, { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  FolderOpen, 
  FileCode, 
  Eye, 
  Monitor, 
  Smartphone, 
  FileText,
  Palette
} from 'lucide-react';
import grapesjs from 'grapesjs';
import grapesjsPresetNewsletter from 'grapesjs-preset-newsletter';
import 'grapesjs/dist/css/grapes.min.css';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EmailTemplateDesigner: React.FC = () => {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState('');
  const [showPlaceholderPanel, setShowPlaceholderPanel] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [placeholders, setPlaceholders] = useState<Record<string, string>>({
    title: '',
    subtitle: '',
    body: '',
    cta_text: '',
    cta_url: '',
    hero_image: ''
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize GrapesJS with Newsletter preset
    const editor = grapesjs.init({
      container: containerRef.current,
      height: '700px',
      width: 'auto',
      fromElement: false,
      storageManager: false,
      
      plugins: [grapesjsPresetNewsletter],
      pluginsOpts: {
        'grapesjs-preset-newsletter': {
          modalTitleImport: 'ייבוא תבנית',
          modalLabelImport: 'הדבק כאן את קוד ה-HTML',
          modalLabelExport: 'העתק את הקוד',
          codeViewerTheme: 'material',
          importPlaceholder: '<table class="main-body">...',
          cellStyle: {
            'font-size': '16px',
            'font-weight': '300',
            'vertical-align': 'top',
            'color': '#4A148C',
            'margin': '0',
            'padding': '0',
          }
        }
      },

      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=Alef:wght@400;700&family=Rubik:wght@300;400;500;600;700&family=Assistant:wght@300;400;500;600;700;800&family=Frank+Ruhl+Libre:wght@300;400;500;700;900&family=Varela+Round&family=Open+Sans+Hebrew:wght@300;400;700&display=swap'
        ]
      },

      assetManager: {
        uploadText: 'גרור תמונות לכאן או לחץ להעלאה',
        addBtnText: 'הוסף תמונה',
        modalTitle: 'בחר תמונה'
      },

      styleManager: {
        sectors: [{
          name: 'גופנים ועיצוב',
          open: true,
          buildProps: ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color', 'text-align'],
        }, {
          name: 'רקע',
          open: false,
          buildProps: ['background-color', 'background-image', 'background-repeat', 'background-position', 'background-size'],
        }, {
          name: 'מרווחים',
          open: false,
          buildProps: ['padding', 'margin'],
        }, {
          name: 'גבולות',
          open: false,
          buildProps: ['border', 'border-radius'],
        }]
      },

      deviceManager: {
        devices: [{
          name: 'Desktop',
          width: '600px',
        }, {
          name: 'Mobile',
          width: '320px',
          widthMedia: '480px',
        }]
      }
    });

    // RTL configuration
    editor.on('load', () => {
      const canvas = editor.Canvas.getBody();
      if (canvas) {
        canvas.style.direction = 'rtl';
      }

      // Add Hebrew font to default styles
      const wrapper = editor.getWrapper();
      if (wrapper) {
        wrapper.setStyle({
          'font-family': 'Heebo, Arial, sans-serif',
          'direction': 'rtl',
          'text-align': 'center'
        });
      }

      // Customize font-family property with Hebrew fonts
      const styleManager = editor.StyleManager;
      const fontFamilyProp = styleManager.getProperty('גופנים ועיצוב', 'font-family');
      if (fontFamilyProp) {
        fontFamilyProp.set('options', [
          { value: 'Heebo, Arial, sans-serif', name: 'Heebo - היבו' },
          { value: 'Alef, Arial, sans-serif', name: 'Alef - אלף' },
          { value: 'Rubik, Arial, sans-serif', name: 'Rubik - רוביק' },
          { value: 'Assistant, Arial, sans-serif', name: 'Assistant - אסיסטנט' },
          { value: '"Frank Ruhl Libre", serif', name: 'Frank Ruhl Libre - פרנק רוהל' },
          { value: '"Varela Round", Arial, sans-serif', name: 'Varela Round - וארלה' },
          { value: '"Open Sans Hebrew", Arial, sans-serif', name: 'Open Sans Hebrew' },
          { value: 'Arial, sans-serif', name: 'Arial' },
          { value: 'Helvetica, sans-serif', name: 'Helvetica' },
          { value: 'Times New Roman, serif', name: 'Times New Roman' },
          { value: 'Georgia, serif', name: 'Georgia' },
        ]);
      }
    });

    // Custom commands for Hebrew UI
    editor.Commands.add('show-html', {
      run: (editor: any) => {
        const html = editor.getHtml();
        const css = editor.getCss();
        const fullHtml = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>${html}</body>
</html>`;
        
        const modal = editor.Modal;
        modal.setTitle('קוד HTML');
        modal.setContent(`<textarea style="width:100%; height:400px; direction:ltr;" readonly>${fullHtml}</textarea>`);
        modal.open();
      }
    });

    editor.Commands.add('preview', {
      run: (editor: any) => {
        const html = editor.getHtml();
        const css = editor.getCss();
        const fullHtml = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>${html}</body>
</html>`;
        
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(fullHtml);
          previewWindow.document.close();
        }
      }
    });

    // Customize panels with Hebrew labels
    editor.Panels.removeButton('options', 'export-template');
    editor.Panels.removeButton('options', 'gjs-open-import-webpage');
    
    editor.Panels.addButton('options', {
      id: 'save-template',
      className: 'fa fa-save',
      command: 'save-template',
      attributes: { title: 'שמור תבנית' }
    });

    editor.Panels.addButton('options', {
      id: 'show-html-btn',
      className: 'fa fa-code',
      command: 'show-html',
      attributes: { title: 'הצג קוד HTML' }
    });

    editor.Panels.addButton('options', {
      id: 'preview-btn',
      className: 'fa fa-eye',
      command: 'preview',
      attributes: { title: 'תצוגה מקדימה' }
    });

    // Add starter template
    editor.setComponents(`
      <table style="width: 100%; max-width: 600px; margin: 0 auto; font-family: Heebo, Arial, sans-serif; direction: rtl;">
        <tr>
          <td style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <h1 style="color: white; font-family: Alef, Arial, sans-serif; font-size: 32px; margin: 0;">{{title}}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 20px; text-align: center; background-color: #ffffff;">
            <img src="{{hero_image}}" alt="תמונה ראשית" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;" />
            <h2 style="font-family: Alef, Arial, sans-serif; color: #4A148C; font-size: 24px;">{{subtitle}}</h2>
            <p style="font-size: 16px; line-height: 1.8; color: #4A148C; text-align: center;">{{body}}</p>
            <table style="width: 100%; margin: 30px 0;">
              <tr>
                <td style="text-align: center;">
                  <a href="{{cta_url}}" style="display: inline-block; padding: 14px 40px; background-color: #4A148C; color: white; text-decoration: none; border-radius: 4px; font-family: Alef, Arial, sans-serif; font-weight: bold;">{{cta_text}}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #f5f5f5; color: #666; font-size: 14px;">
            <p style="margin: 5px 0;">© 2025 רות פריסמן. כל הזכויות שמורות.</p>
          </td>
        </tr>
      </table>
    `);

    editorRef.current = editor;

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון תבניות',
        variant: 'destructive'
      });
      return;
    }

    setSavedTemplates(data || []);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSave = async () => {
    if (!editorRef.current) return;
    
    if (!templateName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לתבנית',
        variant: 'destructive'
      });
      return;
    }

    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();

    let error;

    if (currentTemplateId) {
      // Update existing template
      const result = await supabase
        .from('email_templates')
        .update({
          name: templateName,
          html,
          css,
          placeholders,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentTemplateId);
      
      error = result.error;
    } else {
      // Insert new template
      const result = await supabase
        .from('email_templates')
        .insert({
          name: templateName,
          html,
          css,
          placeholders
        });
      
      error = result.error;
    }

    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את התבנית',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: currentTemplateId ? 'התבנית עודכנה' : 'התבנית נשמרה',
      description: `התבנית "${templateName}" ${currentTemplateId ? 'עודכנה' : 'נשמרה'} בהצלחה במערכת`
    });

    await loadTemplates();
  };

  const handleLoadTemplate = async (templateId: string) => {
    if (!templateId || !editorRef.current) return;

    const template = savedTemplates.find(t => t.id === templateId);
    if (!template) return;

    editorRef.current.setComponents(template.html);
    editorRef.current.setStyle(template.css);
    setTemplateName(template.name);
    setCurrentTemplateId(template.id);
    setPlaceholders(template.placeholders || {});

    toast({
      title: 'התבנית נטענה',
      description: `התבנית "${template.name}" נטענה בהצלחה`
    });
  };

  const handleExportHtml = () => {
    if (!editorRef.current) return;

    const html = editorRef.current.getHtml();
    const css = editorRef.current.getCss();
    const fullHtml = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>${html}</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName || 'template'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'הקובץ יוצא',
      description: 'קובץ ה-HTML הורד בהצלחה'
    });
  };

  return (
    <AdminLayout title="עיצוב תבניות אימייל">
      <div className="space-y-6">
        {/* Top toolbar */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="template-name">שם התבנית</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="הזן שם לתבנית..."
                className="mt-1"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="load-template">טען תבנית שמורה</Label>
              <Select value={selectedTemplateId} onValueChange={(value) => {
                setSelectedTemplateId(value);
                handleLoadTemplate(value);
              }}>
                <SelectTrigger className="mt-1">
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
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                {currentTemplateId ? 'עדכן תבנית' : 'שמור כחדש'}
              </Button>

              {currentTemplateId && (
                <Button 
                  onClick={() => {
                    setCurrentTemplateId(null);
                    setTemplateName('');
                    setSelectedTemplateId('');
                  }} 
                  variant="outline" 
                  className="gap-2"
                >
                  תבנית חדשה
                </Button>
              )}
              
              <Button onClick={handleExportHtml} variant="outline" className="gap-2">
                <FileCode className="h-4 w-4" />
                ייצוא HTML
              </Button>

              <Button 
                onClick={() => setShowPlaceholderPanel(!showPlaceholderPanel)} 
                variant="outline" 
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                אסימונים
              </Button>
            </div>
          </div>
        </Card>

        {/* Placeholder panel */}
        {showPlaceholderPanel && (
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-4">אסימוני תוכן (Placeholders)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(placeholders).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`placeholder-${key}`}>
                    {`{{${key}}}`}
                  </Label>
                  <Input
                    id={`placeholder-${key}`}
                    value={value}
                    onChange={(e) => setPlaceholders(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`ערך לדוגמה ל-${key}`}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              * השתמש באסימונים אלו בעורך (למשל: {`{{title}}`}, {`{{hero_image}}`}). 
              בעת השליחה, הם יוחלפו בתוכן בפועל.
            </p>
          </Card>
        )}

        {/* Editor container */}
        <Card className="p-4">
          <div 
            ref={containerRef} 
            style={{ 
              minHeight: '700px',
              direction: 'ltr' // GrapesJS needs LTR for its UI
            }}
          />
        </Card>

        {/* Info panel */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">הערות חשובות:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>התבניות נשמרות בבסיס הנתונים</li>
            <li>השתמש בגופן Heebo לתמיכה מלאה בעברית</li>
            <li>התבניות מותאמות ל-Gmail, Apple Mail ו-Yahoo</li>
            <li>כפתורים נוצרים עם טבלאות לתאימות מקסימלית</li>
            <li>ניתן לטעון תבניות שמורות ולערוך אותן</li>
            <li>בהמשך ניתן יהיה לקשר תבניות למאמרים לשליחה</li>
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EmailTemplateDesigner;
