import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Article, Category, PublicationFormData, PublishLocationType } from '@/types/article';
import RichTextEditor from '@/components/admin/articles/RichTextEditor';
import PublicationSettings from '@/components/admin/articles/PublicationSettings';
import PublishModal from '@/components/admin/articles/PublishModal';
import { supabaseClient } from '@/lib/supabaseClient';
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
  type: z.string().default('article'),
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [publications, setPublications] = useState<PublicationFormData[]>([]);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const editorRef = useRef<{ saveContent: () => Promise<boolean>, hasUnsavedChanges: () => boolean } | null>(null);
  const contentRef = useRef<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content_markdown: '',
      category_id: NONE_CATEGORY,
      scheduled_publish: null,
      contact_email: '',
      type: 'article',
    },
  });

  const getSupabaseClient = useCallback(async () => {
    return await supabaseClient();
  }, []);

  const fetchArticleData = useCallback(async () => {
    if (!isEditMode) {
      setIsLoading(false);
      return;
    }

    try {
      const supabaseInstance = await getSupabaseClient();

      const { data, error } = await supabaseInstance
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
          type: data.type || 'article',
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
  }, [id, isEditMode, form, toast, getSupabaseClient]);

  const fetchCategories = useCallback(async () => {
    try {
      const supabaseInstance = await getSupabaseClient();

      const { data, error } = await supabaseInstance
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
  }, [getSupabaseClient, toast]);

  useEffect(() => {
    Promise.all([fetchArticleData(), fetchCategories()]);
  }, [fetchArticleData, fetchCategories]);

  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || (editorRef.current && editorRef.current.hasUnsavedChanges())) {
        e.preventDefault();
        e.returnValue = 'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  
  const saveArticle = async (data: FormValues, publishNow = false) => {
    setIsSaving(true);
    
    try {
      if (editorRef.current) {
        const saved = await editorRef.current.saveContent();
        if (saved) {
          console.log('Editor content saved');
          data = form.getValues();
          console.log('Form values after editor save:', {
            title: data.title,
            content_length: data.content_markdown ? data.content_markdown.length : 0,
            category: data.category_id
          });
        }
      }
      
      const supabaseInstance = await getSupabaseClient();
      
      if (!data.content_markdown && contentRef.current) {
        console.log('Using contentRef as fallback for missing content_markdown');
        data.content_markdown = contentRef.current;
      }
      
      console.log('Sending to Supabase:', {
        title: data.title,
        content_length: data.content_markdown ? data.content_markdown.length : 0,
        category: data.category_id
      });
      
      const formattedData = {
        title: data.title,
        content_markdown: data.content_markdown || '',
        category_id: data.category_id === NONE_CATEGORY ? null : parseInt(data.category_id as string),
        scheduled_publish: data.scheduled_publish ? data.scheduled_publish.toISOString() : null,
        contact_email: data.contact_email || null,
        type: data.type,
      };
      
      if (publishNow || (data.scheduled_publish && new Date(data.scheduled_publish) <= new Date() && !article?.published_at)) {
        formattedData['published_at'] = new Date().toISOString();
      }
      
      let articleId: number;
      
      if (isEditMode && id) {
        const { error } = await supabaseInstance
          .from('professional_content')
          .update(formattedData)
          .eq('id', Number(id));
          
        if (error) throw error;
        
        articleId = Number(id);
      } else {
        const { data: newArticle, error } = await supabaseInstance
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
      setHasUnsavedChanges(false);
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
      const supabaseInstance = await getSupabaseClient();
      
      const publicationsToDelete = publicationsData
        .filter(pub => pub.isDeleted && pub.id)
        .map(pub => pub.id);
      
      if (publicationsToDelete.length > 0) {
        const { error } = await supabaseInstance
          .from('article_publications')
          .delete()
          .in('id', publicationsToDelete);
        
        if (error) throw error;
      }
      
      const newPublications = publicationsData
        .filter(pub => !pub.isDeleted && !pub.id)
        .map(pub => ({
          content_id: articleId,
          publish_location: pub.publish_location,
          scheduled_date: pub.scheduled_date ? pub.scheduled_date.toISOString() : null,
          published_date: pub.published_date,
        }));
      
      const existingPublications = publicationsData
        .filter(pub => !pub.isDeleted && pub.id)
        .map(pub => ({
          id: pub.id,
          content_id: articleId,
          publish_location: pub.publish_location,
          scheduled_date: pub.scheduled_date ? pub.scheduled_date.toISOString() : null,
          published_date: pub.published_date,
        }));
      
      if (newPublications.length > 0) {
        const { error: insertError } = await supabaseInstance
          .from('article_publications')
          .insert(newPublications);
        
        if (insertError) throw insertError;
      }
      
      if (existingPublications.length > 0) {
        const { error: updateError } = await supabaseInstance
          .from('article_publications')
          .upsert(existingPublications);
        
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error saving publications:', error);
      throw error;
    }
  };

  const onSubmit = async (data: FormValues) => {
    console.log("Submitting article with content length:", data.content_markdown ? data.content_markdown.length : 0);
    
    if (editorRef.current && editorRef.current.hasUnsavedChanges()) {
      await editorRef.current.saveContent();
      data = form.getValues();
    }
    
    await saveArticle(data);
  };

  const handlePublishNow = () => {
    const data = form.getValues();
    
    if (hasUnsavedChanges || (editorRef.current && editorRef.current.hasUnsavedChanges())) {
      saveArticle(data).then(() => {
        setIsPublishModalOpen(true);
      });
    } else {
      setIsPublishModalOpen(true);
    }
  };

  const handleDeleteArticle = async () => {
    if (!isEditMode || !id) return;
    
    setIsDeleting(true);
    
    try {
      const supabaseInstance = await getSupabaseClient();
      
      await supabaseInstance
        .from('article_publications')
        .delete()
        .eq('content_id', Number(id));
      
      const { error } = await supabaseInstance
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
    console.log('Editor content updated in parent, length:', content.length);
    
    contentRef.current = content;
    
    form.setValue('content_markdown', content, { 
      shouldDirty: true,
      shouldValidate: false,
      shouldTouch: false
    });
    
    setHasUnsavedChanges(true);
  };
  
  const handleAddPublication = (publication: PublicationFormData) => {
    setPublications(prev => [...prev, publication]);
    setHasUnsavedChanges(true);
  };

  const handleUpdatePublication = (index: number, updatedPublication: PublicationFormData) => {
    setPublications(prev => 
      prev.map((pub, i) => i === index ? updatedPublication : pub)
    );
    setHasUnsavedChanges(true);
  };

  const handleDeletePublication = (index: number) => {
    setPublications(prev => 
      prev.map((pub, i) => i === index ? { ...pub, isDeleted: true } : pub)
    );
    setHasUnsavedChanges(true);
  };

  const handlePublishSuccess = useCallback(() => {
    fetchArticleData();
  }, [fetchArticleData]);

  useEffect(() => {
    const warningText = 'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?';
    
    const handleBeforeNavigate = (e: PopStateEvent) => {
      if (hasUnsavedChanges || (editorRef.current && editorRef.current.hasUnsavedChanges())) {
        if (window.confirm(warningText)) {
          return;
        }
        
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
      }
    };
    
    window.addEventListener('popstate', handleBeforeNavigate);
    
    return () => {
      window.removeEventListener('popstate', handleBeforeNavigate);
    };
  }, [hasUnsavedChanges]);

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
              onClick={() => {
                if (hasUnsavedChanges || (editorRef.current && editorRef.current.hasUnsavedChanges())) {
                  if (window.confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?')) {
                    navigate('/admin/articles');
                  }
                } else {
                  navigate('/admin/articles');
                }
              }}
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
              
              {isEditMode && (
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
                        <Input 
                          placeholder="כותרת המאמר" 
                          {...field} 
                          className="text-xl"
                          onChange={(e) => {
                            field.onChange(e);
                            setHasUnsavedChanges(true);
                          }}
                        />
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          setHasUnsavedChanges(true);
                        }}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                              onClick={() => {
                                // Only handle the click event, not update the value
                              }}
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
                            onSelect={(date) => {
                              field.onChange(date);
                              setHasUnsavedChanges(true);
                            }}
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
                        <Input 
                          placeholder="example@example.com" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={(e) => {
                            field.onChange(e);
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        אימייל ליצירת קשר שיוצג במאמר
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>סוג תוכן</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setHasUnsavedChanges(true);
                        }}
                        defaultValue="article"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר סוג תוכן" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="article">מאמר</SelectItem>
                          <SelectItem value="poem">שיר</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
                        ref={editorRef}
                        defaultValue={field.value} 
                        onChange={handleEditorChange}
                        placeholder="התחל לכתוב את תוכן המאמר כאן..."
                        className="min-h-[400px] w-full"
                        articleTitle={form.getValues().title}
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
                  onClick={() => {
                    if (hasUnsavedChanges || (editorRef.current && editorRef.current.hasUnsavedChanges())) {
                      if (window.confirm('יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב?')) {
                        navigate('/admin/articles');
                      }
                    } else {
                      navigate('/admin/articles');
                    }
                  }}
                  disabled={isSaving}
                >
                  ביטול
                </Button>
                <Button 
                  type="submit"
                  disabled={isSaving || (!hasUnsavedChanges && !(editorRef.current && editorRef.current.hasUnsavedChanges()))}
                  className="gap-2"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? "שומר..." : (
                    <>
                      שמור
                      {(hasUnsavedChanges || (editorRef.current && editorRef.current.hasUnsavedChanges())) && (
                        <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
                      )}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
          
          <PublishModal 
            article={article}
            isOpen={isPublishModalOpen}
            onClose={() => setIsPublishModalOpen(false)}
            onSuccess={handlePublishSuccess}
          />
        </div>
      )}
    </AdminLayout>
  );
};

export default ArticleEditor;
