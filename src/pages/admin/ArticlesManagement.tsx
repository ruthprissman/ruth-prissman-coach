
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ArticlesList from '@/components/admin/articles/ArticlesList';
import FailedPublicationsPanel from '@/components/admin/articles/FailedPublicationsPanel';
import { Button } from '@/components/ui/button';
import { Article, Category } from '@/types/article';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseClient } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { usePublication } from '@/contexts/PublicationContext';

const ArticlesManagement: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const { manualCheckPublications, isInitialized } = usePublication();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      
      // Await the supabaseClient to get the actual client instance
      const supabaseInstance = await supabaseClient();
      
      const { data, error } = await supabaseInstance
        .from('professional_content')
        .select(`
          *,
          categories(*),
          article_publications(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setArticles(data || []);
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      toast({
        title: "שגיאה בטעינת המאמרים",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      // Await the supabaseClient to get the actual client instance
      const supabaseInstance = await supabaseClient();
      
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
  };
  
  // Initial data loading
  useEffect(() => {
    if (session) {
      Promise.all([fetchArticles(), fetchCategories()]);
    }
  }, [session]);
  
  // Run publication check only once when the service is initialized
  useEffect(() => {
    if (session && isInitialized && !initialCheckDone) {
      console.log('[ArticlesManagement] Initial publication check');
      manualCheckPublications();
      setInitialCheckDone(true);
    }
  }, [session, isInitialized, initialCheckDone, manualCheckPublications]);
  
  const handleEditArticle = (article: Article) => {
    navigate(`/admin/articles/edit/${article.id}`);
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchArticles();
    // Also check for new publications when manually refreshing
    await manualCheckPublications();
    setIsRefreshing(false);
  };
  
  return (
    <AdminLayout title="ניהול מאמרים">
      <div className="space-y-6">
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            רענן רשימה
          </Button>
          
          <Button 
            onClick={() => navigate('/admin/articles/new')} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            מאמר חדש
          </Button>
        </div>
        
        <FailedPublicationsPanel />
        
        <ArticlesList 
          articles={articles}
          categories={categories}
          onEdit={handleEditArticle}
          onRefresh={fetchArticles}
        />
      </div>
    </AdminLayout>
  );
};

export default ArticlesManagement;
