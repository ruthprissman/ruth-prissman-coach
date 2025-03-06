
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { RefreshCw } from 'lucide-react';
import { supabase, getSupabaseWithAuth } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePublication } from '@/contexts/PublicationContext';
import { FailedPublication } from '@/types/article';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const FailedPublicationsPanel: React.FC = () => {
  const [failedPublications, setFailedPublications] = useState<FailedPublication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState<number | null>(null);
  const { session } = useAuth();
  const { retryPublication } = usePublication();
  const { toast } = useToast();

  const fetchFailedPublications = async () => {
    setIsLoading(true);
    
    try {
      const supabaseClient = session?.access_token 
        ? getSupabaseWithAuth(session.access_token) 
        : supabase;
      
      const now = new Date().toISOString();
      
      // Fetch publications where scheduled_date is in the past but published_date is null
      const { data, error } = await supabaseClient
        .from('article_publications')
        .select(`
          id,
          content_id,
          publish_location,
          scheduled_date,
          professional_content:content_id (
            title
          )
        `)
        .lte('scheduled_date', now)
        .is('published_date', null)
        .order('scheduled_date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const failed: FailedPublication[] = data.map(pub => ({
          id: pub.id,
          content_id: pub.content_id,
          article_title: pub.professional_content.title,
          publish_location: pub.publish_location,
          scheduled_date: pub.scheduled_date,
        }));
        
        setFailedPublications(failed);
      }
    } catch (error: any) {
      console.error('Error fetching failed publications:', error);
      toast({
        title: "שגיאה בטעינת פרסומים שנכשלו",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchFailedPublications();
    }
  }, [session]);

  const handleRetry = async (publicationId: number) => {
    setIsRetrying(publicationId);
    
    try {
      await retryPublication(publicationId);
      
      // Update list after successful retry
      setFailedPublications(prev => 
        prev.filter(pub => pub.id !== publicationId)
      );
      
    } catch (error) {
      console.error('Error retrying publication:', error);
    } finally {
      setIsRetrying(null);
    }
  };

  const handleRefresh = () => {
    fetchFailedPublications();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 border p-4 rounded-md">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">פרסומים שלא בוצעו</h3>
          <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">פרסומים שלא בוצעו</h3>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {failedPublications.length === 0 ? (
        <div className="text-center text-muted-foreground p-4 border border-dashed rounded-md">
          אין פרסומים שלא בוצעו.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>כותרת המאמר</TableHead>
              <TableHead>מיקום פרסום</TableHead>
              <TableHead>תאריך מתוכנן</TableHead>
              <TableHead className="w-[120px]">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {failedPublications.map((pub) => (
              <TableRow key={pub.id}>
                <TableCell>{pub.article_title}</TableCell>
                <TableCell>{pub.publish_location}</TableCell>
                <TableCell>
                  {format(new Date(pub.scheduled_date), "dd/MM/yyyy HH:mm", { locale: he })}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRetry(pub.id)}
                    disabled={isRetrying === pub.id}
                  >
                    {isRetrying === pub.id ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    נסה שוב
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default FailedPublicationsPanel;
