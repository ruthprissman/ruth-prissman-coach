
import React, { useState, useCallback, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Plus, Search, Check, Clock, CalendarIcon, ArrowUpDown } from 'lucide-react';
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
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Fetch articles and categories
  const fetchData = useCallback(async () => {
    if (isLoading && hasAttemptedFetch) return;
    
    setIsLoading(true);
    setHasAttemptedFetch(true);
    setError(null);
    
    try {
      const supabaseClient = authSession?.access_token 
        ? getSupabaseWithAuth(authSession.access_token)
        : supabase;

      // Fetch articles with categories
      const { data: articlesData, error: articlesError } = await supabaseClient
        .from('professional_content')
        .select(`
          *,
          categories(*)
        `)
        .order('created_at', { ascending: false });

      if (articlesError) throw articlesError;
      
      // Fetch categories for filters
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
  }, [authSession, toast, hasAttemptedFetch, isLoading]);

  // Initial data fetch
  useEffect(() => {
    if (!hasAttemptedFetch) {
      fetchData();
    }
  }, [fetchData, hasAttemptedFetch]);

  // Apply filters and sorting
  useEffect(() => {
    if (articles.length === 0) return;
    
    try {
      let filtered = [...articles];
      
      // Apply search term filter
      if (searchTerm) {
        filtered = filtered.filter(article => 
          article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply category filter
      if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(article => 
          article.category_id?.toString() === categoryFilter
        );
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        if (sortBy === 'title') {
          return sortDirection === 'asc' 
            ? (a.title || '').localeCompare(b.title || '') 
            : (b.title || '').localeCompare(a.title || '');
        } else {
          // Sort by publication date or created date as fallback
          const dateA = a.published_at || a.created_at;
          const dateB = b.published_at || b.created_at;
          
          return sortDirection === 'asc'
            ? new Date(dateA).getTime() - new Date(dateB).getTime()
            : new Date(dateB).getTime() - new Date(dateA).getTime();
        }
      });
      
      setFilteredArticles(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
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
    setHasAttemptedFetch(false);
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

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortBy('date');
    setSortDirection('desc');
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
          <Button 
            onClick={() => {
              setHasAttemptedFetch(false);
              fetchData();
            }}
            className="mt-4"
          >
            נסה שוב
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <Button 
              onClick={handleAddArticle}
              className="shrink-0"
            >
              <Plus className="ml-2 h-4 w-4" />
              מאמר חדש
            </Button>
            
            <div className="flex flex-1 w-full sm:w-auto gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש לפי כותרת או קטגוריה..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 pr-9"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקטגוריות</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Sorting Controls */}
          <div className="flex gap-2 items-center justify-end">
            <span className="text-sm text-muted-foreground">מיון לפי:</span>
            <div className="flex gap-1">
              <Button 
                variant={sortBy === 'title' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => changeSortBy('title')}
                className="text-xs"
              >
                כותרת {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </Button>
              <Button 
                variant={sortBy === 'date' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => changeSortBy('date')}
                className="text-xs"
              >
                תאריך {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </Button>
            </div>
            
            {(searchTerm || categoryFilter !== 'all' || sortBy !== 'date' || sortDirection !== 'desc') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="text-xs"
              >
                איפוס סינון
              </Button>
            )}
          </div>
          
          {/* Articles List */}
          <ArticlesList 
            articles={filteredArticles} 
            categories={categories}
            onEdit={handleEditArticle}
            onRefresh={() => {
              setHasAttemptedFetch(false);
              fetchData();
            }}
          />

          {/* Article Dialog */}
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
