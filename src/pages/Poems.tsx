
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import ArticleCard from '@/components/ArticleCard';
import { supabaseClient } from '@/lib/supabaseClient';
import { Article } from '@/types/article';

const Poems = () => {
  const [poems, setPoems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoems = async () => {
      setLoading(true);
      try {
        const supabase = supabaseClient();
        const today = new Date().toISOString();

        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            *,
            categories (*),
            article_publications (*)
          `)
          .eq('type', 'poem')
          .filter('article_publications.publish_location', 'eq', 'Website')
          .lte('article_publications.published_date', today);

        if (error) throw error;

        // Filter out items with no publications or unpublished items
        const publishedPoems = data.filter(poem => 
          poem.article_publications && 
          poem.article_publications.length > 0 && 
          poem.article_publications.some(pub => 
            pub.publish_location === 'Website' && 
            pub.published_date && 
            new Date(pub.published_date) <= new Date()
          )
        );

        setPoems(publishedPoems as Article[]);
      } catch (err: any) {
        console.error('Error fetching poems:', err);
        setError(err.message || 'אירעה שגיאה בטעינת השירים');
      } finally {
        setLoading(false);
      }
    };

    fetchPoems();
  }, []);

  return (
    <>
      <Helmet>
        <title>שירים | רות פריסמן - קוד הנפש</title>
        <meta name="description" content="שירים מאת רות פריסמן - קוד הנפש. מבט חדש על חיים מוכרים." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <main className="flex-grow pt-24 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto w-full">
          <h1 className="text-4xl md:text-5xl font-alef text-center text-[#D6BCFA] mb-10 gold-text-shadow">
            שירים
          </h1>
          
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-pulse text-purple-dark">טוען שירים...</div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4 border border-red-200 rounded-md bg-red-50">
              {error}
            </div>
          ) : poems.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-xl text-purple-dark">לא נמצאו שירים</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {poems.map((poem) => (
                <Link to={`/poems/${poem.id}`} key={poem.id} className="no-underline">
                  <ArticleCard article={poem} basePath="/poems" />
                </Link>
              ))}
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Poems;
