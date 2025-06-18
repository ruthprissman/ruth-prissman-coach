
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
import MarkdownPreview from '@/components/admin/articles/MarkdownPreview';

const HumorView = () => {
  const { id } = useParams<{ id: string }>();
  const [humorItem, setHumorItem] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        <main className="flex-grow pt-24 px-4 md:px-8 lg:px-16 mx-auto w-full">
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-pulse text-purple-dark">טוען את התוכן...</div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4 border border-red-200 rounded-md bg-red-50">
              {error}
            </div>
          ) : humorItem ? (
            <div className="mb-16">
              <div className="mb-6">
                <Link 
                  to="/humor" 
                  className="inline-flex items-center text-purple-dark hover:text-gold transition-colors"
                >
                  <ChevronRight className="h-4 w-4 ml-1" />
                  <span>חזרה לכל התכנים</span>
                </Link>
              </div>

              <h1 className="text-3xl md:text-4xl font-alef font-bold text-purple-dark text-center mb-12 gold-text-shadow">
                {humorItem.title}
              </h1>

              <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
                {humorItem.image_url && (
                  <div className="lg:w-1/3">
                    <img 
                      src={humorItem.image_url} 
                      alt={humorItem.title} 
                      className="w-full h-auto rounded-lg shadow-md object-contain"
                    />
                  </div>
                )}
                
                <div className={`flex-1 ${humorItem.image_url ? 'lg:w-2/3' : 'w-full'}`}>
                  <div className="poem-container">
                    <div className="poem-content">
                      <MarkdownPreview 
                        markdown={humorItem.content_markdown || ''} 
                        className="poem-text" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {humorItem.published_at && (
                <div className="text-center text-gray-500 text-sm mt-8">
                  {formatDate(humorItem.published_at)}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-xl text-purple-dark">התוכן לא נמצא</p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>

      <style>{`
        .poem-container {
          padding: 0 1rem;
        }
        
        .poem-content {
          column-count: 2;
          column-gap: 2.5rem;
          column-rule: 1px solid rgba(128, 0, 128, 0.2);
          text-align: center;
        }
        
        .poem-text {
          text-align: center;
          font-size: 1.125rem;
          line-height: 1.75;
          color: #4A235A;
        }
        
        .poem-text p {
          margin-bottom: 1.5rem;
          break-inside: avoid;
          text-align: center;
          display: block;
        }
        
        .poem-text p:empty {
          min-height: 1.5rem;
          margin-bottom: 1.5rem;
          display: block;
          visibility: visible;
        }
        
        @media (max-width: 1024px) {
          .poem-content {
            column-count: 2;
          }
        }
        
        @media (max-width: 768px) {
          .poem-content {
            column-count: 1;
          }
        }
        
        .gold-text-shadow {
          text-shadow: 1px 1px 2px rgba(212, 175, 55, 0.3);
        }
      `}</style>
    </>
  );
};

export default HumorView;
