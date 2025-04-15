
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { he } from 'date-fns/locale/he';
import { ChevronRight } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { supabaseClient } from '@/lib/supabaseClient';
import { Article } from '@/types/article';
import MarkdownIt from 'markdown-it';

const HumorView = () => {
  const { id } = useParams<{ id: string }>();
  const [humorItem, setHumorItem] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const md = new MarkdownIt();

  useEffect(() => {
    const fetchHumorItem = async () => {
      setLoading(true);
      try {
        console.log(`[humor view] Fetching humor item with id: ${id}`);
        const supabase = supabaseClient();
        
        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            *,
            categories (*)
          `)
          .eq('id', id)
          .eq('type', 'humor')
          .single();
        
        if (error) throw error;
        
        console.log('[humor view] Humor item retrieved:', data);
        setHumorItem(data as Article);
      } catch (err: any) {
        console.error('[humor view] Error fetching humor item:', err);
        setError(err.message || 'אירעה שגיאה בטעינת התוכן');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHumorItem();
    }
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd MMMM, yyyy', { locale: he });
  };

  const renderedContent = humorItem?.content_markdown 
    ? md.render(humorItem.content_markdown) 
    : '';

  return (
    <>
      <Helmet>
        <title>{humorItem?.title || 'טוען...'} | רות פריסמן - קוד הנפש</title>
        <meta 
          name="description" 
          content={humorItem?.content_markdown?.substring(0, 150) || 'תוכן עם חיוך מאת רות פריסמן'}
        />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <main className="flex-grow pt-24 px-4 md:px-8 lg:px-16 max-w-4xl mx-auto w-full">
          {loading ? (
            <div className="flex justify-center items-center min-h-[50vh]">
              <div className="animate-pulse text-purple-dark">טוען...</div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4 border border-red-200 rounded-md bg-red-50">
              {error}
            </div>
          ) : humorItem ? (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <Link 
                    to="/humor" 
                    className="inline-flex items-center text-purple-dark hover:text-gold transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 ml-1" />
                    <span>חזרה לכל התוכן</span>
                  </Link>
                </div>

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-dark mb-4">
                  {humorItem.title}
                </h1>

                {humorItem.published_at && (
                  <div className="text-gray-500 text-sm mb-4">
                    {formatDate(humorItem.published_at)}
                  </div>
                )}

                {humorItem.image_url && (
                  <div className="mb-6">
                    <img 
                      src={humorItem.image_url} 
                      alt={humorItem.title} 
                      className="w-full h-auto rounded-md object-cover max-h-[400px]"
                    />
                  </div>
                )}

                <div 
                  className="prose prose-lg max-w-none article-content"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-xl text-purple-dark">התוכן לא נמצא</p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default HumorView;
