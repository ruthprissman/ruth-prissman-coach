
import React, { useState, useCallback, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { supabase, getSupabaseWithAuth } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ArticlesList from '@/components/admin/articles/ArticlesList';
import ArticleDialog from '@/components/admin/articles/ArticleDialog';
import { Article, Category } from '@/types/article';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ArticlesManagement: React.FC = () => {
  const { toast } = useToast();
  const { session: authSession } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;

      // Get articles with their related categories
      const { data: articlesData, error: articlesError } = await supabaseClient
        .from('professional_content')
        .select(`
          *,
          categories(*)
        `)
        .order('updated_at', { ascending: false });

      if (articlesError) throw articlesError;
      
      const { data: categoriesData, error: categoriesError } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      
      setArticles(articlesData || []);
      setFilteredArticles(articlesData || []);
      setCategories(categoriesData || []);
    } catch (error: any) {
      console.error('Error fetching articles:', error);
      setError(error.message || 'Could not fetch articles');
      toast({
        title: "שגיאה בטעינת המאמרים",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [authSession, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort articles when dependencies change
  useEffect(() => {
    if (articles.length === 0) return;
    
    let filtered = [...articles];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(article => 
        article.category_id === Number(categoryFilter)
      );
    }
    
    // Sort by title or date
    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      } else {
        return sortDirection === 'asc'
          ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
    
    setFilteredArticles(filtered);
  }, [searchTerm, categoryFilter, sortBy, sortDirection, articles]);

  const handleAddArticle = () => {
    setSelectedArticle(null);
    setIsDialogOpen(true);
  };

  const handleEditArticle = (article: Article) => {
    setSelectedArticle(article);
    setIsDialogOpen(true);
  };

  const handleArticleSaved = () => {
    setIsDialogOpen(false);
    setSelectedArticle(null);
    fetchData();
    toast({
      title: "המאמר נשמר בהצלחה",
      description: "המאמר נשמר במערכת",
    });
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const changeSortBy = (value: 'title' | 'date') => {
    if (sortBy === value) {
      toggleSortDirection();
    } else {
      setSortBy(value);
      setSortDirection('desc');
    }
  };

  return (
    <AdminLayout title="ניהול מאמרים">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium text-lg">{error}</p>
          <Button onClick={fetchData} className="mt-4">
            נסה שוב
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Button onClick={handleAddArticle}>
              <Plus className="ml-2 h-4 w-4" />
              מאמר חדש
            </Button>
            
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 pr-9 w-64"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקטגוריות</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <span className="text-sm text-muted-foreground">מיון לפי:</span>
            <Button 
              variant={sortBy === 'title' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => changeSortBy('title')}
            >
              כותרת {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            <Button 
              variant={sortBy === 'date' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => changeSortBy('date')}
            >
              תאריך {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
          </div>
          
          <ArticlesList 
            articles={filteredArticles} 
            categories={categories}
            onEdit={handleEditArticle}
            onRefresh={fetchData}
          />

          {isDialogOpen && (
            <ArticleDialog
              article={selectedArticle}
              categories={categories}
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              onSave={handleArticleSaved}
            />
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default ArticlesManagement;
