
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Story } from '@/types/story';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface StoriesListProps {
  onEditStory: (storyId: number) => void;
}

const StoriesList: React.FC<StoriesListProps> = ({ onEditStory }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const supabase = supabaseClient();
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('publish_date', { ascending: false });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast({
        title: "שגיאה בטעינת הסיפורים",
        description: "לא ניתן היה לטעון את הסיפורים. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleDeleteClick = (story: Story) => {
    setStoryToDelete(story);
    setDeleteDialogOpen(true);
  };

  const handleDeleteStory = async () => {
    if (!storyToDelete) return;
    
    setIsDeleting(true);
    try {
      const supabase = supabaseClient();
      
      // Delete the associated files from storage first
      if (storyToDelete.pdf_url) {
        const pdfPath = storyToDelete.pdf_url.split('/').pop();
        if (pdfPath) {
          await supabase.storage.from('stories').remove([pdfPath]);
        }
      }
      
      if (storyToDelete.image_url) {
        const imagePath = storyToDelete.image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage.from('stories_img').remove([imagePath]);
        }
      }
      
      // Delete the record from the database
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyToDelete.id);

      if (error) throw error;
      
      setStories(stories.filter(story => story.id !== storyToDelete.id));
      setDeleteDialogOpen(false);
      setStoryToDelete(null);
      
      toast({
        title: "הסיפור נמחק בהצלחה",
        description: "הסיפור והקבצים המשויכים אליו נמחקו מהמערכת",
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "שגיאה במחיקת הסיפור",
        description: "לא ניתן היה למחוק את הסיפור. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: he });
    } catch (error) {
      return 'תאריך לא תקין';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div>
      {stories.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">לא נמצאו סיפורים במערכת.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table dir="rtl">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">תמונה</TableHead>
                <TableHead className="text-right">כותרת</TableHead>
                <TableHead className="text-right">תאריך פרסום</TableHead>
                <TableHead className="text-right">תקציר</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.map((story) => (
                <TableRow key={story.id}>
                  <TableCell>
                    {story.image_url ? (
                      <img
                        src={story.image_url}
                        alt={story.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500 text-xs">אין תמונה</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{story.title}</TableCell>
                  <TableCell>{formatDate(story.publish_date)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">{story.summary}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 flex-row-reverse">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditStory(story.id)}
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">ערוך</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-900 hover:bg-red-100"
                        onClick={() => handleDeleteClick(story)}
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">מחק</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת סיפור</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את הסיפור "{storyToDelete?.title}"?
              פעולה זו תמחק גם את קובץ ה-PDF והתמונה המשויכים אליו.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStory}
              disabled={isDeleting}
            >
              {isDeleting ? "מוחק..." : "מחק סיפור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoriesList;
