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
  AlertCircle,
  FileText
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
import FileUploadField from '@/components/admin/FileUploadField';

const formSchema = z.object({
  title: z.string().min(1, { message: "כותרת חובה" }),
  content_markdown: z.string().optional(),
  category_id: z.string().nullable(),
  scheduled_publish: z.date().nullable(),
  type: z.string().default('article'),
  image_url: z.string().nullable(),
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
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content_markdown: '',
      category_id: NONE_CATEGORY,
      scheduled_publish: null,
      type: 'article',
      image_url: null,
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
          type: data.type || 'article',
          image_url: data.image_url || null,
        });
        
        console.log("Article loaded with image:", data.image_url);
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
    console.log('ArticleEditor: Starting fetchCategories function');
    try {
      const supabaseInstance = await getSupabaseClient();
      console.log('ArticleEditor: Supabase client retrieved for categories fetch');

      console.log('ArticleEditor: Making Supabase query to categories table');
      const { data, error } = await supabaseInstance
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('ArticleEditor: Error fetching categories:', error);
        throw error;
      }
      
      console.log('ArticleEditor: Categories data received:', data);
      
      if (!data || data.length === 0) {
        console.warn('ArticleEditor: Categories list is empty or undefined');
      }
      
      setCategories(data || []);
      console.log('ArticleEditor: Categories state updated with', data?.length || 0, 'items');
    } catch (error: any) {
      console.error('ArticleEditor: Error in fetchCategories:', error);
      toast({
        title: "שגיאה בטעינת הקטגוריות",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  }, [getSupabaseClient, toast]);

  useEffect(() => {
    console.log('ArticleEditor: Component mounted - starting data fetching');
    const fetchAllData = async () => {
      try {
        console.log('ArticleEditor: Fetching article data and categories in parallel');
        await Promise.all([fetchArticleData(), fetchCategories()]);
        console.log('ArticleEditor: All data fetched successfully');
      } catch (err) {
        console.error('ArticleEditor: Error fetching initial data:', err);
      }
    };
    
    fetchAllData();
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

  const handleFileSelected = (file: File | undefined) => {
    console.log('File selected:', file?.name);
    setSelectedFile(file);
    setHasUnsavedChanges(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log(`Starting upload for file: ${file.name}`);
      setUploadProgress(0);
      
      const supabase = await getSupabaseClient();

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
        } else {
          console.warn('Editor content save failed or returned no data');
        }
      }
      
      if (!data.content_markdown && contentRef.current) {
        console.log('Using contentRef as fallback for missing content_markdown');
        data.content_markdown = contentRef.current;
      }
      
      if (!data.content_markdown) {
        console.error('No content available to save');
        toast({
          title: "שגיאה בשמירת המאמר",
          description: "לא ניתן לשמור מאמר ריק, נסה שוב",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      const supabaseInstance = await getSupabaseClient();
      
      console.log('Sending to Supabase:', {
        title: data.title,
        content_length: data.content_markdown ? data.content_markdown.length : 0,
        category: data.category_id
      });
      
      let formattedData: any = {
        title: data.title,
        content_markdown: data.content_markdown || '',
        category_id: data.category_id === NONE_CATEGORY ? null : parseInt(data.category_id as string),
        scheduled_publish: data.scheduled_publish ? data.scheduled_publish.toISOString() : null,
        type: data.type,
      };
      
      if (selectedFile) {
        console.log('Processing image upload for:', selectedFile.name);
        
        const imageUrl = await uploadImage(selectedFile);
        
        if (imageUrl) {
          console.log('Image uploaded successfully, URL:', imageUrl);
          formattedData.image_url = imageUrl;
        } else {
          toast({
            title: "שגיאה בהעלאת התמונה",
            description: "לא ניתן היה להעלות את התמונה, אנא נסה שנית",
            variant: "destructive",
          });
        }
      } else if (data.image_url) {
        console.log('Using existing image URL:', data.image_url);
        formattedData.image_url = data.image_url;
      }
      
      if (publishNow || (data.scheduled_publish && new Date(data.scheduled_publish) <= new Date() && !article?.published_at)) {
        formattedData['published_at'] = new Date().toISOString();
      }
      
      if (isEditMode && id) {
        console.log('Updating existing article ID:', id);
        const { error } = await supabaseInstance
          .from('professional_content')
          .update(formattedData)
          .eq('id', Number(id));
          
        if (error) throw error;
        
        await savePublications(Number(id), publications);
        console.log('Article and publications updated successfully');
      } else {
        console.log('Creating new article');
        const { data: newArticle, error } = await supabaseInstance
          .from('professional_content')
          .insert(formattedData)
          .select('id')
          .single();
          
        if (error) throw error;
        if (!newArticle) throw new Error('No article ID returned');
        
        console.log('New article created with ID:', newArticle.id);
        await savePublications(newArticle.id, publications);
        formattedData.id = newArticle.id;
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      form.reset(data);
      
      if (!isEditMode && formattedData.id) {
        navigate(`/admin/articles/edit/${formattedData.id}`);
        
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
      setUploadProgress(null);
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

  const handleExportToPDF = async () => {
    if (!article) return;
    
    try {
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      const { EmailGenerator } = await import('@/utils/EmailGenerator');
      
      // Generate the same email content that would be sent
      const emailGenerator = new EmailGenerator();
      const emailContent = await emailGenerator.generateEmailContent({
        title: article.title,
        content: article.content_markdown,
        image_url: article.image_url,
        staticLinks: article.staticLinks
      });
      
      // Create a temporary div to render the email content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = emailContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.background = 'white';
      tempDiv.style.padding = '20px';
      document.body.appendChild(tempDiv);
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      // Remove temp div
      document.body.removeChild(tempDiv);
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      pdf.save(`${article.title}.pdf`);
      
      toast({
        title: "PDF נוצר בהצלחה",
        description: "המאמר יוצא ל-PDF בהצלחה",
      });
    } catch (error) {
      console.error('Error creating PDF:', error);
      toast({
        title: "שגיאה ביצירת PDF",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

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
                <Button 
                  onClick={handleExportToPDF} 
                  variant="outline"
                  disabled={isSaving || !form.formState.isValid}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  ייצא ל-PDF
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
                      <FormDescription>
                        העלה תמונה למאמר (אופציונלי)
                      </FormDescription>
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          setHasUnsavedChanges(true);
                        }}
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
                        תאריך פרסום ראשוני
                        {article?.published_at && (
                          <span className="font-semibold text-green-700"> (כבר פורסם)</span>
                        )}
                      </FormDescription>
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
