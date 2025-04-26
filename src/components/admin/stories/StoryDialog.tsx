
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import FileUploadField from '@/components/admin/FileUploadField';
import { cn } from '@/lib/utils';
import { Story } from '@/types/story';

interface StoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: number | null;
}

const formSchema = z.object({
  title: z.string().min(2, { message: "הכותרת חייבת להכיל לפחות 2 תווים" }),
  summary: z.string().min(10, { message: "התקציר חייב להכיל לפחות 10 תווים" }),
  publish_date: z.date({ required_error: "תאריך פרסום הוא שדה חובה" }),
});

const StoryDialog: React.FC<StoryDialogProps> = ({ isOpen, onClose, storyId }) => {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [pdfPreview, setPdfPreview] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      summary: '',
      publish_date: new Date(),
    },
  });

  // Fetch story data if editing
  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId) {
        resetForm();
        return;
      }

      setIsLoading(true);
      try {
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (error) throw error;

        if (data) {
          setStory(data);
          form.reset({
            title: data.title,
            summary: data.summary,
            publish_date: new Date(data.publish_date),
          });
          
          setPdfPreview(data.pdf_url || '');
          setImagePreview(data.image_url || '');
        }
      } catch (error) {
        console.error('Error fetching story:', error);
        toast({
          title: "שגיאה בטעינת הסיפור",
          description: "לא ניתן היה לטעון את פרטי הסיפור. נסה שוב מאוחר יותר.",
          variant: "destructive",
        });
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && storyId) {
      fetchStory();
    } else if (isOpen) {
      resetForm();
    }
  }, [isOpen, storyId, form, toast, onClose]);

  const resetForm = () => {
    form.reset({
      title: '',
      summary: '',
      publish_date: new Date(),
    });
    setPdfFile(undefined);
    setImageFile(undefined);
    setPdfPreview('');
    setImagePreview('');
    setStory(null);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      const supabase = supabaseClient();
      
      // Upload PDF file if provided
      let pdfUrl = story?.pdf_url || '';
      if (pdfFile) {
        const pdfFileName = `${Date.now()}-${pdfFile.name}`;
        const { data: pdfData, error: pdfError } = await supabase
          .storage
          .from('stories')
          .upload(pdfFileName, pdfFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (pdfError) throw pdfError;
        
        // Get public URL
        const { data: pdfPublicUrl } = supabase
          .storage
          .from('stories')
          .getPublicUrl(pdfFileName);
          
        pdfUrl = pdfPublicUrl.publicUrl;
      } else if (!storyId && !pdfFile) {
        throw new Error('יש להעלות קובץ PDF');
      }
      
      // Upload image if provided
      let imageUrl = story?.image_url || '';
      if (imageFile) {
        const imageFileName = `${Date.now()}-${imageFile.name}`;
        const { data: imageData, error: imageError } = await supabase
          .storage
          .from('stories_img')
          .upload(imageFileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (imageError) throw imageError;
        
        // Get public URL
        const { data: imagePublicUrl } = supabase
          .storage
          .from('stories_img')
          .getPublicUrl(imageFileName);
          
        imageUrl = imagePublicUrl.publicUrl;
      } else if (!storyId && !imageFile) {
        throw new Error('יש להעלות תמונה');
      }
      
      const storyData = {
        title: data.title,
        summary: data.summary,
        publish_date: data.publish_date.toISOString(),
        pdf_url: pdfUrl,
        image_url: imageUrl,
      };
      
      let result;
      
      if (storyId) {
        // Update existing story
        result = await supabase
          .from('stories')
          .update(storyData)
          .eq('id', storyId);
      } else {
        // Create new story
        storyData['created_at'] = new Date().toISOString();
        result = await supabase
          .from('stories')
          .insert(storyData);
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: storyId ? "הסיפור עודכן בהצלחה" : "הסיפור נוצר בהצלחה",
        description: storyId 
          ? "השינויים בסיפור נשמרו בהצלחה" 
          : "הסיפור החדש נוסף בהצלחה למערכת",
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error saving story:', error);
      toast({
        title: "שגיאה בשמירת הסיפור",
        description: error.message || "אירעה שגיאה בעת שמירת הסיפור. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-right">
            {storyId ? 'עריכת סיפור' : 'הוספת סיפור חדש'}
          </DialogTitle>
          <DialogDescription className="text-right">
            {storyId 
              ? 'ערוך את פרטי הסיפור הקיים' 
              : 'הוסף סיפור חדש למערכת. סיפורים יוצגו באתר לפי תאריך הפרסום שנבחר.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>כותרת</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="הזן כותרת לסיפור" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תקציר</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="הזן תקציר לסיפור שיוצג ברשימת הסיפורים" 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="publish_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>תאריך פרסום</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-right font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
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
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>קובץ PDF</FormLabel>
                <FileUploadField
                  onFileSelected={(file) => setPdfFile(file)}
                  id="pdf-file"
                  name="pdf-file"
                />
                {pdfPreview && !pdfFile && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded mt-2">
                    <span className="text-sm truncate">PDF נוכחי: קובץ קיים</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => window.open(pdfPreview, '_blank')}
                    >
                      צפה
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <FormLabel>תמונה מקדימה</FormLabel>
                <FileUploadField
                  onFileSelected={(file) => {
                    setImageFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setImagePreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  id="image-file"
                  name="image-file"
                />
                {(imagePreview || imageFile) && (
                  <div className="mt-2">
                    <p className="text-sm mb-1">תצוגה מקדימה:</p>
                    <img 
                      src={imageFile ? URL.createObjectURL(imageFile) : imagePreview} 
                      alt="תצוגה מקדימה" 
                      className="max-h-48 max-w-full rounded"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  ביטול
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      שומר...
                    </>
                  ) : storyId ? 'עדכן סיפור' : 'צור סיפור'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoryDialog;
