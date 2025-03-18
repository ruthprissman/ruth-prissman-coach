
import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { supabaseClient as supabase } from '@/lib/supabaseClient';
import { Article } from '@/types/article';
import ArticleCard from '@/components/ArticleCard';
import ArticleFilters from '@/components/ArticleFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            *,
            categories (*),
            article_publications (*)
          `)
          .not('published_at', 'is', null)
          .order('published_at', { ascending: false });

        if (error) {
          throw error;
        }

        const articlesData = data as Article[];
        setArticles(articlesData);
        setFilteredArticles(articlesData);

        const uniqueCategories = Array.from(
          new Map(
            articlesData
              .filter(article => article.category_id !== null && article.categories !== null)
              .map(article => [article.categories!.id, article.categories!])
          ).values()
        );

        setCategories(uniqueCategories as { id: number; name: string }[]);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  useEffect(() => {
    let filtered = [...articles];

    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title?.toLowerCase().includes(lowercaseQuery)
      );
    }

    if (selectedCategory !== null) {
      filtered = filtered.filter(article => article.category_id === selectedCategory);
    }

    const now = new Date();
    console.log("🛠️ [Articles] Current date for filtering:", now);
    
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      console.log("🛠️ [Articles] Month ago date for filtering:", monthAgo);
      
      filtered = filtered.filter(article => {
        const publicationDateStr = article.article_publications && 
          article.article_publications.length > 0 && 
          article.article_publications[0].scheduled_date
            ? article.article_publications[0].scheduled_date
            : article.published_at;
            
        if (!publicationDateStr) return false;
        console.log(`🛠️ [Articles] Filtering article ${article.id} with date:`, publicationDateStr);
        
        const utcDate = new Date(publicationDateStr);
        console.log("🛠️ [Articles] UTC Date object:", utcDate);
        
        // For filtering purposes, compare in UTC
        const result = utcDate >= monthAgo && utcDate <= now;
        console.log(`🛠️ [Articles] Article ${article.id} month filter result:`, result);
        
        return result;
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      console.log("🛠️ [Articles] Week ago date for filtering:", weekAgo);
      
      filtered = filtered.filter(article => {
        const publicationDateStr = article.article_publications && 
          article.article_publications.length > 0 && 
          article.article_publications[0].scheduled_date
            ? article.article_publications[0].scheduled_date
            : article.published_at;
            
        if (!publicationDateStr) return false;
        console.log(`🛠️ [Articles] Filtering article ${article.id} with date:`, publicationDateStr);
        
        const utcDate = new Date(publicationDateStr);
        console.log("🛠️ [Articles] UTC Date object:", utcDate);
        
        // For filtering purposes, compare in UTC
        const result = utcDate >= weekAgo && utcDate <= now;
        console.log(`🛠️ [Articles] Article ${article.id} week filter result:`, result);
        
        return result;
      });
    }

    setFilteredArticles(filtered);
  }, [articles, searchQuery, selectedCategory, dateFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-purple-darkest mb-8 text-center">מאמרים</h1>
          
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
              <div className="relative w-full md:w-1/3 flex flex-col">
                <Label htmlFor="search" className="mb-2">חיפוש</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="search"
                    type="text"
                    placeholder="חיפוש מאמרים..."
                    className="pr-10 text-right h-10 filter-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    dir="rtl"
                  />
                </div>
              </div>
              
              <ArticleFilters 
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex flex-col">
                  <Skeleton className="w-full h-48 rounded-t-lg" />
                  <Skeleton className="w-3/4 h-8 mt-4" />
                  <Skeleton className="w-1/2 h-6 mt-2" />
                </div>
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500">לא נמצאו מאמרים התואמים את החיפוש</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      <style>
        {`
        .filter-input {
          height: 40px !important;
          text-align: right !important;
        }

        .write-to-me {
          color: #4A235A !important;
          font-weight: bold !important;
          transition: color 0.3s ease;
        }
        
        .write-to-me:hover {
          color: #7E69AB !important;
        }
        `}
      </style>
    </div>
  );
};

export default Articles;
