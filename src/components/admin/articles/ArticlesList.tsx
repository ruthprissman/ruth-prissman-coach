
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Edit, Trash2, Check, Clock, Send, RefreshCw } from 'lucide-react';
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
import PublishModal from './PublishModal';
import PublicationService, { EmailDeliveryStats } from '@/services/PublicationService';

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
  const [articleToPublish, setArticleToPublish] = useState<Article | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [emailStats, setEmailStats] = useState<Map<number, EmailDeliveryStats>>(new Map());
  const [retryingEmails, setRetryingEmails] = useState<number[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (articles.length > 0) {
      fetchEmailStats();
    }
  }, [articles]);

  const fetchEmailStats = async () => {
    try {
      setIsLoadingStats(true);
      const publicationService = PublicationService.getInstance();
      publicationService.start(authSession?.access_token);
      
      const statsMap = new Map<number, EmailDeliveryStats>();
      
      // Process articles in batches to avoid too many parallel requests
      const batchSize = 5;
      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        const statsPromises = batch.map(article => 
          publicationService.getEmailDeliveryStats(article.id)
        );
        
        const batchResults = await Promise.all(statsPromises);
        
        batchResults.forEach((stats, index) => {
          if (stats) {
            statsMap.set(batch[index].id, stats);
          }
        });
      }
      
      setEmailStats(statsMap);
    } catch (error) {
      console.error('Error fetching email stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleRetryFailedEmails = async (articleId: number) => {
    try {
      setRetryingEmails(prev => [...prev, articleId]);
      
      const publicationService = PublicationService.getInstance();
      publicationService.start(authSession?.access_token);
      
      const retriedCount = await publicationService.retryFailedEmails(articleId);
      
      if (retriedCount > 0) {
        toast({
          title: "מיילים נשלחו שוב",
          description: `נשלחו ${retriedCount} מיילים שנכשלו בעבר`,
        });
        
        // After successful retry, refresh the article list to update the status
        onRefresh();
      } else {
        toast({
          title: "אין מיילים לשליחה חוזרת",
          description: "לא נמצאו מיילים שנכשלו לשליחה חוזרת",
        });
      }
      
      // Update stats after retry
      await fetchEmailStats();
    } catch (error: any) {
      toast({
        title: "שליחה חוזרת נכשלה",
        description: error.message || "אירעה שגיאה בשליחה חוזרת של המיילים",
        variant: "destructive",
      });
    } finally {
      setRetryingEmails(prev => prev.filter(id => id !== articleId));
    }
  };

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

  const handlePublishNow = (article: Article) => {
    setArticleToPublish(article);
    setIsPublishModalOpen(true);
  };

  const handlePublishSuccess = () => {
    onRefresh();
    // Refresh email stats after successful publish
    fetchEmailStats();
  };

  // Get article status based on publications
  const getArticleStatus = (article: Article) => {
    if (article.published_at) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
          <Check className="h-3 w-3 ml-1" />
          פורסם
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-100">
          <Clock className="h-3 w-3 ml-1" />
          טיוטה
        </Badge>
      );
    }
  };

  // Render email delivery status
  const renderEmailDeliveryStatus = (articleId: number) => {
    const stats = emailStats.get(articleId);
    
    if (!stats) {
      return null;
    }
    
    return (
      <div className="mt-2 text-xs space-y-1">
        {stats.totalSent > 0 && (
          <div className="flex items-center">
            <Badge variant="outline" className="bg-green-50 text-green-700 mr-1">
              <Check className="h-3 w-3 ml-1" />
              נשלח ל-{stats.totalSent} נמענים
            </Badge>
          </div>
        )}
        
        {stats.totalFailed > 0 && (
          <div className="flex items-center">
            <Badge 
              variant="outline" 
              className="bg-red-50 text-red-700 mr-1"
            >
              נכשל עבור {stats.totalFailed} נמענים
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 p-1 ml-1 hover:bg-red-50"
              onClick={() => handleRetryFailedEmails(articleId)}
              disabled={retryingEmails.includes(articleId)}
            >
              {retryingEmails.includes(articleId) ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="mr-1 text-xs">נסה שוב</span>
            </Button>
          </div>
        )}
      </div>
    );
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
                <TableHead>תאריך יצירה</TableHead>
                <TableHead>תאריך פרסום מתוכנן</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">
                    <div>
                      {article.title}
                      {renderEmailDeliveryStatus(article.id)}
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryName(article.category_id)}</TableCell>
                  <TableCell>{formatDate(article.created_at)}</TableCell>
                  <TableCell>{formatDate(article.scheduled_publish)}</TableCell>
                  <TableCell>{getArticleStatus(article)}</TableCell>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishNow(article)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        פרסם
                      </Button>
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

      {/* Publish Modal */}
      <PublishModal
        article={articleToPublish}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={handlePublishSuccess}
      />
    </>
  );
};

export default ArticlesList;
