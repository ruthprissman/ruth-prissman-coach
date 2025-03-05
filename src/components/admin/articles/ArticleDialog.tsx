
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Calendar as CalendarIcon, Save, EyeIcon } from 'lucide-react';
import { Article, Category, ArticleFormData } from '@/types/article';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, getSupabaseWithAuth } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import MarkdownPreview from './MarkdownPreview';

interface ArticleDialogProps {
  article: Article | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

// Define the schema for form input validation
// Note: category_id is string in the form but will be transformed to number for API
const formSchema = z.object({
  title: z.string().min(1, { message: "כותרת חובה" }),
  content_markdown: z.string().min(1, { message: "תוכן חובה" }),
  category_id: z.string().nullable().transform(val => val ? Number(val) : null),
  scheduled_publish: z.date().nullable(),
  contact_email: z.string().email({ message: "נא להזין אימייל תקין" }).nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  published_at: z.date().nullable(),
});

// Define the form values type based on the schema
type FormValues = z.infer<typeof formSchema>;

const ArticleDialog: React.FC<ArticleDialogProps> = ({
  article,
  categories,
  isOpen,
  onClose,
  onSave,
}) => {
  const { toast } = useToast();
  const { session: authSession } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  const isEditMode = !!article;
  const dialogTitle = isEditMode ? "עריכת מאמר" : "מאמר חדש";

  // Create default form values - explicitly convert category_id to string for the form
  const defaultValues: FormValues = {
    title: article?.title || '',
    content_markdown: article?.content_markdown || '',
    // Convert number to string for the form (Select expects string values)
    category_id: article?.category_id !== null ? String(article.category_id) : null,
    scheduled_publish: article?.scheduled_publish ? new Date(article.scheduled_publish) : null,
    contact_email: article?.contact_email || '',
    published_at: article?.published_at ? new Date(article.published_at) : null,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Reset form when article changes
  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
      setActiveTab('edit');
    }
  }, [article, isOpen, form, defaultValues]);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    
    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;
      
      // Check if scheduled publish date has passed
      let publishDate = data.published_at;
      if (data.scheduled_publish && new Date(data.scheduled_publish) <= new Date()) {
        publishDate = new Date();
      }

      // Prepare data for submission - Zod has already transformed category_id to number
      const formattedData = {
        title: data.title,
        content_markdown: data.content_markdown,
        category_id: data.category_id, // Already transformed to number by Zod
        scheduled_publish: data.scheduled_publish ? data.scheduled_publish.toISOString() : null,
        contact_email: data.contact_email,
        published_at: publishDate ? publishDate.toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      
      if (isEditMode && article) {
        // Update existing article
        const { error } = await supabaseClient
          .from('professional_content')
          .update(formattedData)
          .eq('id', article.id);
          
        if (error) throw error;
      } else {
        // Create new article
        const { error } = await supabaseClient
          .from('professional_content')
          .insert({
            ...formattedData,
            updated_at: new Date().toISOString(),
          });
          
        if (error) throw error;
      }
      
      onSave();
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast({
        title: "שגיאה בשמירת המאמר",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSaving && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>כותרת</FormLabel>
                    <FormControl>
                      <Input placeholder="כותרת המאמר" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Category - explicitly typing this as a string field for the form */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>קטגוריה</FormLabel>
                    <Select 
                      value={field.value || ''} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר קטגוריה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">ללא קטגוריה</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Schedule Publish Date */}
              <FormField
                control={form.control}
                name="scheduled_publish"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>תאריך פרסום מתוכנן</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: he })
                            ) : (
                              <span>בחר תאריך</span>
                            )}
                            <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Contact Email */}
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>איש קשר (אימייל - אופציונלי)</FormLabel>
                    <FormControl>
                      <Input placeholder="example@example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Content Area with Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">עריכה</TabsTrigger>
                <TabsTrigger value="preview">תצוגה מקדימה</TabsTrigger>
              </TabsList>
              
              <FormField
                control={form.control}
                name="content_markdown"
                render={({ field }) => (
                  <>
                    <TabsContent value="edit" className="mt-0">
                      <FormItem>
                        <FormLabel>תוכן (Markdown)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="תוכן המאמר בפורמט Markdown..." 
                            className="min-h-[300px] font-mono"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </TabsContent>
                    
                    <TabsContent value="preview" className="mt-0">
                      <div className="border rounded-md p-4 min-h-[300px] bg-white">
                        <MarkdownPreview markdown={field.value} />
                      </div>
                    </TabsContent>
                  </>
                )}
              />
            </Tabs>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSaving}
              >
                ביטול
              </Button>
              <Button 
                type="submit"
                disabled={isSaving}
              >
                <Save className="ml-2 h-4 w-4" />
                {isSaving ? "שומר..." : "שמור"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleDialog;
