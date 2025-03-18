import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from 'react-hook-form/resolvers/zod';
import { z } from 'zod';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Article, Category } from '@/types/article';
import { useAuth } from '@/contexts/AuthContext';
import { Editor } from '@tinymce/tinymce-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDocumentTitle } from '@/hooks/use-document-title';
import { slugify } from '@/utils/stringUtils';

const formSchema = z.object({
  title: z.string().min(1, { message: "כותרת המאמר נדרשת" }),
  slug: z.string().min(1, { message: "כתובת ידידותית נדרשת" }),
  excerpt: z.string().min(1, { message: "תקציר המאמר נדרש" }),
  reading_time: z.coerce.number().min(1, { message: "זמן קריאה נדרש" }),
  category_id: z.string().min(1, { message: "קטגוריה נדרשת" }),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

const ArticleEditor: React.FC = () => {
  const { id } = useParams();
  const articleId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  
  useDocumentTitle(article ? `עריכת מאמר: ${article.title}` : 'מאמר חדש');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      reading_time: 5,
      category_id: "",
      seo_title: "",
      seo_description: "",
    },
    mode: "onChange",
  });
  
  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;
      
      try {
        setIsLoading(true);
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from('professional_content')
          .select('*')
          .eq('id', articleId)
          .single();
        
        if (error) throw error;
        
        setArticle(data as Article);
        
        form.reset({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          reading_time: data.reading_time,
          category_id: data.category_id,
          seo_title: data.seo_title || data.title,
          seo_description: data.seo_description || data.excerpt,
        });
        
        setEditorContent(data.content);
      } catch (error: any) {
        console.error('Error fetching article:', error);
        toast({
          title: "שגיאה בטעינת המאמר",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticle();
  }, [articleId, form, toast]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setCategories(data || []);
      } catch (error: any) {
        console.error('Error fetching categories:', error);
        toast({
          title: "שגיאה בטעינת הקטגוריות",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    
    fetchCategories();
  }, [toast]);
  
  const log = () => {
    if (editorRef.current) {
      console.log("Content:", editorRef.current.getContent());
    }
  };
  
  const handleEditorChange = (content: string, editor: any) => {
    setEditorContent(content);
  };

  const saveArticle = async (isDraft: boolean = true) => {
    setIsSaving(true);
    
    try {
      const formData = form.getValues();
      
      const articleData = {
        title: formData.title,
        content: editorContent,
        excerpt: formData.excerpt,
        reading_time: parseInt(formData.reading_time.toString()),
        is_published: !isDraft,
        seo_title: formData.seo_title || formData.title,
        seo_description: formData.seo_description || formData.excerpt,
        slug: formData.slug,
        category_id: formData.category_id,
      };
      
      const supabase = supabaseClient();
      let result;
      
      if (articleId) {
        // Update existing article
        result = await supabase
          .from('professional_content')
          .update(articleData)
          .eq('id', articleId);
      } else {
        // Create new article
        result = await supabase
          .from('professional_content')
          .insert([articleData])
          .select();
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: `המאמר ${isDraft ? 'נשמר כטיוטה' : 'פורסם'} בהצלחה`,
        description: "השינויים נשמרו במערכת",
      });
      
      if (!articleId && result.data && result.data.length > 0) {
        // If it's a new article, navigate to edit page
        navigate(`/admin/articles/edit/${result.data[0].id}`);
      } else {
        // Refresh the article data
        if (articleId) {
          const { data } = await supabase
            .from('professional_content')
            .select('*')
            .eq('id', articleId)
            .single();
          
          setArticle(data as Article);
        }
      }
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast({
        title: "שגיאה בשמירת המאמר",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGenerateSlug = () => {
    const title = form.getValues('title');
    const slug = slugify(title);
    form.setValue('slug', slug);
  };
  
  if (isLoading) {
    return (
      <AdminLayout title="טוען מאמר...">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-ring loading-lg"></span>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={article ? `עריכת מאמר: ${article.title}` : 'מאמר חדש'}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(saveArticle)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>כותרת המאמר</FormLabel>
                      <FormControl>
                        <Input placeholder="הכנס כותרת" {...field} />
                      </FormControl>
                      <FormDescription>
                        הכותרת תוצג בראש המאמר וברשימת המאמרים.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <Label>תוכן המאמר</Label>
                <Editor
                  apiKey="YOUR_API_KEY"
                  onInit={(evt, editor) => editorRef.current = editor}
                  initialValue={editorContent}
                  init={{
                    height: 500,
                    menubar: false,
                    directionality: 'rtl',
                    plugins: [
                      'advlist autolink lists link image charmap print preview anchor',
                      'searchreplace visualblocks code fullscreen',
                      'insertdatetime media table paste code help wordcount'
                    ],
                    toolbar: 'undo redo | formatselect | ' +
                      'bold italic backcolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family:Arial,sans-serif; font-size:14px }'
                  }}
                  onEditorChange={handleEditorChange}
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>כתובת ידידותית</FormLabel>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            onClick={handleGenerateSlug}
                          >
                            צור אוטומטית
                          </Button>
                        </div>
                        <FormControl>
                          <Input placeholder="example-article" {...field} />
                        </FormControl>
                        <FormDescription>
                          תוצג בשורת הכתובת של הדפדפן.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תקציר</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="תקציר קצר על המאמר"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          תקציר קצר שיוצג בתצוגה מקדימה של המאמר.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reading_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>זמן קריאה משוער</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5" {...field} />
                        </FormControl>
                        <FormDescription>
                          זמן הקריאה המשוער בדקות.
                        </FormDescription>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר קטגוריה" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          בחר את הקטגוריה המתאימה ביותר למאמר.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="space-y-4">
                  <h4 className="text-sm font-medium">SEO</h4>
                  <Separator />
                  
                  <FormField
                    control={form.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>כותרת SEO</FormLabel>
                        <FormControl>
                          <Input placeholder="כותרת SEO" {...field} />
                        </FormControl>
                        <FormDescription>
                          כותרת המאמר עבור מנועי חיפוש.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תיאור SEO</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="תיאור SEO"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          תיאור המאמר עבור מנועי חיפוש.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/articles')}
            >
              ביטול
            </Button>
            <div>
              <Button 
                type="button" 
                variant="secondary" 
                className="mr-2" 
                onClick={() => saveArticle(true)}
                disabled={isSaving}
              >
                שמור כטיוטה
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
              >
                {isSaving ? 'שומר...' : 'פרסם'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </AdminLayout>
  );
};

export default ArticleEditor;
