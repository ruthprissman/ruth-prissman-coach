
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { 
  ArrowRight, 
  Calendar as CalendarIcon, 
  Save, 
  Trash2, 
  Send,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Article, Category, PublicationFormData, PublishLocationType } from '@/types/article';
import RichTextEditor from '@/components/admin/articles/RichTextEditor';
import PublicationSettings from '@/components/admin/articles/PublicationSettings';
import { supabase, getSupabaseWithAuth } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(1, { message: "כותרת חובה" }),
  content_markdown: z.string().optional(),
  category_id: z.string().nullable(),
  scheduled_publish: z.date().nullable(),
  contact_email: z.string().email({ message: "נא להזין אימייל תקין" }).nullable().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

const NONE_CATEGORY = "none";

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session: authSession } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);
  const [publications, setPublications] = useState<PublicationFormData[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content_markdown: '',
      category_id: NONE_CATEGORY,
      scheduled_publish: null,
      contact_email: '',
    },
  });

  const fetchArticleData = useCallback(async () => {
    if (!isEditMode) {
      setIsLoading(false);
      return;
    }

    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;

      const { data, error } = await supabaseClient
        .from('professional_content')
        .select(`
          *,
          categories(*),
          article_publications(*)
        `)
        .eq('id', Number(id))
        .single();

      if (error) throw error;

      setArticle(data);

      if (data) {
        // Convert API data to form data
        const publicationData: PublicationFormData[] = data.article_publications?.map((pub: any) => ({
          id: pub.id,
          publish_location: pub.publish_location as PublishLocationType,
          scheduled_date: pub.scheduled_date ? new Date(pub.scheduled_date) : null,
          published_date: pub.published_date,
        })) || [];

        setPublications(publicationData);

        form.reset({
          title: data.title,
          content_markdown: data.content_markdown,
          category_id: data.category_id ? String(data.category_id) : NONE_CATEGORY,
          scheduled_publish: data.scheduled_publish ? new Date(data.scheduled_publish) : null,
          contact_email: data.contact_email || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching article:', error);
      toast({
        title: "שגיאה בטעינת המאמר",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [authSession, id, isEditMode, form, toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;

      const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: "שגיאה בטעינת הקטגוריות",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  }, [authSession, toast]);

  useEffect(() => {
    Promise.all([fetchArticleData(), fetchCategories()]);
  }, [fetchArticleData, fetchCategories]);

  useEffect(() => {
    if (form.formState.isDirty && !autoSaveInterval) {
      const interval = setInterval(() => {
        const formData = form.getValues();
        if (formData.title && formData.content_markdown && isEditMode) {
          handleAutoSave(formData);
        }
      }, 30000);

      setAutoSaveInterval(interval);
    }

    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [form.formState.isDirty, isEditMode, autoSaveInterval]);

  const saveArticle = async (data: FormValues, publishNow = false) => {
    setIsSaving(true);
    
    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;
      
      const formattedData = {
        title: data.title,
        content_markdown: data.content_markdown || '',
        category_id: data.category_id === NONE_CATEGORY ? null : parseInt(data.category_id as string),
        scheduled_publish: data.scheduled_publish ? data.scheduled_publish.toISOString() : null,
        contact_email: data.contact_email || null,
      };
      
      if (publishNow || (data.scheduled_publish && new Date(data.scheduled_publish) <= new Date() && !article?.published_at)) {
        formattedData['published_at'] = new Date().toISOString();
      }
      
      let articleId: number;
      
      if (isEditMode && id) {
        const { error } = await supabaseClient
          .from('professional_content')
          .update(formattedData)
          .eq('id', Number(id));
          
        if (error) throw error;
        
        articleId = Number(id);
      } else {
        const { data: newArticle, error } = await supabaseClient
          .from('professional_content')
          .insert(formattedData)
          .select('id')
          .single();
          
        if (error) throw error;
        if (!newArticle) throw new Error('No article ID returned');
        
        articleId = newArticle.id;
      }
      
      await savePublications(articleId, publications);
      
      setLastSaved(new Date());
      form.reset(data);
      
      if (!isEditMode) {
        navigate(`/admin/articles/edit/${articleId}`);
        
        toast({
          title: "המאמר נוצר בהצלחה",
          description: "מעבר למצב עריכה",
        });
      } else {
        toast({
          title: "המאמר נשמר בהצלחה",
          description: publishNow ? "המאמר פורסם" : "השינויים נשמרו",
        });
      }
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

  const savePublications = async (articleId: number, publicationsData: PublicationFormData[]) => {
    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;
      
      // Handle publications marked for deletion
      const publicationsToDelete = publicationsData
        .filter(pub => pub.isDeleted && pub.id)
        .map(pub => pub.id);
      
      if (publicationsToDelete.length > 0) {
        const { error } = await supabaseClient
          .from('article_publications')
          .delete()
          .in('id', publicationsToDelete);
        
        if (error) throw error;
      }
      
      // Handle new and updated publications
      const publicationsToUpsert = publicationsData
        .filter(pub => !pub.isDeleted)
        .map(pub => ({
          id: pub.id,
          content_id: articleId,
          publish_location: pub.publish_location,
          scheduled_date: pub.scheduled_date ? pub.scheduled_date.toISOString() : null,
          published_date: pub.published_date,
        }));
      
      if (publicationsToUpsert.length > 0) {
        const { error } = await supabaseClient
          .from('article_publications')
          .upsert(publicationsToUpsert, { onConflict: 'id' });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving publications:', error);
      throw error;
    }
  };

  const onSubmit = async (data: FormValues) => {
    await saveArticle(data);
  };

  const handlePublishNow = async () => {
    const data = form.getValues();
    await saveArticle(data, true);
  };

  const handleAutoSave = async (data: FormValues) => {
    try {
      await saveArticle(data);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleDeleteArticle = async () => {
    if (!isEditMode || !id) return;
    
    setIsDeleting(true);
    
    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;
      
      // First delete all publications
      await supabaseClient
        .from('article_publications')
        .delete()
        .eq('content_id', Number(id));
      
      const { error } = await supabaseClient
        .from('professional_content')
        .delete()
        .eq('id', Number(id));
      
      if (error) throw error;
      
      toast({
        title: "המאמר נמחק",
        description: "המאמר נמחק בהצלחה",
      });
      
      navigate('/admin/articles');
    } catch (error: any) {
      console.error('Error deleting article:', error);
      toast({
        title: "שגיאה במחיקת המאמר",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditorChange = (content: string) => {
    console.log('Editor content updated in parent:', content);
    
    form.setValue('content_markdown', content, { 
      shouldDirty: true,
      shouldValidate: false,
      shouldTouch: true
    });
  };
  
  const handleAddPublication = (publication: PublicationFormData) => {
    setPublications(prev => [...prev, publication]);
  };

  const handleUpdatePublication = (index: number, updatedPublication: PublicationFormData) => {
    setPublications(prev => 
      prev.map((pub, i) => i === index ? updatedPublication : pub)
    );
  };

  const handleDeletePublication = (index: number) => {
    setPublications(prev => 
      prev.map((pub, i) => i === index ? { ...pub, isDeleted: true } : pub)
    );
  };

  return (
    <AdminLayout title={isEditMode ? "עריכת מאמר" : "מאמר חדש"}>
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/articles')}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה לרשימת המאמרים
            </Button>
            
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-sm text-muted-foreground">
                  נשמר לאחרונה: {format(lastSaved, 'HH:mm:ss', { locale: he })}
                </span>
              )}
              
              {isEditMode && !article?.published_at && (
                <Button 
                  onClick={handlePublishNow} 
                  disabled={isSaving || !form.formState.isValid}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  פרסם עכשיו
                </Button>
              )}
              
              {isEditMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      <Trash2 className="ml-2 h-4 w-4" />
                      {isDeleting ? "מוחק..." : "מחק מאמר"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                      <AlertDialogDescription>
                        פעולה זו תמחק את המאמר לצמיתות. לא ניתן לשחזר מאמר שנמחק.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteArticle}>
                        מחק
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>כותרת</FormLabel>
                      <FormControl>
                        <Input placeholder="כותרת המאמר" {...field} className="text-xl" />
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
                        value={field.value || NONE_CATEGORY}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר קטגוריה" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_CATEGORY}>ללא קטגוריה</SelectItem>
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="scheduled_publish"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>תאריך פרסום מתוכנן כללי</FormLabel>
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
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        תאריך פרסום ראשוני (ניתן לקבוע תאריכי פרסום ספציפיים לכל פלטפורמה)
                        {article?.published_at && (
                          <span className="font-semibold text-green-700"> (כבר פורסם)</span>
                        )}
                      </FormDescription>
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
                      <FormDescription>
                        אימייל ליצירת קשר שיוצג במאמר
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Publication Settings Component */}
              <PublicationSettings
                publications={publications}
                onAdd={handleAddPublication}
                onUpdate={handleUpdatePublication}
                onDelete={handleDeletePublication}
              />
              
              <FormField
                control={form.control}
                name="content_markdown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תוכן המאמר</FormLabel>
                    <FormControl>
                      <RichTextEditor 
                        initialValue={field.value} 
                        onChange={handleEditorChange}
                        placeholder="התחל לכתוב את תוכן המאמר כאן..."
                        className="min-h-[400px] w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/admin/articles')}
                  disabled={isSaving}
                >
                  ביטול
                </Button>
                <Button 
                  type="submit"
                  disabled={isSaving || !form.formState.isDirty}
                  className="gap-2"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? "שומר..." : "שמור"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </AdminLayout>
  );
};

export default ArticleEditor;
