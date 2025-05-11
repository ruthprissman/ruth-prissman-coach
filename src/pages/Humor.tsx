
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import ArticleCard from '@/components/ArticleCard';
import { supabaseClient } from '@/lib/supabaseClient';
import { Article } from '@/types/article';

const Humor = () => {
  const [humorContent, setHumorContent] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHumorContent = async () => {
      setLoading(true);
      try {
        // Added logging for Supabase client initialization
        if (process.env.NODE_ENV === 'development') {
          console.log('[humor page] Initializing Supabase client');
        }

        const supabase = supabaseClient();

        // Added logging for Supabase client details
        if (process.env.NODE_ENV === 'development') {
          console.log('[humor page] Supabase client initialized:', supabase);
        }

        // Added logging before running the query
        if (process.env.NODE_ENV === 'development') {
          console.log('[humor page] Running query for humor content');
        }

        const today = new Date().toISOString();

        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            *,
            categories (*),
            article_publications (*)
          `)
          .eq('type', 'humor')
          .filter('article_publications.publish_location', 'eq', 'Website')
          .lte('article_publications.published_date', today);

        if (error) throw error;

        // Development mode logging for raw Supabase data
        if (process.env.NODE_ENV === 'development') {
          console.log('[humor page] Raw Supabase data:', data);
        }

        // Filter out items with no publications or unpublished items
        const publishedContent = data.filter(item => 
          item.article_publications && 
          item.article_publications.length > 0 && 
          item.article_publications.some(pub => 
            pub.publish_location === 'Website' && 
            pub.published_date && 
            new Date(pub.published_date) <= new Date()
          )
        );

        // Development mode logging for published content
        if (process.env.NODE_ENV === 'development') {
          console.log(`[humor page] Found ${publishedContent.length} published humor items`);
          
          if (publishedContent.length === 0) {
            console.log('[humor page] No humor articles found or filtering failed.');
          }
        }

        setHumorContent(publishedContent as Article[]);
      } catch (err: any) {
        console.error('[humor page] Error fetching humor content:', err);
        setError(err.message || 'אירעה שגיאה בטעינת התוכן');
      } finally {
        setLoading(false);
      }
    };

    fetchHumorContent();
  }, []);

  return (
    <>
      <Helmet>
        <title>לצחוק ברצינות | רות פריסמן - קוד הנפש</title>
        <meta name="description" content="שירים מצחיקים ותוכן עם חיוך מאת רות פריסמן - קוד הנפש. מבט קליל ומשעשע על החיים." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <main className="flex-grow pt-24 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto w-full">
          <h1 className="text-4xl md:text-5xl font-alef text-center text-[#4A235A] mb-10 gold-text-shadow">
            לצחוק ברצינות
          </h1>
          
          <p className="text-center text-lg md:text-xl text-[#4A235A] mb-8 max-w-3xl mx-auto font-alef">
            גם בתוך תהליכים עמוקים – מותר (ואפילו חשוב) לצחוק. 
            <br />
            כאן תמצאו שירים עם קריצה, שנכתבו מתוך החיים עצמם.
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-pulse text-purple-dark">טוען תוכן...</div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4 border border-red-200 rounded-md bg-red-50">
              {error}
            </div>
          ) : humorContent.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-xl text-purple-dark">לא נמצא תוכן</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {humorContent.map((item) => (
                <div className="h-full" key={item.id}>
                  <ArticleCard article={item} basePath="/humor" />
                </div>
              ))}
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Humor;
