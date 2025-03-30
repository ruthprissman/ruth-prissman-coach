
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import MarkdownPreview from '@/components/admin/articles/MarkdownPreview';
import { supabaseClient } from '@/lib/supabaseClient';

const PoemView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poem, setPoemData] = useState<{
    title: string;
    content_markdown: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoem = async () => {
      try {
        setLoading(true);
        const supabase = supabaseClient();
        const today = new Date().toISOString();

        const { data, error } = await supabase
          .from('professional_content')
          .select(`
            id,
            title,
            content_markdown,
            article_publications (*)
          `)
          .eq('id', id)
          .eq('type', 'poem')
          .single();

        if (error) throw error;

        // Check if there's a valid publication for this poem
        const hasValidPublication = data?.article_publications?.some(
          (pub) => 
            pub.publish_location === 'Website' && 
            pub.published_date && 
            new Date(pub.published_date) <= new Date()
        );

        if (!data || !hasValidPublication) {
          throw new Error('שיר לא נמצא או לא פורסם עדיין');
        }

        setPoemData({
          title: data.title,
          content_markdown: data.content_markdown
        });
      } catch (err: any) {
        console.error('Error fetching poem:', err);
        setError(err.message || 'שגיאה בטעינת השיר');
        // Redirect to poems list after short delay on error
        setTimeout(() => navigate('/poems'), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPoem();
    }
  }, [id, navigate]);

  return (
    <>
      <Helmet>
        <title>{poem?.title || 'שיר'} | רות פריסמן - קוד הנפש</title>
        <meta name="description" content={`שיר מאת רות פריסמן - ${poem?.title || ''}`} />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <main className="flex-grow pt-24 px-4 md:px-8 lg:px-16 mx-auto w-full">
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-pulse text-purple-dark">טוען את השיר...</div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4 border border-red-200 rounded-md bg-red-50">
              {error}
            </div>
          ) : poem ? (
            <div className="mb-16">
              <h1 className="text-3xl md:text-4xl font-alef font-bold text-purple-dark text-center mb-12 gold-text-shadow">
                {poem.title}
              </h1>
              
              <div className="flex justify-center">
                <div className="w-full max-w-3xl mx-auto px-4 poem-container">
                  <div className="poem-content-columns">
                    <MarkdownPreview 
                      markdown={poem.content_markdown} 
                      className="text-lg leading-relaxed text-purple-dark poem-content" 
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-xl text-purple-dark">השיר לא נמצא</p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>

      {/* Add CSS for two-column poem layout */}
      <style>{`
        .poem-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
        }
        
        .poem-content-columns {
          column-count: 2;
          column-gap: 3rem;
          column-rule: 1px solid rgba(128, 0, 128, 0.1);
          margin: 0 auto;
          width: 100%;
          display: block;
          text-align: center;
        }
        
        @media (max-width: 768px) {
          .poem-content-columns {
            column-count: 1;
            column-gap: 0;
            column-rule: none;
          }
        }
        
        /* Force break between columns and prevent content from flowing across columns */
        .poem-content-columns > * {
          break-inside: avoid;
          page-break-inside: avoid;
          display: inline-block;
          width: 100%;
          text-align: center;
        }
        
        /* Additional styling for poem content */
        .poem-content p {
          margin-bottom: 1rem;
          text-align: center;
        }
      `}</style>
    </>
  );
};

export default PoemView;
