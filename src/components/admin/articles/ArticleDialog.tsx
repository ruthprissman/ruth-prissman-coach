
import React, { useState, useEffect } from 'react';
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
import FileUploadField from '@/components/admin/FileUploadField';

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
  image_url: z.string().nullable(),
  type: z.string().default("article"),
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
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const isEditMode = !!article;
  const dialogTitle = isEditMode ? "עריכת מאמר" : "מאמר חדש";

  const defaultValues: FormValues = {
    title: article?.title || '',
    content_markdown: article?.content_markdown || '',
    category_id: article?.category_id ? String(article.category_id) : null,
    scheduled_publish: article?.scheduled_publish ? new Date(article.scheduled_publish) : null,
    image_url: article?.image_url || null,
    type: article?.type || 'article',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    console.log('ArticleDialog: Component mounted');
    console.log('ArticleDialog: Categories received:', categories);
  }, [categories]);

  const handleFileSelected = (file: File | undefined) => {
    console.log('File selected:', file?.name);
    setSelectedFile(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log(`Starting upload for file: ${file.name}`);
      setUploadProgress(0);
      
      const supabase = await supabaseClient();

      // Check if article has an existing image
      if (article?.image_url) {
        try {
          const url = new URL(article.image_url);
          const pathParts = url.pathname.split('/');
          const filename = pathParts[pathParts.length - 1];
          
          console.log(`Previous image found for article. Deleting: ${filename}`);
          
          const { error: deleteError } = await supabase
            .storage
            .from('stories_img')
            .remove([filename]);
            
          if (deleteError) {
            console.error('Error deleting previous image:', deleteError);
            // Continue with upload even if deletion fails
          } else {
            console.log('Previous image deleted successfully');
          }
        } catch (deleteErr) {
          console.error('Error deleting previous image:', deleteErr);
          // Continue with upload even if deletion fails
        }
      }
      
      const fileName = file.name;
      const filePath = `${fileName}`;
      
      console.log(`Uploading new image to storage: ${filePath}`);
      
      const { data, error } = await supabase
        .storage
        .from('stories_img')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
      
      console.log('Upload successful:', data);
      setUploadProgress(100);
      
      const { data: publicUrlData } = supabase
        .storage
        .from('stories_img')
        .getPublicUrl(data.path);
        
      console.log('New image uploaded successfully:', publicUrlData.publicUrl);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadProgress(null);
      return null;
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    
    try {
      const supabase = await supabaseClient();
      
      console.log('Sending to Supabase:', {
        title: data.title,
        content_length: data.content_markdown ? data.content_markdown.length : 0,
        category: data.category_id
      });
      
      const formattedData: any = {
        title: data.title,
        content_markdown: data.content_markdown || '',
        category_id: data.category_id ? parseInt(data.category_id as string) : null,
        scheduled_publish: data.scheduled_publish ? data.scheduled_publish.toISOString() : null,
        type: data.type,
      };
      
      if (data.scheduled_publish && new Date(data.scheduled_publish) <= new Date()) {
        formattedData['published_at'] = new Date().toISOString();
      }
      
      let imageUrl = data.image_url;
      
      if (selectedFile) {
        console.log('Processing image upload for:', selectedFile.name);
        imageUrl = await uploadImage(selectedFile);
        
        if (!imageUrl) {
          toast({
            title: "שגיאה בהעלאת התמונה",
            description: "לא ניתן היה להעלות את התמונה, אנא נסה שנית",
            variant: "destructive",
          });
        } else {
          console.log('Image uploaded successfully, URL:', imageUrl);
        }
      }
      
      if (imageUrl) {
        formattedData['image_url'] = imageUrl;
      }
      
      let result;
      
      if (isEditMode && article) {
        console.log('Updating existing article ID:', article.id);
        result = await supabase
          .from('professional_content')
          .update(formattedData)
          .eq('id', article.id);
          
        if (result.error) throw result.error;
      } else {
        console.log('Creating new article');
        result = await supabase
          .from('professional_content')
          .insert(formattedData);
          
        if (result.error) throw result.error;
      }
      
      console.log('Article saved successfully', result);
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
      setUploadProgress(null);
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
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem className="md:col-span-6">
                    <FormLabel>תמונה למאמר</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <FileUploadField 
                          onFileSelected={handleFileSelected}
                          id="article-image"
                          name="article-image"
                        />
                        {field.value && !selectedFile && (
                          <div className="mt-2 p-2 bg-muted rounded flex items-center justify-between">
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <img 
                                src={field.value} 
                                alt="תמונה קיימת" 
                                className="h-10 w-10 object-cover rounded"
                              />
                              <span className="text-sm truncate max-w-[200px] mr-2">תמונה קיימת</span>
                            </div>
                          </div>
                        )}
                        {uploadProgress !== null && (
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {uploadProgress < 100 ? `מעלה... ${uploadProgress}%` : 'הועלה בהצלחה'}
                            </p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>סוג תוכן</FormLabel>
                    <Select 
                      value={field.value}
                      onValueChange={field.onChange}
                      defaultValue="article"
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="בחר סוג תוכן" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="article">מאמר</SelectItem>
                        <SelectItem value="poem">שיר</SelectItem>
                        <SelectItem value="humor">הומור</SelectItem>
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
                  <FormItem className="md:col-span-3">
                    <FormLabel>תאריך פרסום מתוכנן</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-10 pl-3 text-left font-normal",
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
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                      {categories && categories.length > 0 ? (
                        categories.map(category => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          טוען קטגוריות...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
