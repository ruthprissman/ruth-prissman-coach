
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Article } from '@/types/article';
import { supabase } from '@/lib/supabase';
import { ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { convertToHebrewDate } from '@/utils/dateUtils';

const ArticleView = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            *,
            categories (*)
          `)
          .eq('id', id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setArticle(data as Article);
        
        // Mark as read in localStorage
        const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
        if (!readArticles.includes(Number(id))) {
          localStorage.setItem('readArticles', JSON.stringify([...readArticles, Number(id)]));
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchArticle();
    }
  }, [id]);
  
  // Format the publication date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };
  
  // Get Hebrew date
  const hebrewDate = article?.published_at 
    ? convertToHebrewDate(new Date(article.published_at))
    : '';
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link to="/articles">
              <Button variant="ghost" className="text-purple-dark hover:text-purple-darkest">
                <ChevronRight className="ml-1" size={16} />
                חזרה למאמרים
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="max-w-3xl mx-auto">
              <Skeleton className="w-full h-14 mb-4" />
              <Skeleton className="w-1/3 h-8 mb-10" />
              <Skeleton className="w-full h-64" />
            </div>
          ) : article ? (
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-alef font-bold text-purple-darkest mb-4">
                {article.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 mb-8 space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
                <div className="flex items-center">
                  <Calendar size={16} className="ml-2 text-gold" />
                  <span className="text-gold-dark">{hebrewDate}</span>
                </div>
                <span className="hidden sm:block text-gray-400">|</span>
                <span>{formatDate(article.published_at)}</span>
                
                {article.categories && (
                  <>
                    <span className="hidden sm:block text-gray-400">|</span>
                    <span className="inline-block bg-purple-light/10 text-purple-dark px-2 py-1 rounded-full text-xs">
                      {article.categories.name}
                    </span>
                  </>
                )}
              </div>
              
              <div className="prose prose-lg max-w-none">
                {/* Render the markdown content safely */}
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: article.content_markdown ? article.content_markdown
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&#039;')
                      .replace(/\n/g, '<br />') 
                    : '' 
                  }} 
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500">המאמר לא נמצא</p>
              <Link to="/articles">
                <Button variant="outline" className="mt-4">
                  חזרה למאמרים
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ArticleView;
