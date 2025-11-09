import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, FileText, Trash2, Plus, Eye, Palette } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

interface EmailItem {
  id?: number;
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
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface RecentItem {
  id: number;
  title: string;
  updated_at: string;
}

const DRAFT_KEY = 'email_items:draft';
const AUTOSAVE_INTERVAL = 10000; // 10 seconds

const EmailItemsEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<EmailItem>({
    title: '',
    subject: '',
    subtitle: '',
    hero_image_url: '',
    poem_text: '',
    section1_title: 'דקה לפני התפילה',
    section1_text: '',
    section2_title: 'מילה עם משמעות',
    section2_text: '',
    section3_title: 'מילה של הלכה',
    section3_text: '',
    links_ref: '',
    rights_text: 'כל הזכויות שמורות',
    status: 'draft',
  });

  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [linkGroups, setLinkGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Load recent items
  const loadRecentItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_items')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentItems(data || []);
    } catch (error: any) {
      console.error('Error loading recent items:', error);
    }
  }, []);

  // Load link groups from static_links
  const loadLinkGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('static_links')
        .select('list_type')
        .not('list_type', 'is', null);

      if (error) throw error;
      
      const uniqueGroups = [...new Set(data?.map(item => item.list_type).filter(Boolean))];
      setLinkGroups(uniqueGroups as string[]);
    } catch (error: any) {
      console.error('Error loading link groups:', error);
    }
  }, []);

  // Load item by ID
  const loadItem = useCallback(async (itemId: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData(data);
        toast({
          title: 'נטען בהצלחה',
          description: `הפריט "${data.title}" נטען`,
        });
      }
    } catch (error: any) {
      console.error('Error loading item:', error);
      toast({
        title: 'שגיאה בטעינה',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save item
  const saveItem = useCallback(async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'שדה חובה חסר',
        description: 'יש למלא כותרת',
        variant: 'destructive',
      });
      return null;
    }

    // Basic URL validation for hero_image_url
    if (formData.hero_image_url && !formData.hero_image_url.match(/^https?:\/\/.+/)) {
      toast({
        title: 'כתובת תמונה לא תקינה',
        description: 'יש להזין כתובת URL תקינה',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      // Compute full_plain_text
      const full_plain_text = [
        formData.title,
        formData.subject,
        formData.subtitle,
        formData.poem_text,
        formData.section1_title,
        formData.section1_text,
        formData.section2_title,
        formData.section2_text,
        formData.section3_title,
        formData.section3_text,
      ].filter(Boolean).join('\n\n');

      const dataToSave = {
        ...formData,
        full_plain_text,
      };

      let result;
      if (id) {
        // Update existing
        const numericId = parseInt(id, 10);
        const { data, error } = await supabase
          .from('email_items')
          .update(dataToSave)
          .eq('id', numericId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('email_items')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      toast({
        title: 'נשמר בהצלחה',
        description: `מזהה: ${result.id}`,
      });

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);

      // Reload recent items
      loadRecentItems();

      // Navigate to edit page if it was a new item
      if (!id && result.id) {
        navigate(`/admin/email-items/${result.id}`);
      }

      return result;
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast({
        title: 'שגיאה בשמירה',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [formData, id, toast, loadRecentItems, navigate]);

  // Clear form
  const clearForm = useCallback(() => {
    setFormData({
      title: '',
      subject: '',
      subtitle: '',
      hero_image_url: '',
      poem_text: '',
      section1_title: 'דקה לפני התפילה',
      section1_text: '',
      section2_title: 'מילה עם משמעות',
      section2_text: '',
      section3_title: 'מילה של הלכה',
      section3_text: '',
      links_ref: '',
      rights_text: 'כל הזכויות שמורות',
      status: 'draft',
    });
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    navigate('/admin/email-items/new');
  }, [navigate]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        toast({
          title: 'טיוטה שוחזרה',
          description: 'הטיוטה השמורה נטענה בהצלחה',
        });
      } catch (error) {
        console.error('Error restoring draft:', error);
      }
    }
  }, [toast]);

  // Autosave draft
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.title || formData.subject || formData.section1_text) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        console.log('Draft autosaved');
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [formData]);

  // Check for draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    setHasDraft(!!draft);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadRecentItems();
    loadLinkGroups();
    
    if (id) {
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        loadItem(numericId);
      }
    }
  }, [id, loadRecentItems, loadLinkGroups, loadItem]);

  // Expose window API
  useEffect(() => {
    (window as any).saveEmailItem = saveItem;
    (window as any).loadEmailItem = loadItem;
    (window as any).getCurrentRawValues = () => formData;
    (window as any).listRecentEmailItems = loadRecentItems;

    return () => {
      delete (window as any).saveEmailItem;
      delete (window as any).loadEmailItem;
      delete (window as any).getCurrentRawValues;
      delete (window as any).listRecentEmailItems;
    };
  }, [saveItem, loadItem, formData, loadRecentItems]);

  const handleInputChange = (field: keyof EmailItem, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout title="הזנת תוכן גולמי">
      <div className="flex gap-6">
        {/* Main form area */}
        <div className="flex-1">
          <Card className="p-6">
            {/* Top actions */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <Button onClick={saveItem} disabled={isLoading} className="gap-2">
                <Save className="h-4 w-4" />
                שמור
              </Button>
              <Button onClick={clearForm} variant="outline" className="gap-2">
                <Trash2 className="h-4 w-4" />
                נקה טופס
              </Button>
              <Button onClick={() => setShowPreview(true)} variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                תצוגת תקציר
              </Button>
              <Button 
                onClick={() => navigate('/admin/email-templates')} 
                variant="ghost" 
                className="gap-2"
              >
                <Palette className="h-4 w-4" />
                עיצוב תבניות
              </Button>
              {hasDraft && (
                <Button onClick={restoreDraft} variant="secondary" className="gap-2">
                  <FileText className="h-4 w-4" />
                  שחזור טיוטה
                </Button>
              )}
            </div>

            <Separator className="mb-6" />

            {/* Form fields */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-bold">
                  כותרת <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="כותרת ראשית"
                  className="mt-2"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="subject">נושא המייל</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="נושא המייל (אופציונלי)"
                  className="mt-2"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">כותרת ביניים</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="כותרת משנית (אופציונלי)"
                  className="mt-2"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="hero_image_url">תמונה</Label>
                <Input
                  id="hero_image_url"
                  value={formData.hero_image_url}
                  onChange={(e) => handleInputChange('hero_image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                  dir="ltr"
                />
              </div>

              <div>
                <Label htmlFor="poem_text">שיר קצר</Label>
                <Textarea
                  id="poem_text"
                  value={formData.poem_text}
                  onChange={(e) => handleInputChange('poem_text', e.target.value)}
                  placeholder="שיר או ציטוט קצר..."
                  className="mt-2 min-h-[100px]"
                  dir="rtl"
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="section1_title">כותרת חלק 1</Label>
                <Input
                  id="section1_title"
                  value={formData.section1_title}
                  onChange={(e) => handleInputChange('section1_title', e.target.value)}
                  className="mt-2"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="section1_text">טקסט חלק 1</Label>
                <Textarea
                  id="section1_text"
                  value={formData.section1_text}
                  onChange={(e) => handleInputChange('section1_text', e.target.value)}
                  placeholder="תוכן החלק הראשון..."
                  className="mt-2 min-h-[150px]"
                  dir="rtl"
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="section2_title">כותרת חלק 2</Label>
                <Input
                  id="section2_title"
                  value={formData.section2_title}
                  onChange={(e) => handleInputChange('section2_title', e.target.value)}
                  className="mt-2"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="section2_text">טקסט חלק 2</Label>
                <Textarea
                  id="section2_text"
                  value={formData.section2_text}
                  onChange={(e) => handleInputChange('section2_text', e.target.value)}
                  placeholder="תוכן החלק השני..."
                  className="mt-2 min-h-[150px]"
                  dir="rtl"
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="section3_title">כותרת חלק 3</Label>
                <Input
                  id="section3_title"
                  value={formData.section3_title}
                  onChange={(e) => handleInputChange('section3_title', e.target.value)}
                  className="mt-2"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="section3_text">טקסט חלק 3</Label>
                <Textarea
                  id="section3_text"
                  value={formData.section3_text}
                  onChange={(e) => handleInputChange('section3_text', e.target.value)}
                  placeholder="תוכן החלק השלישי..."
                  className="mt-2 min-h-[150px]"
                  dir="rtl"
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="links_ref">מזהה סט קישורים</Label>
                <Select value={formData.links_ref} onValueChange={(value) => handleInputChange('links_ref', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="בחר סט קישורים..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ללא קישורים</SelectItem>
                    {linkGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rights_text">זכויות</Label>
                <Input
                  id="rights_text"
                  value={formData.rights_text}
                  onChange={(e) => handleInputChange('rights_text', e.target.value)}
                  className="mt-2"
                  dir="rtl"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right sidebar - Recent items */}
        <div className="w-80">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">פריטים אחרונים</h3>
              <Button onClick={clearForm} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                חדש
              </Button>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {recentItems.map((item) => (
                <Card
                  key={item.id}
                  className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                    id === item.id.toString() ? 'bg-accent' : ''
                  }`}
                  onClick={() => navigate(`/admin/email-items/${item.id}`)}
                >
                  <div className="font-medium text-sm line-clamp-2">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(item.updated_at).toLocaleDateString('he-IL')}
                  </div>
                </Card>
              ))}
              {recentItems.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  אין פריטים שמורים
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>תצוגת תקציר</DialogTitle>
            <DialogDescription>
              תצוגה מקדימה של התוכן (טקסט גולמי)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 whitespace-pre-wrap text-right" dir="rtl">
            {formData.title && (
              <div>
                <strong className="text-lg">כותרת:</strong>
                <p className="mt-1">{formData.title}</p>
              </div>
            )}
            {formData.subject && (
              <div>
                <strong>נושא:</strong>
                <p className="mt-1">{formData.subject}</p>
              </div>
            )}
            {formData.subtitle && (
              <div>
                <strong>כותרת משנית:</strong>
                <p className="mt-1">{formData.subtitle}</p>
              </div>
            )}
            {formData.hero_image_url && (
              <div>
                <strong>תמונה:</strong>
                <p className="mt-1 text-sm text-muted-foreground">{formData.hero_image_url}</p>
              </div>
            )}
            {formData.poem_text && (
              <div>
                <strong>שיר:</strong>
                <p className="mt-1">{formData.poem_text}</p>
              </div>
            )}
            <Separator />
            {formData.section1_text && (
              <div>
                <strong>{formData.section1_title}:</strong>
                <p className="mt-1">{formData.section1_text}</p>
              </div>
            )}
            <Separator />
            {formData.section2_text && (
              <div>
                <strong>{formData.section2_title}:</strong>
                <p className="mt-1">{formData.section2_text}</p>
              </div>
            )}
            <Separator />
            {formData.section3_text && (
              <div>
                <strong>{formData.section3_title}:</strong>
                <p className="mt-1">{formData.section3_text}</p>
              </div>
            )}
            {formData.rights_text && (
              <div className="text-sm text-muted-foreground">
                {formData.rights_text}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default EmailItemsEditor;