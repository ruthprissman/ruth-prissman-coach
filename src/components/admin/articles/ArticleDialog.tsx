import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Calendar as CalendarIcon, Save } from 'lucide-react';
import { Article, Category } from '@/types/article';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface ArticleDialogProps {
  article: Article | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, { message: "כותרת חובה" }),
  content_markdown: z.string().min(1, { message: "תוכן חובה" }),
  category_id: z.string().nullable(),
  scheduled_publish: z.date().nullable(),
  contact_email: z.string().email({ message: "נא להזין אימייל תקין" }).nullable().or(z.literal('')),
});

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
  
  const isEditMode = !!article;
  const dialogTitle = isEditMode ? "עריכת מאמר" : "מאמר חדש";

  const defaultValues: FormValues = {
    title: article?.title || '',
    content_markdown: article?.content_markdown || '',
    category_id: article?.category_id ? String(article.category_id) : null,
    scheduled_publish: article?.scheduled_publish ? new Date(article.scheduled_publish) : null,
    contact_email: article?.contact_email || '',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    
    try {
      const formattedData = {
        title: data.title,
        content_markdown: data.content_markdown,
        category_id: data.category_id ? parseInt(data.category_id) : null,
        scheduled_publish: data.scheduled_publish ? data.scheduled_publish.toISOString() : null,
        contact_email: data.contact_email || null,
      };
      
      if (data.scheduled_publish && new Date(data.scheduled_publish) <= new Date()) {
        formattedData['published_at'] = new Date().toISOString();
      }
      
      if (isEditMode && article) {
        const { error } = await supabaseClient()
          .from('professional_content')
          .update(formattedData)
          .eq('id', article.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabaseClient()
          .from('professional_content')
          .insert(formattedData);
          
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
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כותרת</FormLabel>
                  <FormControl>
                    <Input placeholder="כותרת המאמר" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>קטגוריה</FormLabel>
                  <Select 
                    value={field.value || ""}
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
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>איש קשר (אימייל - אופציונלי)</FormLabel>
                  <FormControl>
                    <Input placeholder="example@example.com" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content_markdown"
              render={({ field }) => (
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
              )}
            />

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
