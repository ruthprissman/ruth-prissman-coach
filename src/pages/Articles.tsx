import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { Article, Category } from '@/types/article';
import { Spinner } from '@/components/Spinner';
import PublicLayout from '@/components/PublicLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ArticleGrid from '@/components/articles/ArticleGrid';
import { Search } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/use-document-title';

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('הכל');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useDocumentTitle('מאמרים מקצועיים');
  
  useEffect(() => {
    if (searchTerm) {
      document.dir = 'rtl';
    } else {
      document.dir = 'ltr';
    }
  }, [searchTerm]);
  
  useEffect(() => {
    if (selectedCategory === 'הכל') {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article =>
        article.categories.some((category: Category) => category.name === selectedCategory)
      );
      setFilteredArticles(filtered);
    }
  }, [selectedCategory, articles]);
  
  useEffect(() => {
    if (searchTerm) {
      const filtered = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredArticles(filtered);
    } else {
      if (selectedCategory === 'הכל') {
        setFilteredArticles(articles);
      } else {
        const filtered = articles.filter(article =>
          article.categories.some((category: Category) => category.name === selectedCategory)
        );
        setFilteredArticles(filtered);
      }
    }
  }, [searchTerm, articles, selectedCategory]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true);
        
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            *,
            categories(*)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setArticles(data as Article[]);
        setFilteredArticles(data as Article[]);
        
        // Get unique categories
        const uniqueCats = Array.from(
          new Set(
            data.flatMap(article => 
              article.categories.map((category: Category) => category.name)
            )
          )
        );
        
        setCategories(['הכל', ...uniqueCats]);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setError('אירעה שגיאה בטעינת המאמרים. אנא נסה שוב.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticles();
  }, []);

  return (
    <PublicLayout>
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-semibold text-center mb-8">מאמרים מקצועיים</h1>
        
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center w-full md:w-auto">
            <Input
              type="search"
              placeholder="חיפוש מאמר..."
              className="w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" size="icon" className="ml-2">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="בחר קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <ArticleGrid articles={filteredArticles} />
        )}
      </div>
    </PublicLayout>
  );
};

export default Articles;

