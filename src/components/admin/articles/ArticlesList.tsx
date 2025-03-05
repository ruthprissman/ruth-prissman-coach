
import React, { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Edit, Trash2, Check, Clock, Eye } from 'lucide-react';
import { Article, Category } from '@/types/article';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, getSupabaseWithAuth } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ArticlesListProps {
  articles: Article[];
  categories: Category[];
  onEdit: (article: Article) => void;
  onRefresh: () => void;
}

const ArticlesList: React.FC<ArticlesListProps> = ({ 
  articles, 
  categories,
  onEdit,
  onRefresh
}) => {
  const { toast } = useToast();
  const { session: authSession } = useAuth();
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '-';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: he });
    } catch (e) {
      return dateString;
    }
  };

  const handleDeleteClick = (article: Article) => {
    setArticleToDelete(article);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;
      
      // Delete any content publish options first (if they exist)
      await supabaseClient
        .from('content_publish_options')
        .delete()
        .eq('content_id', articleToDelete.id);
      
      // Delete the article
      const { error } = await supabaseClient
        .from('professional_content')
        .delete()
        .eq('id', articleToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "המאמר נמחק בהצלחה",
        description: "המאמר הוסר מהמערכת",
      });
      
      setArticleToDelete(null);
      onRefresh();
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

  const cancelDelete = () => {
    setArticleToDelete(null);
  };

  const handlePublishNow = async (article: Article) => {
    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;
      
      const now = new Date().toISOString();
      
      const { error } = await supabaseClient
        .from('professional_content')
        .update({ published_at: now })
        .eq('id', article.id);
      
      if (error) throw error;
      
      toast({
        title: "המאמר פורסם בהצלחה",
        description: "המאמר זמין כעת לציבור",
      });
      
      onRefresh();
    } catch (error: any) {
      console.error('Error publishing article:', error);
      toast({
        title: "שגיאה בפרסום המאמר",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-md border shadow-sm overflow-hidden">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">לא נמצאו מאמרים. הוסף מאמר חדש כדי להתחיל.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>כותרת</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>תאריך פרסום מתוכנן</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{getCategoryName(article.category_id)}</TableCell>
                  <TableCell>{formatDate(article.scheduled_publish)}</TableCell>
                  <TableCell>
                    {article.published_at ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                        <Check className="h-3 w-3 ml-1" />
                        פורסם
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100">
                        <Clock className="h-3 w-3 ml-1" />
                        טיוטה
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(article)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(article)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      {!article.published_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublishNow(article)}
                        >
                          פרסם עכשיו
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!articleToDelete} onOpenChange={() => !isDeleting && cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>האם למחוק את המאמר?</DialogTitle>
            <DialogDescription>
              פעולה זו תמחק לצמיתות את המאמר "{articleToDelete?.title}" וכל המידע הקשור אליו.
              פעולה זו אינה ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "מוחק..." : "מחק"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ArticlesList;
