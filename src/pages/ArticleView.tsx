import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseClient } from '@/lib/supabaseClient';
import { Spinner } from '@/components/Spinner';
import { Article } from '@/types/article';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import ArticleContent from '@/components/articles/ArticleContent';
import ArticleSidebar from '@/components/articles/ArticleSidebar';
import { useDocumentTitle } from '@/hooks/use-document-title';
import NotFoundPage from './NotFound';

const ArticleView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  useDocumentTitle(article ? article.title : 'מאמר לא נמצא');
  
  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            *,
            categories(*)
          `)
          .eq('slug', slug)
          .eq('is_published', true)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            setNotFound(true);
          } else {
            throw error;
          }
        } else {
          setArticle(data as unknown as Article);
          // Track view
          await trackArticleView(data.id);
        }
      } catch (error: any) {
        console.error('Error fetching article:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArticle();
  }, [slug]);
  
  const trackArticleView = async (articleId: number) => {
    try {
      const supabase = supabaseClient();
      await supabase
        .from('article_views')
        .insert([
          { article_id: articleId }
        ]);
    } catch (error) {
      console.error('Error tracking article view:', error);
      // Non-critical error, we don't need to show it to the user
    }
  };
  
  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </PublicLayout>
    );
  }
  
  if (error) {
    return (
      <PublicLayout>
        <div className="text-red-500 text-center mt-8">
          {error}
        </div>
      </PublicLayout>
    );
  }
  
  if (notFound || !article) {
    return <NotFoundPage />;
  }
  
  return (
    <PublicLayout>
      <div className="container mx-auto mt-8 flex flex-col lg:flex-row gap-8">
        <main className="lg:w-3/4">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          
          <div className="text-gray-500 mb-4">
            פורסם לפני {formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale: he })}
          </div>
          
          <ArticleContent content={article.content} />
          
          <Link to="/articles" className="inline-flex items-center mt-8 text-purple-600 hover:underline">
            <ArrowRight className="h-4 w-4 ml-1" />
            לכל המאמרים
          </Link>
        </main>
        
        <aside className="lg:w-1/4">
          <ArticleSidebar />
        </aside>
      </div>
    </PublicLayout>
  );
};

export default ArticleView;
